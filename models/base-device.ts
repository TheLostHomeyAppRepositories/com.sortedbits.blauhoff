/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import Homey from 'homey';
import { addCapabilityIfNotExists, capabilityChange, deprecateCapability } from 'homey-helpers';

import { DateTime } from 'luxon';
import { IAPI } from '../api/iapi';
import { ModbusAPI } from '../api/modbus/modbus-api';
import { Solarman } from '../api/solarman/solarman';
import { DeviceRepository } from '../repositories/device-repository/device-repository';
import { orderModbusRegisters } from '../repositories/device-repository/helpers/order-modbus-registers';
import { Device } from '../repositories/device-repository/models/device';
import { AccessMode } from '../repositories/device-repository/models/enum/access-mode';
import { DeviceType, ModbusRegister, ModbusRegisterParseConfiguration } from '../repositories/device-repository/models/modbus-register';
import { BaseDriver } from './base-driver';
import { parse } from 'path';

export class BaseDevice extends Homey.Device {
    private api?: IAPI;
    private reachable: boolean = false;
    private readRegisterTimeout: NodeJS.Timeout | undefined;
    private device!: Device;
    private enabled: boolean = true;

    private runningRequest: boolean = false;

    private lastRequest?: DateTime;
    private lastValidRequest?: DateTime;

    private isInInvalidState: { [id: string]: boolean } = {};

    private batteryDevice?: BaseDevice;
    private inverterDevice?: BaseDevice;

    private lastState: { [id: string]: boolean } = {};

    public logDeviceName = () => {
        return this.getName();
    };

    public filteredLog(...args: any[]) {
        const params = [this.logDeviceName(), ...args];
        //        if (this.device.brand === Brand.Deye || this.device.brand === Brand.Afore) {
        this.log(...params);
        //        }
    }

    public filteredError(...args: any[]) {
        const params = [this.logDeviceName(), ...args];
        //        if (this.device.brand === Brand.Afore || this.device.brand === Brand.Deye) {
        this.error(...params);
        //        }
    }

    private onDisconnect = async () => {
        if (this.readRegisterTimeout) {
            clearTimeout(this.readRegisterTimeout);
        }

        if (!this.api) {
            return;
        }

        const isOpen = await this.api.connect();

        if (!isOpen) {
            await this.setUnavailable('Modbus connection unavailable');

            this.homey.setTimeout(this.onDisconnect, 60000);
        } else {
            await this.setAvailable();
            await this.readRegisters();
        }
    };

    private updateDeviceAvailability = async (value: boolean) => {
        const current = await this.getCapabilityValue('readable_boolean.device_status');

        if (value !== current) {
            await capabilityChange(this, 'readable_boolean.device_status', value);

            const trigger = value ? 'device_went_online' : 'device_went_offline';
            const triggerCard = this.homey.flow.getTriggerCard(trigger);
            await triggerCard.trigger(this, {});
        }
    };

    /**
     * Handles the value received from a Modbus register.
     *
     * @param value - The value received from the Modbus register.
     * @param register - The Modbus register object.
     * @returns A Promise that resolves when the value is handled.
     */
    onDataReceived = async (value: any, buffer: Buffer, parseConfiguration: ModbusRegisterParseConfiguration) => {
        const { battery } = this.getData();

        const deviceType = battery ? DeviceType.BATTERY : DeviceType.SOLAR;

        if (parseConfiguration.register.deviceTypes.indexOf(deviceType) > -1) {
            const result = parseConfiguration.calculateValue(value, buffer, this);

            const validationResult = parseConfiguration.validateValue(result, this);
            if (!validationResult.valid) {
                this.filteredError('Received invalid value', parseConfiguration.capabilityId, result);

                if (!this.isInInvalidState[parseConfiguration.capabilityId]) {
                    const c = this.homey.flow.getDeviceTriggerCard('invalid_value_received');
                    await c.trigger(this, { capability: parseConfiguration.capabilityId, value: result });

                    this.isInInvalidState[parseConfiguration.capabilityId] = true;
                }
                return;
            }

            delete this.isInInvalidState[parseConfiguration.capabilityId];

            this.lastValidRequest = DateTime.utc();

            await capabilityChange(this, parseConfiguration.capabilityId, result);

            this.lastState[parseConfiguration.capabilityId] = result;

            parseConfiguration.currentValue = result;

            if (!this.reachable) {
                this.reachable = true;
            }

            const localTimezone = this.homey.clock.getTimezone();
            const date = DateTime.now();
            const localDate = date.setZone(localTimezone);

            await capabilityChange(this, 'date.record', localDate.toFormat('HH:mm:ss'));

            const dependendantStateCalculations = this.device.getStateCalculations(deviceType).filter(s => (s.dependecies && s.dependecies.indexOf(parseConfiguration.capabilityId) > -1) || s.dependecies === undefined);

            if (dependendantStateCalculations.length > 0) {
                for (const calc of dependendantStateCalculations) {
                    const result = await calc.calculation(this, this.lastState);
                    await capabilityChange(this, calc.capabilityId, result);
                }
            }

        }
        if (!battery && this.batteryDevice) {
            (this.batteryDevice as BaseDevice).onDataReceived(value, buffer, parseConfiguration);
        }

        await this.updateDeviceAvailability(true);
    };

    /**
     * Handles the error that occurs during a Modbus operation.
     * If the error is a TransactionTimedOutError, sets the device as unreachable.
     * Otherwise, logs the error message.
     *
     * @param error - The error that occurred.
     * @param register - The Modbus register associated with the error.
     */
    private onError = async (error: unknown, register: ModbusRegister) => {
        if (error && (error as any)['name'] && (error as any)['name'] === 'TransactionTimedOutError') {
            this.reachable = false;
            await this.updateDeviceAvailability(false);
        } else {
            this.filteredError('Request failed', error);
        }
    };

    /**
     * Initializes the capabilities of the Modbus device based on the provided definition.
     * @param definition The Modbus device definition.
     */
    private initializeCapabilities = async (isBattery: boolean) => {
        const deviceType = isBattery ? DeviceType.BATTERY : DeviceType.SOLAR;

        const capabilities = this.device.getAllCapabilities(deviceType);
        this.log(`Capabilities: `, capabilities);

        for (const capability of capabilities) {
            await addCapabilityIfNotExists(this, capability);
        }

        const currentCapabilities = this.getCapabilities()

        for (const capability of currentCapabilities) {
            const exists = capabilities.find(r => r == capability);
            if (!exists) {
                await deprecateCapability(this, capability);
            }
        }
    };

    /**
     * Establishes a connection to the Modbus device.
     * @returns {Promise<void>} A promise that resolves when the connection is established.
     */
    private connect = async () => {
        const { host, port, unitId, solarman, serial, enabled } = this.getSettings();
        const { deviceType, modelId, battery } = this.getData();

        if (battery) {
            return;
        }

        if (this.readRegisterTimeout) {
            clearTimeout(this.readRegisterTimeout);
        }

        this.filteredLog('ModbusDevice', host, port, unitId, deviceType, modelId, enabled);


        this.api = solarman ? new Solarman(this, this.device, host, serial, 8899, 1) : new ModbusAPI(this, host, port, unitId, this.device);
        this.api.setOnDataReceived(this.onDataReceived);
        this.api?.setOnError(this.onError);
        this.api?.setOnDisconnect(this.onDisconnect);

        const isOpen = await this.api.connect();

        if (isOpen) {
            await this.readRegisters();
        }
    };

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        await super.onInit();

        const { modelId, battery, batteryId } = this.getData();

        if (battery) {
            this.setClass('battery')
            this.setEnergy({
                'homeBattery': true
            })
        } else {
            this.setClass('solarpanel')
        }

        const result = DeviceRepository.getInstance().getDeviceById(modelId);

        if (!result) {
            this.filteredError('Unknown device type', modelId);
            throw new Error('Unknown device type');
        }

        if (!battery) {
            if (batteryId) {
                this.tryConnectBattery();
            } else if (!batteryId) {
                this.log('No batteryId defined')
            }
        }

        if (battery) {
            this.tryConnectInverter();
        }

        this.device = result;
        this.filteredLog('ModbusDevice has been initialized');

        await deprecateCapability(this, 'status_code.device_online');
        await addCapabilityIfNotExists(this, 'readable_boolean.device_status');
        await addCapabilityIfNotExists(this, 'date.record');

        const deprecated = this.device.deprecatedCapabilities;
        this.filteredLog('Deprecated capabilities', deprecated);
        if (deprecated) {
            for (const capability of deprecated) {
                this.filteredLog('Deprecating capability', capability);
                await deprecateCapability(this, capability);
            }
        }

        const { enabled } = this.getSettings();
        this.enabled = enabled;

        if (this.enabled) {
            await this.initializeCapabilities(battery);

            if (!battery) {
                await this.connect();
            }
        } else {
            await this.setUnavailable('Device is disabled');
            this.filteredLog('ModbusDevice is disabled');
        }

    }

    private tryConnectBattery = () => {
        const { battery } = this.getData();
        const { removedBattery } = this.getSettings();

        if (removedBattery) {
            this.log('Battery has been removed from this inverter');
        }

        if (battery) {
            return;
        }

        this.batteryDevice = this.getBattery();

        if (!this.batteryDevice) {
            this.log('Could not find battery device, retrying');

            this.homey.setTimeout(() => {
                this.tryConnectBattery();
            }, 1000);
        }
    }


    private tryConnectInverter = () => {
        const { battery } = this.getData();

        if (!battery) {
            return;
        }

        this.inverterDevice = this.getInverter();

        if (!this.inverterDevice) {
            this.log('Could not find inverter device, retrying');

            this.homey.setTimeout(() => {
                this.tryConnectInverter();
            }, 1000);
        }
    }

    /**
     * Reads the registers from the device.
     *
     * @returns {Promise<void>} A promise that resolves when the registers are read.
     */
    private readRegisters = async () => {
        if (!this.api) {
            this.filteredError('ModbusAPI is not initialized');
            return;
        }

        this.lastRequest = DateTime.utc();

        const diff = this.lastValidRequest ? this.lastRequest.diff(this.lastValidRequest, 'minutes').minutes : 0;
        const { refreshInterval } = this.getSettings();

        if (diff > Math.max(2, refreshInterval / 60)) {
            await this.updateDeviceAvailability(false);
        }

        if (!this.enabled) {
            this.filteredLog('ModbusDevice is disabled, returning');
            return;
        }

        while (this.runningRequest) {
            await new Promise((resolve) => setTimeout(resolve, 200));
        }

        this.runningRequest = true;


        try {
            await this.api.readRegistersInBatch();
        } catch (error) {
            this.filteredError('Error reading registers', error);
        } finally {
            this.runningRequest = false;
        }

        const interval = this.reachable ? (refreshInterval < 5 ? 5 : refreshInterval) * 1000 : 60000;
        this.readRegisterTimeout = await this.homey.setTimeout(this.readRegisters.bind(this), interval);
    };

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
        this.filteredLog('ModbusDevice has been added');
    }

    /**
     * onSettings is called when the user updates the device's settings.
     * @param {object} event the onSettings event data
     * @param {object} event.oldSettings The old settings object
     * @param {object} event.newSettings The new settings object
     * @param {string[]} event.changedKeys An array of keys changed since the previous version
     * @returns {Promise<string|void>} return a custom message that will be displayed
     */
    async onSettings({
        oldSettings,
        newSettings,
        changedKeys,
    }: {
        oldSettings: {
            [key: string]: boolean | string | number | undefined | null
        };
        newSettings: { [key: string]: boolean | string | number | undefined | null };
        changedKeys: string[];
    }): Promise<string | void> {
        this.filteredLog('ModbusDevice settings where changed');

        if (this.readRegisterTimeout) {
            clearTimeout(this.readRegisterTimeout);
        }

        if (this.api?.isConnected()) {
            await this.api?.disconnect();
        }

        if (this.enabled !== undefined) {
            this.enabled = newSettings['enabled'] as boolean;
        }

        if (this.enabled) {
            this.filteredLog('ModbusDevice is enabled');
            await this.setAvailable();
            await this.connect();
        } else {
            this.filteredLog('ModbusDevice is disabled');
            await this.setUnavailable('Device is disabled');
        }
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name: string) {
        this.filteredLog('ModbusDevice was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        const { battery, batteryId, id } = this.getData();

        if (!battery && batteryId) {
            this.filteredLog('ModbusDevice has been deleted');

            if (this.readRegisterTimeout) {
                clearTimeout(this.readRegisterTimeout);
            }

            if (this.api?.isConnected()) {
                await this.api?.disconnect();
            }

            await (this.driver as BaseDriver).deleteBattery(batteryId);
        } else if (battery) {
            await (this.driver as BaseDriver).removeBattery(id);
        }
    }

    /**
     * This method is called when a flow cart is being executed.
     *
     * @param {string} action The action name of the flow card
     * @param {*} args The arguments of the flow card
     * @param {number} [retryCount=0] The number of times the action has been retried
     * @memberof BaseDevice
     */
    callAction = async (action: string, args: any, retryCount: number = 0) => {
        const { battery, batteryId, id } = this.getData();

        if (battery) {
            this.inverterDevice?.callAction(action, args, retryCount);
            return;
        }


        if (retryCount > 3) {
            this.filteredError('Retry count exceeded');
            this.runningRequest = false;
            return;
        }

        if (retryCount === 0) {
            while (this.runningRequest) {
                await new Promise((resolve) => setTimeout(resolve, 200));
            }
        }

        this.runningRequest = true;

        const cleanArgs = {
            ...args,
        };

        if (cleanArgs.device) {
            delete cleanArgs.device;
        }

        this.filteredLog('callAction', this.device.name, action);

        if (!this.api) {
            this.filteredError('API is not initialized');
            return;
        }

        if (args.device && args.device.device) {
            try {
                await (args.device as BaseDevice).device.callAction(this, action, args, this.api);
                this.runningRequest = false;
            } catch (error) {
                this.filteredError('Error calling action', error);

                await this.homey.setTimeout(
                    () => {
                        this.callAction(action, args, retryCount + 1);
                    },
                    500 * retryCount + 1,
                );
            }
        } else {
            this.filteredError('No args.device.device found');
        }
    };

    getBattery = (): BaseDevice | undefined => {
        const { battery, batteryId } = this.getData();

        if (battery) {
            return this;
        }

        const devices = this.driver.getDevices().filter(d => {
            const { id, battery } = d.getData();

            return (battery && batteryId === id);
        });

        return devices?.length ? devices[0] as BaseDevice : undefined;
    }

    getInverter = (): BaseDevice | undefined => {
        const { battery, id } = this.getData();

        if (!battery) {
            return this;
        }

        const devices = this.driver.getDevices().filter(d => {
            const { batteryId, battery } = d.getData();

            return (!battery && batteryId === id);
        });

        return devices?.length ? devices[0] as BaseDevice : undefined;
    }
}
