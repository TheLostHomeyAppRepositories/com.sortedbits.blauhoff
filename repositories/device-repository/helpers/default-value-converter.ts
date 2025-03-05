/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import { IBaseLogger } from '../../../helpers/log';
import { RegisterDataType } from '../models/enum/register-datatype';
import { ModbusRegister } from '../models/modbus-register';

/**
 * Converts the value read from a Modbus register based on the register's data type.
 *
 * @param log - The logger instance.
 * @param buffer - The buffer containing the value.
 * @param register - The Modbus register.
 * @returns The converted value.
 */
export const defaultValueConverter = (log: IBaseLogger, buffer: Buffer, register: ModbusRegister): any => {
    if (buffer.length === 0) {
        log.derror('Buffer for ', register.address, 'is empty');
        return undefined;
    }

    switch (register.dataType) {
        case RegisterDataType.UINT8:
            return buffer.readUInt8();
        case RegisterDataType.UINT16:
            return buffer.readUInt16BE();
        case RegisterDataType.UINT32:
            return buffer.readUInt32BE();
        case RegisterDataType.INT16:
            return buffer.readInt16BE();
        case RegisterDataType.INT32:
            return buffer.readInt32BE();
        case RegisterDataType.FLOAT32:
            return buffer.readFloatBE();
        case RegisterDataType.STRING:
            return buffer.toString('utf8');
        default:
            log.derror('Unknown data type', register.dataType);
            return undefined;
    }
};
