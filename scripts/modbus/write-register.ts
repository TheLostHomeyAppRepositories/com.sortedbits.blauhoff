/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import { ModbusAPI } from '../../api/modbus/modbus-api';
import { Logger } from '../../helpers/log';
import { DeviceRepository } from '../../repositories/device-repository/device-repository';
import { RegisterDataType } from '../../repositories/device-repository/models/enum/register-datatype';
import { ModbusRegister, ModbusRegisterParseConfiguration } from '../../repositories/device-repository/models/modbus-register';

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

const registerAddress = 145;

const valueResolved = async (value: any, buffer: Buffer, parseConfiguration: ModbusRegisterParseConfiguration) => {
    const result = parseConfiguration.calculateValue(value, buffer, log);
    log.log(parseConfiguration.capabilityId, result);
};

const addressInfo = ModbusRegister.default('', registerAddress, 1, RegisterDataType.INT16);

const api = new ModbusAPI(log, host, Number(port), Number(unitId), device);

const perform = async (): Promise<void> => {
    api.onDataReceived = valueResolved;

    await api.connect();

    const address = device?.holdingRegisters.find((r) => r.address === 142);

    if (!address) {
        log.error('Address not found');
        process.exit(1);
        return;
    }

    //  const { gridcharge, generatorcharge, powerlimit, batterycharge } = args;
    /*
    const parameters = {
        gridcharge: 'true',
        generatorcharge: 'false',
        powerlimit: 3400,
        batterycharge: 15,
    };

    await device.callAction(log, 'set_all_timeslot_parameters', parameters, api);
*/

    const parameters = {
        value: 100,
        charge_command: 'charge',
    };

    // await device.callAction(log, 'set_charge_command', parameters, api);
    /*

    log.filteredLog('Reading current value', addressInfo.address);
    //    const currentValue = await api.readAddress(address);

    await api.writeRegister(addressInfo, 0);
    //    log.filteredLog('Current value', currentValue);

    await api.writeRegister(addressInfo, 0);
    */
};

perform()
    .then(() => {
        log.log('Performed test');
    })
    .catch(log.error)
    .finally(() => {
        api.disconnect();
    });
