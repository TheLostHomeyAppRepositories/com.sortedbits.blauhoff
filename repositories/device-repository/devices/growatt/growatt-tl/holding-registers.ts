import { RegisterDataType } from '../../../models/enum/register-datatype';
import { ModbusRegister } from '../../../models/modbus-register';

export const holdingRegisters: ModbusRegister[] = [
    ModbusRegister.default('serial', 23, 5, RegisterDataType.STRING),
];
