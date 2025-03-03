/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import ModbusRTU from 'modbus-serial';
import { Socket } from 'net';
import { logBits, writeBitsToBuffer } from '../../helpers/bits';
import { IBaseLogger } from '../../helpers/log';
import { validateValue } from '../../helpers/validate-value';
import { createRegisterBatches } from '../../repositories/device-repository/helpers/register-batches';
import { ModbusDevice } from '../../repositories/device-repository/models/modbus-device';
import { AccessMode } from '../../repositories/device-repository/models/enum/access-mode';
import { RegisterType } from '../../repositories/device-repository/models/enum/register-type';
import { ModbusRegister, ModbusRegisterParseConfiguration } from '../../repositories/device-repository/models/modbus-register';
import { IAPI } from '../iapi';

/**
 * Represents a Modbus API.
 */
export class ModbusAPI implements IAPI {
    public client: ModbusRTU;

    private host: string;
    private port: number;
    private unitId: number;
    private log: IBaseLogger;
    private device: ModbusDevice;
    private disconnecting: boolean = false;

    isConnected(): boolean {
        return this.client.isOpen;
    }

    getDeviceModel(): ModbusDevice {
        return this.device;
    }

    setOnDataReceived(onDataReceived: (value: any, buffer: Buffer, parseConfiguration: ModbusRegisterParseConfiguration) => Promise<void>): void {
        this.onDataReceived = onDataReceived;
    }

    setOnError(onError: (error: unknown, register: ModbusRegister) => Promise<void>): void {
        this.onError = onError;
    }

    setOnDisconnect(onDisconnect: () => Promise<void>): void {
        this.onDisconnect = onDisconnect;
    }

    /**
     * Callback function that is called when a value is resolved.
     *
     * @param value - The resolved value.
     * @param register - The Modbus register associated with the resolved value.
     * @returns A promise that resolves when the callback function completes.
     */
    onDataReceived?: (value: any, buffer: Buffer, parseConfiguration: ModbusRegisterParseConfiguration) => Promise<void>;
    onError?: (error: unknown, register: ModbusRegister) => Promise<void>;
    onDisconnect?: () => Promise<void>;

    private onApiDisconnect = async () => {
        if (this.onDisconnect && !this.disconnecting) {
            await this.onDisconnect();
        }
    };

    /**
     * Represents a Modbus API.
     * @param log - The logger instance.
     * @param host - The host address.
     * @param port - The port number.
     * @param unitId - The unit ID.
     * @param deviceModel - The Modbus device information.
     */
    constructor(log: IBaseLogger, host: string, port: number, unitId: number, device: ModbusDevice) {
        this.host = host;
        this.port = port;
        this.unitId = unitId;
        this.client = new ModbusRTU();
        this.log = log;
        this.device = device;
    }

    /**
     * Establishes a connection to the Modbus host.
     *
     * @returns A promise that resolves to a boolean indicating whether the connection was successful.
     */
    connect = async (): Promise<boolean> => {
        this.log.filteredLog('Connecting to Modbus host:', this.host, 'port:', this.port, 'unitId:', this.unitId);
        this.disconnecting = false;

        try {
            const socket = new Socket({
                allowHalfOpen: true,
            });

            socket.on('data', (data) => {
                this.log.filteredLog('Received data', data.toString());
            });

            await this.client.connectTCP(this.host, {
                port: this.port,
                keepAlive: true,
                timeout: 1000,
            });

            this.client.setID(this.unitId);
            this.client.setTimeout(1000);

            this.client.on('error', (error) => {
                this.log.filteredError('Modbus error', error);
            });

            this.client.on('close', () => {
                this.log.filteredLog('Modbus connection closed');

                if (!this.disconnecting) {
                    this.onApiDisconnect()
                        .then(() => {
                            this.log.filteredLog('Modbus connection re-established');
                        })
                        .catch((error) => {
                            this.log.filteredError('Failed to re-establish Modbus connection', error);
                        });
                }

                this.disconnecting = false;
            });

            this.log.filteredLog('Modbus connection established', this.client.isOpen);

            return this.client.isOpen;
        } catch (error) {
            return false;
        }
    };

    /**
     * Disconnects from the Modbus server.
     */
    disconnect = () => {
        this.disconnecting = true;
        this.client.close(() => { });
    };

    /**
    /**
     * Reads a Modbus register without converting the data.
     *
     * @param register - The Modbus register to read.
     * @param registerType - The type of the register.
     * @returns A promise that resolves to the read data or undefined if the read operation failed.
     */
    readAddressWithoutConversion = async (register: ModbusRegister): Promise<Buffer | undefined> => {
        const data =
            register.registerType === RegisterType.Input
                ? await this.client.readInputRegisters(register.address, register.length)
                : await this.client.readHoldingRegisters(register.address, register.length);

        this.log.filteredLog('Reading address', register.address, ':', data);

        if (data && data.buffer) {
            return data.buffer;
        }
        return undefined;
    };

    /**
     * Reads a Modbus register and converts the data.
     *
     * @param register - The Modbus register to read.
     * @param registerType - The type of the register.
     * @returns A promise that resolves to the converted data or undefined if the read operation failed.
     */
    readAddress = async (register: ModbusRegister): Promise<any> => {
        const buffer = await this.readAddressWithoutConversion(register);

        if (buffer) {
            const result = this.device.converter(this.log, buffer, register);
            this.log.filteredLog('Conversion result', result);
            return result;
        }

        return undefined;
    };

    /**
     * Reads multiple Modbus registers in a batch operation.
     *
     * This method reads both input and holding registers in batches.
     * The batches are created using the `createRegisterBatches` function.
     * Each batch is then read using the `readBatch` method.
     *
     * If the `onDataReceived` callback is not set, an error is logged.
     *
     * @returns A promise that resolves when the batch operation is complete.
     */
    readRegistersInBatch = async () => {
        if (!this.onDataReceived) {
            this.log.filteredError('No valueResolved function set');
        }

        const inputBatches = createRegisterBatches(this.log, this.device.inputRegisters);

        for (const batch of inputBatches) {
            await this.readBatch(batch, RegisterType.Input);
        }

        const holdingBatches = createRegisterBatches(this.log, this.device.holdingRegisters);

        for (const batch of holdingBatches) {
            await this.readBatch(batch, RegisterType.Holding);
        }
    };

    writeRegisters = async (register: ModbusRegister, values: any[]): Promise<boolean> => {
        if (register.accessMode === AccessMode.ReadOnly) {
            return false;
        }

        for (const value of values) {
            if (!Buffer.isBuffer(value)) {
                const valid = validateValue(value, register.dataType);
                this.log.filteredLog('Validating value', value, 'for register', register.address, 'with data type', register.dataType, 'result', valid);

                if (!valid) {
                    return false;
                }
            }
        }

        this.log.filteredLog('Writing to address', register.address, ':', values);

        try {
            const result = await this.client.writeRegisters(register.address, values);
            this.log.filteredLog('Output', result.address);
            return true;
        } catch (error) {
            this.log.filteredError('Error writing to register', error);
            return false;
        }
    };

    /**
     * Writes a value to a Modbus register.
     *
     * This method first checks if the register is read-only. If it is, the method returns false.
     * It then validates the value to be written using the `validateValue` function. If the value is invalid, an error is logged and the method returns false.
     * The method then attempts to write the value to the register. If the write operation fails, an error is logged and the method returns false.
     * If the write operation is successful, the method returns true.
     *
     * @param register - The Modbus register to write to.
     * @param value - The value to write.
     * @returns A promise that resolves to a boolean indicating whether the write operation was successful.
     */
    writeRegister = async (register: ModbusRegister, value: any): Promise<boolean> => {
        return await this.writeRegisters(register, [value]);
    };

    /**
     * Writes a buffer to a Modbus register.
     *
     * This method first checks if the register is read-only. If it is, the method returns false.
     * The method then logs the buffer to be written and attempts to write the buffer to the register.
     * If the write operation fails, an error is logged and the method returns false.
     * If the write operation is successful, the method returns true.
     *
     * @param register - The Modbus register to write to.
     * @param buffer - The buffer to write.
     * @returns A promise that resolves to a boolean indicating whether the write operation was successful.
     */
    writeBufferRegister = async (register: ModbusRegister, buffer: Buffer): Promise<boolean> => {
        this.log.filteredLog('Writing to register', register.address, buffer, typeof buffer);

        try {
            const result = await this.client.writeRegisters(register.address, buffer);
            this.log.filteredLog('Output', result.address);
        } catch (error) {
            this.log.filteredError('Error writing to register', error);
            return false;
        }

        return true;
    };

    /**
     * Reads the input and holding registers of the Modbus device.
     * @deprecated Use `readRegistersInBatch` instead.
     * @returns {Promise<void>} A promise that resolves when all registers have been read.
     */
    readRegisters = async () => {
        if (!this.onDataReceived) {
            this.log.filteredError('No valueResolved function set');
        }

        for (const register of this.device.inputRegisters.filter((x) => x.accessMode !== AccessMode.WriteOnly)) {
            await this.readBatch([register], RegisterType.Input);
        }

        for (const register of this.device.holdingRegisters.filter((x) => x.accessMode !== AccessMode.WriteOnly)) {
            await this.readBatch([register], RegisterType.Holding);
        }

        this.log.filteredLog('Finished reading registers');
    };

    /**
     * Reads a batch of Modbus registers.
     *
     * This method reads either input or holding registers based on the register type.
     * It first checks if the batch is empty. If it is, the method returns.
     * It then calculates the length of the batch and attempts to read the registers.
     * If the read operation fails, an error is logged.
     * If the read operation is successful, the method iterates over the batch and processes each register.
     * The processing involves extracting a buffer from the read results and converting it to a value.
     * The conversion is done using either the `inputRegisterResultConversion` or `holdingRegisterResultConversion` method of the device model's definition.
     * If the `onDataReceived` callback is set, it is called with the converted value and the register.
     *
     * @param batch - The batch of Modbus registers to read.
     * @param registerType - The type of the registers.
     */
    readBatch = async (batch: ModbusRegister[], registerType: RegisterType) => {
        if (batch.length === 0) {
            return;
        }

        const firstRegister = batch[0];
        const lastRegister = batch[batch.length - 1];

        const length = batch.length > 1 ? lastRegister.address + lastRegister.length - firstRegister.address : batch[0].length;

        try {
            const results =
                registerType === RegisterType.Input
                    ? await this.client.readInputRegisters(firstRegister.address, length)
                    : await this.client.readHoldingRegisters(firstRegister.address, length);

            let startOffset = 0;
            for (const register of batch) {
                const end = startOffset + register.length * 2;
                const buffer = batch.length > 1 ? results.buffer.subarray(startOffset, end) : results.buffer;

                const value = this.device.converter(this.log, buffer, register);

                if (validateValue(value, register.dataType)) {
                    for (const parseConfiguration of register.parseConfigurations) {
                        await this.onDataReceived!(value, buffer, parseConfiguration);
                    }
                } else {
                    this.log.filteredError('Invalid value', value, 'for address', register.address, register.dataType);
                }

                startOffset = end;
            }
        } catch (error: any) {
            if (!error.name || error.name !== 'TransactionTimedOutError') {
                this.log.filteredError('Error reading batch', error);
            }
        }
    };

    /**
     * Writes a value to a specified Modbus register.
     *
     * This method first checks if the device and necessary parameters are defined. If not, it logs an error and returns.
     * It then retrieves the specified register from the device repository.
     * If the register is not found, it logs an error and returns.
     * It then logs the device and the parameters for the write operation.
     * Finally, it writes the value to the register and logs the result of the write operation.
     *
     * @param origin - The logger to use for logging.
     * @param args - An object containing the parameters for the write operation. It should have the following properties:
     *               - value: The value to write.
     *               - registerType: The type of the register.
     *               - register: The register to write to.
     *               - device: The device containing the register.
     * @returns A promise that resolves when the write operation is complete.
     */
    writeValueToRegister = async (args: any): Promise<void> => {
        const { value, registerType, register, device } = args;

        if (device.device === undefined) {
            this.log.filteredError('Device is undefined');
            return;
        }

        if (value === undefined || registerType === undefined || !register) {
            this.log.filteredLog('Wait, something is missing', value, registerType, register);
            return;
        }

        if (!register || !register.address) {
            this.log.filteredError('Register is undefined');
            return;
        }

        const rType = registerType === 'holding' ? RegisterType.Holding : RegisterType.Input;

        const foundRegister = this.device.getRegisterByTypeAndAddress(rType, register.address);

        if (!foundRegister) {
            this.log.filteredError('Register not found');
            return;
        }

        this.log.filteredLog('Device', JSON.stringify(device.device, null, 2));

        this.log.filteredLog('write_value_to_register', value, registerType, register);

        const result = await this.writeRegister(foundRegister, value);
        this.log.filteredLog('Write result', result);
    };

    /**
     * Writes bits to a Modbus register.
     *
     * This method first reads the current value of the register. If the read operation fails, an error is logged and the method returns false.
     * It then checks if the bit index is within the range of the register. If it is not, an error is logged and the method returns false.
     * The method then calculates the byte index and the start bit index within the byte.
     * It then writes the bits to the buffer at the calculated indices.
     * Finally, it writes the buffer back to the register.
     *
     * @param register - The Modbus register to write to.
     * @param registerType - The type of the register.
     * @param bits - The bits to write.
     * @param bitIndex - The index at which to start writing the bits.
     * @returns A promise that resolves to a boolean indicating whether the write operation was successful.
     */
    writeBitsToRegister = async (register: ModbusRegister, bits: number[], bitIndex: number): Promise<boolean> => {
        const readBuffer = await this.readAddressWithoutConversion(register);

        if (readBuffer === undefined) {
            this.log.filteredError('Failed to read current value');
            return false;
        }

        logBits(this.log, readBuffer);

        if (readBuffer.length * 8 < bitIndex + bits.length) {
            this.log.filteredError('Bit index out of range');
            return false;
        }

        const byteIndex = readBuffer.length - 1 - Math.floor(bitIndex / 8);
        const startBitIndex = bitIndex % 8;

        this.log.filteredLog('writeBitsToRegister', register.registerType, bits, startBitIndex, byteIndex);

        const result = writeBitsToBuffer(readBuffer, byteIndex, bits, startBitIndex);
        logBits(this.log, result);

        return await this.writeBufferRegister(register, result);
    };
}
