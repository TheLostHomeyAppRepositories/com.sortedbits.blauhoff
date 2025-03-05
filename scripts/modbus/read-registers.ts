/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import { ModbusAPI } from '../../api/modbus/modbus-api';
import { Logger } from '../../helpers/log';
import { DeviceRepository } from '../../repositories/device-repository/device-repository';
import { ModbusRegisterParseConfiguration } from '../../repositories/device-repository/models/modbus-register';

require('dotenv').config();

const log = new Logger();

if (!process.env.HOST || !process.env.PORT || !process.env.SERIAL || !process.env.PORT || !process.env.DEVICE_ID || !process.env.UNIT_ID) {
    log.error('Missing environment variables');
    process.exit(1);
}

const host = process.env.HOST;
const port = process.env.PORT;
const deviceId = process.env.DEVICE_ID;
const unitId = process.env.UNIT_ID;

const device = DeviceRepository.getInstance().getDeviceById(deviceId);

if (!device) {
    log.error('Device not found');
    process.exit(1);
}

const valueResolved = async (value: any, buffer: Buffer, parseConfiguration: ModbusRegisterParseConfiguration) => {
    const result = parseConfiguration.calculateValue(value, buffer, log);

    if (!parseConfiguration.validateValue(result, log).valid) {
        log.derror(parseConfiguration.capabilityId, 'INVALID', result);
    } else {
        log.log(parseConfiguration.capabilityId, result);
    }
};

const api = new ModbusAPI(log, host, Number(port), Number(unitId), device);

const perform = async (): Promise<void> => {
    api.onDataReceived = valueResolved;

    await api.connect();

    await api.readRegistersInBatch();
    //    await api.readRegisters();
};

perform()
    .then(() => {
        log.log('Performed test');
    })
    .catch(log.error)
    .finally(() => {
        api.disconnect();
    });
