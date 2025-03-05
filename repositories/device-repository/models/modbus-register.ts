/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import { randomUUID } from 'crypto';
import { IBaseLogger } from '../../../helpers/log';
import { AccessMode } from './enum/access-mode';
import { RegisterDataType } from './enum/register-datatype';
import { RegisterType } from './enum/register-type';

export type Transformation = (value: any, buffer: Buffer, log: IBaseLogger) => any;

export enum DeviceType {
    SOLAR,
    BATTERY
}

export interface ModbusRegisterOptions {
    validValueMin?: number;
    validValueMax?: number;
    maxAddDelta?: number;
    maxSubDelta?: number;
}

export interface ValidationResult {
    valid: boolean;
    message?: string;
}

export class ModbusRegisterParseConfiguration {
    register: ModbusRegister;
    capabilityId: string;
    transformation?: Transformation;
    scale?: number;
    guid: string;
    options: ModbusRegisterOptions;
    currentValue: any;

    constructor(register: ModbusRegister, capabilityId: string, transformation?: Transformation, scale?: number, options: ModbusRegisterOptions = {}) {
        this.register = register;
        this.capabilityId = capabilityId;
        this.transformation = transformation;
        this.scale = scale;
        this.options = options;

        this.guid = randomUUID();
    }

    calculateValue(value: any, buffer: Buffer, log: IBaseLogger): any {
        if (this.scale) {
            const numberValue = parseFloat(value);

            if (isNaN(numberValue)) {
                return undefined;
            }

            return numberValue * this.scale;
        }

        if (this.transformation) {
            return this.transformation(value, buffer, log);
        }

        return value;
    }
    calculatePayload(value: any, log: IBaseLogger): any {
        const result = Number(value) && this.scale ? value / this.scale : value;

        return result;
    }
    validateValue(value: any, log: IBaseLogger): ValidationResult {
        if (this.register.dataType === RegisterDataType.STRING) {
            return { valid: true };
        }

        if (!this.transformation && isNaN(parseFloat(value))) {
            log.derror('Received value is not a number', value, this.register.address);
            return { valid: false, message: 'Received value is not a number' };
        }

        if (this.options.validValueMax !== undefined && value > this.options.validValueMax) {
            log.derror('Value is above defined max', value, '>', this.options.validValueMax);
            return { valid: false, message: 'Value is above defined max' };
        }

        if (this.options.validValueMin !== undefined && value < this.options.validValueMin) {
            log.derror('Value is below defined min', value, '<', this.options.validValueMin);
            return { valid: false, message: 'Value is below defined min' };
        }

        if (this.currentValue !== undefined && this.options.maxAddDelta !== undefined) {
            const delta = value - this.currentValue;

            if (delta > this.options.maxAddDelta) {
                return { valid: false, message: 'Add delta is above defined max' };
            }
        }

        if (this.currentValue !== undefined && this.options.maxSubDelta !== undefined) {
            const delta = this.currentValue - value;

            if (delta > this.options.maxSubDelta) {
                return { valid: false, message: 'Sub delta is above defined max' };
            }
        }

        return { valid: true };
    }
}

export class ModbusRegister {
    address: number;
    length: number;
    dataType: RegisterDataType;
    accessMode: AccessMode;

    registerType: RegisterType = RegisterType.Input;

    parseConfigurations: ModbusRegisterParseConfiguration[] = [];
    deviceTypes: DeviceType[] = [];

    hasCapability(capabilityId: string): boolean {
        return this.parseConfigurations.some((config) => config.capabilityId === capabilityId);
    }

    constructor(address: number, length: number, dataType: RegisterDataType, accessMode: AccessMode = AccessMode.ReadOnly, deviceTypes?: DeviceType[]) {
        this.address = address;
        this.length = length;
        this.dataType = dataType;
        this.accessMode = accessMode;
        this.deviceTypes = deviceTypes ?? [DeviceType.BATTERY, DeviceType.SOLAR];
    }

    addDefault = (capabilityId: string, options?: ModbusRegisterOptions): ModbusRegister => {
        const configuration = new ModbusRegisterParseConfiguration(this, capabilityId, undefined, undefined, options);
        this.parseConfigurations.push(configuration);
        return this;
    };

    addScale = (capabilityId: string, scale: number, options?: ModbusRegisterOptions): ModbusRegister => {
        const configuration = new ModbusRegisterParseConfiguration(this, capabilityId, undefined, scale, options);
        this.parseConfigurations.push(configuration);
        return this;
    };

    addTransform = (capabilityId: string, transformation: Transformation, options?: ModbusRegisterOptions): ModbusRegister => {
        const configuration = new ModbusRegisterParseConfiguration(this, capabilityId, transformation, undefined, options);
        this.parseConfigurations.push(configuration);
        return this;
    };

    calculateValue(value: any, buffer: Buffer, log: IBaseLogger): any {
        if (this.parseConfigurations.length !== 1) {
            throw new Error('Invalid number of parse configurations for this method to work');
        }

        const parseConfiguration = this.parseConfigurations[0];
        return parseConfiguration.calculateValue(value, buffer, log);
    }

    calculatePayload(value: any, log: IBaseLogger): any {
        if (this.parseConfigurations.length !== 1) {
            throw new Error('Invalid number of parse configurations for this method to work');
        }

        const parseConfiguration = this.parseConfigurations[0];
        return parseConfiguration.calculatePayload(value, log);
    }

    static transform(
        capabilityId: string,
        address: number,
        length: number,
        dataType: RegisterDataType,
        transformation: Transformation,
        accessMode: AccessMode = AccessMode.ReadOnly,
        options: ModbusRegisterOptions = {},
        devicesTypes: DeviceType[] = [DeviceType.SOLAR]
    ) {
        return new ModbusRegister(address, length, dataType, accessMode, devicesTypes).addTransform(capabilityId, transformation, options);
    }

    static default(
        capabilityId: string,
        address: number,
        length: number,
        dataType: RegisterDataType,
        accessMode: AccessMode = AccessMode.ReadOnly,
        options: ModbusRegisterOptions = {},
        devicesTypes: DeviceType[] = [DeviceType.SOLAR]
    ) {
        return new ModbusRegister(address, length, dataType, accessMode, devicesTypes).addDefault(capabilityId, options);
    }

    static scale(
        capabilityId: string,
        address: number,
        length: number,
        dataType: RegisterDataType,
        scale: number,
        accessMode: AccessMode = AccessMode.ReadOnly,
        options: ModbusRegisterOptions = {},
        devicesTypes: DeviceType[] = [DeviceType.SOLAR]
    ) {
        return new ModbusRegister(address, length, dataType, accessMode, devicesTypes).addScale(capabilityId, scale, options);
    }
}

interface ModbusRegisterCapabilityData {
    capabilityId: string;
    address: number;
    length: number;
    dataType: RegisterDataType;
}

interface ModbusRegisterParameters {
    capability: ModbusRegisterCapabilityData;
    accessMode: AccessMode;
    options: ModbusRegisterOptions;
    deviceTypes: DeviceType[];
    tranform?: Transformation;
}
