import ModbusRTU from "modbus-serial";
import { DeviceRepository } from "../../repositories/device-repository/device-repository";
import { IAPI2, RegisterOutput } from "../iapi";
import { createRegisterBatches } from "../../repositories/device-repository/helpers/register-batches";
import { ModbusRegister } from "../../repositories/device-repository/models/modbus-register";
import { RegisterType } from "../../repositories/device-repository/models/enum/register-type";
import { validateValue } from "../../helpers/validate-value";
import { AccessMode } from "../../repositories/device-repository/models/enum/access-mode";
import { Logger } from "../../helpers/log";
import { ModbusDevice } from "../../repositories/device-repository/models/modbus-device";
import { writeBitsToBuffer } from "../../helpers/bits";
import { CommandQueue } from "../../helpers/command-queue";

export interface ModbusConnectionOptions {
    host: string;
    port: number;
    unitId: number;
    timeout: number;
}

export class ModbusAPI2 implements IAPI2 {
    private device: ModbusDevice;
    private queue: CommandQueue;

    constructor(private deviceId: string, private connection: ModbusConnectionOptions, private log: Logger) {
        const result = DeviceRepository.getInstance().getDeviceById(this.deviceId);

        if (!result) {
            throw new Error(`Device with ID ${deviceId} does not exist`);
        }

        this.device = result;
        this.queue = new CommandQueue(this.log);
    }

    getDevice(): ModbusDevice {
        return this.device;
    }

    readRegister = async (register: ModbusRegister): Promise<Array<RegisterOutput>> => {
        const result: Array<RegisterOutput> = [];

        const buffer = await this.readAddressWithoutConversion(register)

        if (buffer) {
            const value = this.device.converter(this.log, buffer, register);

            if (validateValue(value, register.dataType)) {
                for (const parseConfiguration of register.parseConfigurations) {
                    result.push({
                        register,
                        value,
                        buffer,
                        parseConfiguration
                    })
                }
            } else {
                this.log.derror('Invalid value', value, 'for address', register.address, register.dataType);
            }
        }

        return result;
    }

    readRegisters = async (): Promise<Array<RegisterOutput>> => {
        const waitResult = await this.queue.wait('readRegisters', 2);
        if (!waitResult) {
            return [];
        }

        const results: Array<RegisterOutput> = [];

        let client: ModbusRTU | undefined = undefined;
        try {
            client = await this.connect();
            const inputBatches = createRegisterBatches(this.log, this.device.inputRegisters);
            const holdingBatches = createRegisterBatches(this.log, this.device.holdingRegisters);

            for (const batch of inputBatches) {
                try {
                    const result = await this.readBatch(client, batch, RegisterType.Input);
                    results.push(...result);
                }
                catch (error) {
                    this.log.derror('readRegister input error', error);
                }
            }

            for (const batch of holdingBatches) {
                try {
                    const result = await this.readBatch(client, batch, RegisterType.Holding);
                    results.push(...result);
                } catch (error) {
                    this.log.derror('readRegister holding error', error);
                }
            }
        } catch (error) {
            this.log.derror('readRegisters error', error);
        } finally {
            this.queue.setBusy(false);

            client?.close(() => {
                this.log.dlog('Closing Modbus connection');
            });
        }

        return results;
    }

    writeRegisters = async (register: ModbusRegister, values: any[]): Promise<boolean> => {
        if (register.accessMode === AccessMode.ReadOnly) {
            return false;
        }

        for (const value of values) {
            if (!Buffer.isBuffer(value)) {
                const valid = validateValue(value, register.dataType);
                this.log.dlog('Validating value', value, 'for register', register.address, 'with data type', register.dataType, 'result', valid);

                if (!valid) {
                    return false;
                }
            }
        }

        this.queue.wait('writeRegisters', 999);

        this.log.dlog('Writing to address', register.address, ':', values);
        const client = await this.connect();

        try {
            const result = await client.writeRegisters(register.address, values);
            this.log.dlog('Output', result.address);
            return true;
        } catch (error) {
            this.log.derror('Error writing to register', error);
            return false;
        } finally {
            this.queue.setBusy(false);
            client.close(() => {
                this.log.dlog('Closing modbus connection');
            });
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
        return this.writeRegisters(register, [value]);
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
        this.log.dlog('Writing to register', register.address, buffer, typeof buffer);

        await this.queue.wait('writeBufferRegister', 999);

        const client = await this.connect();
        try {
            const result = await client.writeRegisters(register.address, buffer);
            this.log.dlog('Output', result.address);
        } catch (error) {
            this.log.derror('Error writing to register', error);
            return false;
        } finally {
            this.queue.setBusy(false);
            client.close(() => {
                this.log.dlog('Closing modbus connection');
            });
        }

        return true;
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
        await this.queue.wait('writeBufferRegister', 999);

        const client = await this.connect();
        try {
            const data =
                register.registerType === RegisterType.Input
                    ? await client.readInputRegisters(register.address, register.length)
                    : await client.readHoldingRegisters(register.address, register.length);

            this.log.dlog('Reading address', register.address, ':', data);

            if (data && data.buffer) {
                return data.buffer;
            }

        } catch (err) {
            this.log.derror('Failed to read address', err);
        } finally {
            this.queue.setBusy(false);

            client.close(() => {
                this.log.dlog('Closing modbus connection');
            });
        }

        return undefined;
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
            this.log.derror('Device is undefined');
            return;
        }

        if (value === undefined || registerType === undefined || !register) {
            this.log.dlog('Wait, something is missing', value, registerType, register);
            return;
        }

        if (!register || !register.address) {
            this.log.derror('Register is undefined');
            return;
        }

        const rType = registerType === 'holding' ? RegisterType.Holding : RegisterType.Input;

        const foundRegister = this.device.getRegisterByTypeAndAddress(rType, register.address);

        if (!foundRegister) {
            this.log.derror('Register not found');
            return;
        }

        this.log.dlog('Device', JSON.stringify(device.device, null, 2));

        this.log.dlog('write_value_to_register', value, registerType, register);

        const result = await this.writeRegister(foundRegister, value);
        this.log.dlog('Write result', result);
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
            this.log.derror('Failed to read current value');
            return false;
        }

        if (readBuffer.length * 8 < bitIndex + bits.length) {
            this.log.derror('Bit index out of range');
            return false;
        }

        const byteIndex = readBuffer.length - 1 - Math.floor(bitIndex / 8);
        const startBitIndex = bitIndex % 8;

        this.log.dlog('writeBitsToRegister', register.registerType, bits, startBitIndex, byteIndex);

        const result = writeBitsToBuffer(readBuffer, byteIndex, bits, startBitIndex);

        return await this.writeBufferRegister(register, result);
    };

    private connect = async (): Promise<ModbusRTU> => {
        const client = new ModbusRTU();

        const { host, port, timeout, unitId } = this.connection;

        this.log.dlog('Connecting to Modbus device', host, port, timeout, unitId);

        await client.connectTCP(host, {
            port,
            keepAlive: true,
            timeout: timeout
        });

        client.setID(unitId);
        client.setTimeout(timeout);

        client.on('error', error => {
            this.log.derror(error);
        });

        client.on('close', () => {
            this.log.dlog('Connection closed');
        });

        if (client.isOpen) {
            this.log.dlog('Modbus connection opened');
        }

        return client;
    }

    private readBatch = async (client: ModbusRTU, batch: ModbusRegister[], registerType: RegisterType): Promise<Array<RegisterOutput>> => {
        if (batch.length === 0) {
            return [];
        }

        const result: Array<RegisterOutput> = [];

        const firstRegister = batch[0];
        const lastRegister = batch[batch.length - 1];

        const length = batch.length > 1 ? lastRegister.address + lastRegister.length - firstRegister.address : batch[0].length;

        try {
            const results = registerType === RegisterType.Input ? await client.readInputRegisters(firstRegister.address, length) : await client.readHoldingRegisters(firstRegister.address, length);

            let startOffset = 0;
            for (const register of batch) {
                const end = startOffset + register.length * 2;
                const buffer = batch.length > 1 ? results.buffer.subarray(startOffset, end) : results.buffer;

                const value = this.device.converter(this.log, buffer, register);

                if (validateValue(value, register.dataType)) {
                    for (const parseConfiguration of register.parseConfigurations) {
                        result.push({
                            register,
                            value,
                            buffer,
                            parseConfiguration
                        })
                    }
                } else {
                    this.log.derror('Invalid value', value, 'for address', register.address, register.dataType);
                }

                startOffset = end;
            }
        } catch (error: any) {
            if (!error.name || error.name !== 'TransactionTimedOutError') {
                this.log.derror('Error reading batch', error);
            }
        }

        return result;
    };
}