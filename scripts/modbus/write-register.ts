/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import { ModbusAPI } from '../../api/modbus/modbus-api';
import { ModbusRegister } from '../../api/modbus/models/modbus-register';
import { DeviceRepository } from '../../api/modbus/device-repository/device-repository';
import { Brand } from '../../api/modbus/models/brand';
// import { mod_tl3_registers } from '../../drivers/blauhoff-modbus/devices/growatt/mod-XXXX-tl3';
import { Logger } from '../../helpers/log';
import { RegisterDataType } from '../../api/modbus/models/register-datatype';
import { DeviceAction } from '../../api/modbus/helpers/set-modes';

const host = '88.159.155.195';
const port = 502;
const unitId = 1;
const log = new Logger();

const registerAddress = 145;
const valueToWrite = 0x00;

const valueResolved = async (value: any, register: ModbusRegister) => {
  const result = register.calculateValue(value);
  log.log(register.capabilityId, result);
};

const device = DeviceRepository.getDeviceByBrandAndModel(
  Brand.Deye,
  'deye-sun-xk-sg01hp3-eu-am2',
);

const addressInfo = ModbusRegister.default(
  '',
  registerAddress,
  1,
  RegisterDataType.INT16,
);

const api = new ModbusAPI(log, host, port, unitId, device!.definition);

const perform = async (): Promise<void> => {
  api.onDataReceived = valueResolved;

  await api.readAddress(addressInfo);
  await api.callAction(DeviceAction.disableSellSolar, {});
  await api.readAddress(addressInfo);
};

perform()
  .then(() => {
    log.log('Performed test');
  })
  .catch(log.error)
  .finally(() => {
    api.disconnect();
  });
