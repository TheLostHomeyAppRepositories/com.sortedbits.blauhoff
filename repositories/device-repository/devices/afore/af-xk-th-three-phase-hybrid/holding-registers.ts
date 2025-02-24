import { readBitBE } from '../../../../../helpers/bits';
import { AccessMode } from '../../../models/enum/access-mode';
import { RegisterDataType } from '../../../models/enum/register-datatype';
import { DeviceType, ModbusRegister } from '../../../models/modbus-register';

// 0x03
export const holdingRegisters: ModbusRegister[] = [
    ModbusRegister.transform('status_text.ac_timing_charge', 206, 2, RegisterDataType.UINT32, (_, buffer, log) => {
        if (readBitBE(buffer, 4) === 1) {
            return 'Enabled';
        }
        return 'Disabled';
    }, undefined, undefined, [DeviceType.BATTERY])
        .addTransform('status_text.timing_charge', (_, buffer) => {
            if (readBitBE(buffer, 5) === 1) {
                return 'Enabled';
            }
            return 'Disabled';
        })
        .addTransform('status_text.timing_discharge', (_, buffer) => {
            if (readBitBE(buffer, 6) === 1) {
                return 'Enabled';
            }
            return 'Disabled';
        }),

    ModbusRegister.default('status_code.run_mode', 2500, 1, RegisterDataType.UINT16, AccessMode.ReadWrite, undefined, [DeviceType.BATTERY])
        .addTransform('status_text.ems_mode', (value) => {
            switch (value) {
                case 0:
                    return 'Self-use';
                case 1:
                    return 'Charging priority';
                case 2:
                    return 'Priority in selling electricity';
                case 3:
                    return 'Battery maintenance';
                case 4:
                    return 'Command mode';
                case 5:
                    return 'External EMS';
                case 6:
                    return 'Peak Shaving Mode';
                case 7:
                    return 'Imbalance compensation';
                case 8:
                    return 'Q compensation mode';
                default:
                    return 'Unknown';
            }
        }),

    ModbusRegister.transform('status_text.charge_command', 2501, 1, RegisterDataType.UINT16, (value, buffer, log) => {
        if (buffer.toString('hex') === '00aa') {
            return 'Charge/Discharge';
        } else if (buffer.toString('hex') === '00bb') {
            return 'Paused';
        }
        return 'Unknown';
    }, undefined, undefined, [DeviceType.BATTERY]),

    ModbusRegister.default('measure_power.charge_instructions', 2502, 2, RegisterDataType.INT32, AccessMode.ReadWrite, undefined, [DeviceType.BATTERY]),
    ModbusRegister.scale('measure_percentage.acpchgmax', 2504, 1, RegisterDataType.UINT16, 0.1, AccessMode.ReadWrite, {
        validValueMin: 0,
        validValueMax: 100,
    }, [DeviceType.BATTERY]),
    ModbusRegister.scale('measure_percentage.acsocmaxchg', 2505, 1, RegisterDataType.UINT16, 0.1, AccessMode.ReadWrite, {
        validValueMin: 0,
        validValueMax: 100,
    }, [DeviceType.BATTERY]),

    ModbusRegister.transform(
        'timeslot.time',
        2509,
        1,
        RegisterDataType.UINT16,
        (value, buffer, log) => {
            log.log('timeslot.time', buffer, buffer.length);
        },
        AccessMode.WriteOnly,
        undefined,
        [DeviceType.BATTERY]
    ),
    ModbusRegister.default('timeslot.time', 2510, 1, RegisterDataType.UINT16, AccessMode.WriteOnly,
        undefined,
        [DeviceType.BATTERY]),
    ModbusRegister.default('timeslot.time', 2511, 1, RegisterDataType.UINT16, AccessMode.WriteOnly,
        undefined,
        [DeviceType.BATTERY]),
    ModbusRegister.default('timeslot.time', 2512, 1, RegisterDataType.UINT16, AccessMode.WriteOnly,
        undefined,
        [DeviceType.BATTERY]),
    ModbusRegister.default('timeslot.time', 2513, 1, RegisterDataType.UINT16, AccessMode.WriteOnly,
        undefined,
        [DeviceType.BATTERY]),
    ModbusRegister.default('timeslot.time', 2514, 1, RegisterDataType.UINT16, AccessMode.WriteOnly,
        undefined,
        [DeviceType.BATTERY]),
    ModbusRegister.default('timeslot.time', 2515, 1, RegisterDataType.UINT16, AccessMode.WriteOnly,
        undefined,
        [DeviceType.BATTERY]),
    ModbusRegister.default('timeslot.time', 2516, 1, RegisterDataType.UINT16, AccessMode.WriteOnly,
        undefined,
        [DeviceType.BATTERY]),
];
