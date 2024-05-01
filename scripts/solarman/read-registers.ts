/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import { Solarman } from '../../api/solarman/solarman';
import { Logger } from '../../helpers/log';
import { DeviceRepository } from '../../repositories/device-repository/device-repository';
import { Brand } from '../../repositories/device-repository/models/enum/brand';
import { ModbusRegisterParseConfiguration } from '../../repositories/device-repository/models/modbus-register';

const host = '10.210.5.17';
const log = new Logger();

const valueResolved = async (value: any, buffer: Buffer, parseConfiguration: ModbusRegisterParseConfiguration) => {
    const result = parseConfiguration.calculateValue(value, buffer, log);
    log.log(parseConfiguration.capabilityId, ':', result);
};

//const device = DeviceRepository.getDeviceByBrandAndModel(Brand.Deye, 'deye-sun-xk-sg01hp3-eu-am2');
const device = DeviceRepository.getDeviceByBrandAndModel(Brand.Afore, 'afore-hybrid-inverter');
//const device = DeviceRepository.getDeviceByBrandAndModel(Brand.Growatt, 'growatt-tl3');

if (!device) {
    log.error('Device not found');
    process.exit(1);
}

const api = new Solarman(log, device, host, '3518024876');
api.setOnDataReceived(valueResolved);

const workModeRegister = DeviceRepository.getRegisterByTypeAndAddress(device, 'input', 2500);

const perform = async (): Promise<void> => {
    await api.connect();

    await api.readRegistersInBatch();

    //    await api.writeRegister(workModeRegister!, 1);
    /*
    const address = DeviceRepository.getRegisterByTypeAndAddress(device, 'input', 507);

    if (address) {
        await api.readAddress(address, RegisterType.Input);
    } else {
        log.error('Address not found');
    }
    */
};

perform()
    .then(() => {
        log.log('Registers read');
        api.disconnect();
    })
    .catch(log.error)
    .finally(() => {});
