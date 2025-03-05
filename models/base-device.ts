/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import Homey from 'homey';
import { addCapabilityIfNotExists, capabilityChange, deprecateCapability } from 'homey-helpers';

import { DateTime } from 'luxon';
import { IAPI2, RegisterOutput } from '../api/iapi';
import { DeviceRepository } from '../repositories/device-repository/device-repository';
import { ModbusDevice } from '../repositories/device-repository/models/modbus-device';
import { DeviceType } from '../repositories/device-repository/models/modbus-register';
import { BaseDriver } from './base-driver';
import { ModbusAPI2 } from '../api/modbus/modbus-api2';
import { delay } from '../helpers/delay';
import { SolarmanAPI2 } from '../api/solarman/solarman-api2';

const DEFAULT_UNAVAILABLE_TIMEOUT = 180; // 3 minutes of no data marks the device as unavailable

export class BaseDevice extends Homey.Device {
    private api?: IAPI2;
    private reachable: boolean = false;
    private readRegisterTimeout: NodeJS.Timeout | undefined;
    private connectTimeout: NodeJS.Timeout | undefined;
    private device!: ModbusDevice;

    private runningRequest: boolean = false;

    private lastSuccessfullRead?: DateTime;

    private runningRequestCount: number = 0;
    private isStopping: boolean = false;

    private isInInvalidState: { [id: string]: boolean } = {};

    batteryDevice?: BaseDevice;
    inverterDevice?: BaseDevice;

    private lastState: { [id: string]: boolean } = {};

    public logDeviceName = () => {
        return this.getName();
    };

    public dlog(...args: any[]) {
        const params = [`[${this.logDeviceName()}]`, ...args];
        this.log(...params);
    }

    public derror(...args: any[]) {
        const params = [`${this.logDeviceName()}`, ...args];
        this.error(...params);
    }

    get isAvailable(): boolean {
        if (this.lastSuccessfullRead) {
            const diff = DateTime.now().diff(this.lastSuccessfullRead, 'seconds').seconds;
            return (diff < DEFAULT_UNAVAILABLE_TIMEOUT);
        }
        return false;
    }

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
     * Initializes the capabilities of the Modbus device based on the provided definition.
     * @param definition The Modbus device definition.
     */
    private initializeCapabilities = async (isBattery: boolean) => {
        if (!this.device) {
            this.setUnavailable('Device is not correctly set');
            return;
        }

        const deviceType = isBattery ? DeviceType.BATTERY : DeviceType.SOLAR;

        const capabilities = this.device.getAllCapabilities(deviceType);

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

    private getApi = (): IAPI2 => {
        const { solarman, host, port, unitId, serial } = this.getSettings();
        const { modelId } = this.getData();

        if (solarman) {
            return new SolarmanAPI2(modelId, {
                host,
                port,
                unitId,
                timeout: 5000,
                serial
            }, this)
        } else {
            return new ModbusAPI2(modelId, {
                host,
                port,
                unitId,
                timeout: 5000
            }, this);
        }
    }

    private setApi = async (): Promise<void> => {
        const { modelId, battery } = this.getData();

        if (!this.device) {
            const result = DeviceRepository.getInstance().getDeviceById(modelId);

            if (result) {
                this.device = result;
            } else {
                this.setUnavailable(`Could not find your device with model ${modelId}`);
                return;
            }
        }

        await this.initializeCapabilities(battery);

        if (!battery) {
            this.api = this.getApi();
        }
    }

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        await super.onInit();
        const { modelId, battery, batteryId } = this.getData();
        const { removedBattery, removedInverter, version } = this.getSettings();

        if (version === undefined || version < 3) {
            this.setUnavailable('For this new version to work, you need to remove and repair your devices');

            this.homey.notifications.createNotification({
                excerpt: "Your Blauhoff devices have been added using a deprecated driver, please remove and repair your devices"
            })

            return;
        }

        const result = DeviceRepository.getInstance().getDeviceById(modelId);

        if (!result) {
            this.setUnavailable(`Could not find your device with model ${modelId}`);
            return;
        }

        this.device = result;

        this.dlog(`Removed battery: ${result.name} ${removedBattery}`)

        if (battery) {
            this.setClass('battery')
            this.setEnergy({
                'homeBattery': true
            });

            if (removedInverter) {
                this.setUnavailable('Inverter should not have been deleted, delete this device as well and pair your inverter and battery again.');
                return;
            }

        } else {
            this.setClass('solarpanel')
            this.setEnergy({
                'homeBattery': false,
            });
        }

        if (battery) {
            this.tryConnectInverter();
        } else {
            if (this.device.hasBattery && batteryId && !removedBattery) {
                this.tryConnectBattery();
            }
        }

        this.dlog('ModbusDevice has been initialized');

        await deprecateCapability(this, 'status_code.device_online');
        await addCapabilityIfNotExists(this, 'readable_boolean.device_status');
        await addCapabilityIfNotExists(this, 'date.record');

        const deprecated = this.device.deprecatedCapabilities;
        this.dlog('Deprecated capabilities', deprecated);
        if (deprecated) {
            for (const capability of deprecated) {
                this.dlog('Deprecating capability', capability);
                await deprecateCapability(this, capability);
            }
        }

        const { enabled } = this.getSettings();

        if (enabled) {
            await this.setApi();

            if (!battery) {
                this.readRegisters();
            }

        } else {
            await this.setUnavailable('Device is disabled');
            this.dlog('ModbusDevice is disabled');
        }
    }

    private tryConnectBattery = () => {
        const { batteryId, battery } = this.getData();
        const { removedBattery } = this.getSettings();

        if (removedBattery) {
            this.dlog('Battery has been removed from this inverter');
            return;
        }

        if (battery) {
            return;
        }

        this.batteryDevice = this.getBattery();

        if (!this.batteryDevice) {
            this.dlog(`${this.device.name} Could not find battery device, retrying`);

            this.connectTimeout = this.homey.setTimeout(() => {
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
            this.dlog('Could not find inverter device, retrying');

            this.connectTimeout = this.homey.setTimeout(() => {
                this.tryConnectInverter();
            }, 1000);
        }
    }

    handleResults = async (registerValues: RegisterOutput[]) => {
        const { battery } = this.getData();

        const deviceType = battery ? DeviceType.BATTERY : DeviceType.SOLAR;

        for (const registerValue of registerValues) {
            const correctDeviceType = registerValue.parseConfiguration.register.deviceTypes.includes(deviceType);

            if (correctDeviceType) {
                const parseConfiguration = registerValue.parseConfiguration;

                const result = parseConfiguration.calculateValue(registerValue.value, registerValue.buffer, this);

                const validationResult = parseConfiguration.validateValue(result, this);

                if (!validationResult.valid) {
                    this.derror('Received invalid value', parseConfiguration.capabilityId, result);

                    if (!this.isInInvalidState[parseConfiguration.capabilityId]) {
                        const c = this.homey.flow.getDeviceTriggerCard('invalid_value_received');
                        await c.trigger(this, { capability: parseConfiguration.capabilityId, value: result });

                        this.isInInvalidState[parseConfiguration.capabilityId] = true;
                    }
                    return;
                }

                delete this.isInInvalidState[parseConfiguration.capabilityId];
                await capabilityChange(this, parseConfiguration.capabilityId, result);

                this.lastState[parseConfiguration.capabilityId] = result;

                parseConfiguration.currentValue = result;

                if (!this.reachable) {
                    this.reachable = true;
                }

                const dependendantStateCalculations = this.device.getStateCalculations(deviceType).filter(s => (s.dependecies && s.dependecies.indexOf(parseConfiguration.capabilityId) > -1) || s.dependecies === undefined);

                if (dependendantStateCalculations.length > 0) {
                    for (const calc of dependendantStateCalculations) {
                        const result = await calc.calculation(this, this.lastState);
                        await capabilityChange(this, calc.capabilityId, result);
                    }
                }
            }
        }

        if (!battery && this.batteryDevice) {
            try {
                (this.batteryDevice as BaseDevice).handleResults(registerValues);
            } catch (err) {
                this.error('Could not update battery', err);
            }
        }

        this.lastSuccessfullRead = DateTime.now();

        const localTimezone = this.homey.clock.getTimezone();
        const localDate = this.lastSuccessfullRead.setZone(localTimezone);

        await capabilityChange(this, 'date.record', localDate.toFormat('HH:mm:ss'));

    }

    /**
     * Reads the registers from the device.
     *
     * @returns {Promise<void>} A promise that resolves when the registers are read.
     */
    private readRegisters = async () => {
        const { battery } = this.getData();

        if (battery) {
            return;
        }

        if (!this.api) {
            this.dlog('ModbusAPI is not initialized');
            return;
        }

        if (this.runningRequest && this.runningRequestCount > 2) {
            this.dlog('Cancelling `readRegisters` as there are already too many requests running');
            return;
        }

        this.runningRequestCount++;

        if (this.readRegisterTimeout) {
            this.homey.clearTimeout(this.readRegisterTimeout);
            this.readRegisterTimeout = undefined;
        }

        const { refreshInterval } = this.getSettings();


        if (this.runningRequest) {
            this.dlog('Request already running, waiting for it to finish');
        }

        while (this.runningRequest) {
            await delay(500);
        }

        this.runningRequest = true;

        try {
            const results = await this.api.readRegisters();
            await this.handleResults(results);

            this.dlog(`Updated ${results.length} statusses`);
        } catch (error: Error | any) {
            if (error.name === 'TransactionTimedOutError') {
                this.dlog('Transaction timed out');
            } else {
                this.dlog('Failed to read registers', JSON.stringify(error));
            }
        } finally {
            this.runningRequest = false;
            this.runningRequestCount--;

            const interval = this.isAvailable ? Math.max(refreshInterval, 2) * 1000 : 60000;

            if (!this.isAvailable) {
                this.dlog('Device is not reachable, retrying in 60 seconds');
            }

            if (!this.isStopping) {
                this.readRegisterTimeout = this.homey.setTimeout(this.readRegisters.bind(this), interval);
            }
        }
    };

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
        this.dlog('ModbusDevice has been added');
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
        this.dlog('ModbusDevice settings where changed');

        if (this.readRegisterTimeout) {
            clearTimeout(this.readRegisterTimeout);
        }

        const enabled = newSettings['enabled'] as boolean;

        if (enabled) {
            this.dlog('ModbusDevice is enabled');

            const { battery } = this.getData();
            this.isStopping = false;
            await this.setAvailable();

            await this.setApi();

            if (!battery) {
                this.readRegisters();
            }

        } else {
            this.dlog('ModbusDevice is disabled');
            await this.setUnavailable('Device is disabled');
            this.isStopping = true;
        }
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name: string) {
        this.dlog('ModbusDevice was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        const { battery, batteryId, id } = this.getData();

        if (!battery && batteryId) {
            this.dlog('ModbusDevice has been deleted');

            if (this.readRegisterTimeout) {
                this.homey.clearTimeout(this.readRegisterTimeout);
            }

            if (this.batteryDevice) {
                this.batteryDevice.inverterDevice = undefined;
            }

            await (this.driver as BaseDriver).deleteBattery(batteryId);
        } else if (battery) {
            await (this.driver as BaseDriver).removeBattery(id);
        }

        if (this.connectTimeout) {
            this.homey.clearTimeout(this.connectTimeout);
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
            this.derror('Retry count exceeded');
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

        this.dlog('callAction', this.device.name, action);

        if (!this.api) {
            this.derror('API is not initialized');
            return;
        }

        if (args.device && args.device.device) {
            try {
                await (args.device as BaseDevice).device.callAction(this, action, args, this.api);
                this.runningRequest = false;
            } catch (error) {
                this.derror('Error calling action', error);

                await this.homey.setTimeout(
                    () => {
                        this.callAction(action, args, retryCount + 1);
                    },
                    500 * retryCount + 1,
                );
            }
        } else {
            this.derror('No args.device.device found');
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
