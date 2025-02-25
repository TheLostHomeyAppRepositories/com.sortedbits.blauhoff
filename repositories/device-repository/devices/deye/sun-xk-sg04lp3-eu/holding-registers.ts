import { readBitBE } from '../../../../../helpers/bits';
import { valueToTime } from '../../../../../helpers/time';
import { AccessMode } from '../../../models/enum/access-mode';
import { RegisterDataType } from '../../../models/enum/register-datatype';
import { DeviceType, ModbusRegister } from '../../../models/modbus-register';

export const holdingRegisters: ModbusRegister[] = [
    // settings
    ModbusRegister.default('status_code.modbus_address', 1, 1, RegisterDataType.UINT16),
    ModbusRegister.default('status_code.modbus_protocol', 2, 1, RegisterDataType.UINT16),
    ModbusRegister.default('serial', 3, 5, RegisterDataType.STRING),
    ModbusRegister.scale('status_code.zero_export_power', 104, 1, RegisterDataType.UINT16, 10, AccessMode.ReadWrite),
    ModbusRegister.default('status_code.max_sell_power', 143, 1, RegisterDataType.UINT16, AccessMode.ReadWrite),

    ModbusRegister.default('status_code.grid_peak_shaving_power', 191, 1, RegisterDataType.UINT16, AccessMode.ReadWrite),
    ModbusRegister.default('status_code.max_solar_power', 340, 1, RegisterDataType.UINT16, AccessMode.ReadWrite),

    ModbusRegister.transform(
        'status_text.energie_management_model',
        141,
        1,
        RegisterDataType.UINT16,
        (value) => {
            const firstBit = value & 1;

            if (firstBit === 0) {
                return 'Battery First';
            } else if (firstBit === 1) {
                return 'Load First';
            } else {
                return 'Unknown';
            }
        },
        AccessMode.ReadWrite,
    ),

    ModbusRegister.transform(
        'status_text.work_mode',
        142,
        1,
        RegisterDataType.UINT16,
        (value) => {
            if (value === 0) {
                return 'Selling First';
            } else if (value === 1) {
                return 'Zero Export To Load';
            } else if (value === 2) {
                return 'Zero Export To CT';
            } else {
                return 'Unknown';
            }
        },
        AccessMode.ReadWrite,
    ),

    ModbusRegister.transform(
        'status_text.sell_solar',
        145,
        1,
        RegisterDataType.UINT16,
        (value) => {
            return value === 1 ? 'Yes' : 'No';
        },
        AccessMode.ReadWrite,
    ),

    //more states are possible to choose days of week
    ModbusRegister.transform(
        'status_text.time_of_use',
        146,
        1,
        RegisterDataType.UINT16,
        (value) => {
            const firstBit = value & 1;
            if (firstBit === 0) {
                return 'Disabled';
            } else {
                return 'Enabled';
            }
        },
        AccessMode.ReadWrite,
    ),

    //add to default
    ModbusRegister.transform(
        'status_text.grid_peak_shaving',
        178,
        1,
        RegisterDataType.UINT16,
        (value) => {
            const fourthBit = (value & 8) >> 3; // read 4th bit
            const fifthBit = (value & 16) >> 4; // read 5th bit

            if (fourthBit === 1 && fifthBit === 0) {
                return 'Disabled';
            } else if (fourthBit === 1 && fifthBit === 1) {
                return 'Enabled';
            } else {
                return 'Unknown';
            }
        },
        AccessMode.ReadWrite,
    ),

    ModbusRegister.transform('status_text.run_mode', 500, 1, RegisterDataType.UINT16, (value) => {
        if (value === 0) {
            return 'Standby';
        } else if (value === 1) {
            return 'Selftest';
        } else if (value === 2) {
            return 'Normal';
        } else if (value === 3) {
            return 'Alarm';
        } else if (value === 4) {
            return 'Fault';
        } else {
            return 'Unknown';
        }
    }),

    // meters
    ModbusRegister.scale('meter_power.daily_from_grid', 520, 1, RegisterDataType.UINT16, 0.1), // day gridbuy
    ModbusRegister.scale('meter_power.daily_to_grid', 521, 1, RegisterDataType.UINT16, 0.1), // day gridsell
    ModbusRegister.scale('meter_power.total_from_grid', 522, 1, RegisterDataType.UINT16, 0.1), // total gridbuy
    ModbusRegister.scale('meter_power.total_to_grid', 524, 1, RegisterDataType.UINT16, 0.1), // total gridsell
    ModbusRegister.scale('meter_power.daily_to_load', 526, 1, RegisterDataType.UINT16, 0.1), // consumption day
    ModbusRegister.scale('meter_power.total_to_load', 527, 1, RegisterDataType.UINT16, 0.1), // total consumption
    ModbusRegister.scale('meter_power.daily_pv', 529, 1, RegisterDataType.UINT16, 0.1), // day pv power
    ModbusRegister.scale('meter_power.total_pv', 534, 2, RegisterDataType.UINT16, 0.1), // total PV power
    ModbusRegister.scale('meter_power.daily_battery_charge', 514, 1, RegisterDataType.UINT16, 0.1, undefined, undefined, [DeviceType.BATTERY]),
    ModbusRegister.scale('meter_power.daily_battery_discharge', 515, 1, RegisterDataType.UINT16, 0.1, undefined, undefined, [DeviceType.BATTERY]),
    ModbusRegister.scale('meter_power.total_battery_charge', 516, 1, RegisterDataType.UINT16, 0.1, undefined, undefined, [DeviceType.BATTERY]), // day batt charge
    ModbusRegister.scale('meter_power.total_battery_discharge', 518, 1, RegisterDataType.UINT16, 0.1, undefined, undefined, [DeviceType.BATTERY]), // day batt charge

    // pv
    ModbusRegister.default('measure_power.pv1', 672, 1, RegisterDataType.UINT16),
    ModbusRegister.default('measure_power.pv2', 673, 1, RegisterDataType.UINT16),

    // grid
    ModbusRegister.default('measure_power.grid', 625, 1, RegisterDataType.UINT16),

    ModbusRegister.scale('measure_voltage.grid_l1', 598, 1, RegisterDataType.UINT16, 0.1),
    ModbusRegister.scale('measure_voltage.grid_l2', 599, 1, RegisterDataType.UINT16, 0.1),
    ModbusRegister.scale('measure_voltage.grid_l3', 600, 1, RegisterDataType.UINT16, 0.1),

    // inverter
    ModbusRegister.default('measure_power.inverter', 636, 1, RegisterDataType.INT16),
    ModbusRegister.scale('measure_temperature.ac', 541, 1, RegisterDataType.UINT16, 0.01),

    // battery
    ModbusRegister.default('measure_power.battery1', 590, 1, RegisterDataType.INT16, undefined, undefined, [DeviceType.BATTERY])
        .addTransform('measure_power', (value) => {
            const numberValue = parseFloat(value);

            if (isNaN(numberValue)) {
                return undefined;
            }

            return numberValue * -1;
        }),

    ModbusRegister.scale('measure_current.battery1', 591, 1, RegisterDataType.INT16, 0.01, undefined, undefined, [DeviceType.BATTERY]),
    ModbusRegister.scale('measure_voltage.battery1', 587, 1, RegisterDataType.INT16, 0.1, undefined, undefined, [DeviceType.BATTERY]),

    ModbusRegister.default('measure_percentage.battery1', 588, 1, RegisterDataType.UINT16, undefined, undefined, [DeviceType.BATTERY])
        .addDefault('measure_battery'), // SOC

    ModbusRegister.scale('measure_temperature.battery1', 586, 1, RegisterDataType.UINT16, 0.01, undefined, undefined, [DeviceType.BATTERY]),
    ModbusRegister.scale('measure_temperature.dc', 540, 1, RegisterDataType.UINT16, 0.01, undefined, undefined, [DeviceType.BATTERY]),

    // load
    ModbusRegister.default('measure_power.load', 653, 1, RegisterDataType.INT16),

    // ups
    ModbusRegister.default('measure_power.ups', 643, 1, RegisterDataType.UINT16), //gives a low random value when nothing is connected

    /*
     * Time of use  parameters, we don't want to show ALL of these
     * Should grid/generator charging be enabled for this timeslot
     */
    ModbusRegister.transform('status_text.grid_charging1', 172, 1, RegisterDataType.UINT16, (_, buffer, log) => {
        if (readBitBE(buffer, 0) === 1) {
            return 'Enabled';
        }
        return 'Disabled';
    }).addTransform('status_text.generator_charging1', (_, buffer) => {
        if (readBitBE(buffer, 1) === 1) {
            return 'Enabled';
        }
        return 'Disabled';
    }),

    ModbusRegister.transform('status_text.grid_charging2', 173, 1, RegisterDataType.UINT16, (_, buffer, log) => {
        if (readBitBE(buffer, 0) === 1) {
            return 'Enabled';
        }
        return 'Disabled';
    }).addTransform('status_text.generator_charging2', (_, buffer) => {
        if (readBitBE(buffer, 1) === 1) {
            return 'Enabled';
        }
        return 'Disabled';
    }),
    ModbusRegister.transform('status_text.grid_charging3', 174, 1, RegisterDataType.UINT16, (_, buffer, log) => {
        if (readBitBE(buffer, 0) === 1) {
            return 'Enabled';
        }
        return 'Disabled';
    }).addTransform('status_text.generator_charging3', (_, buffer) => {
        if (readBitBE(buffer, 1) === 1) {
            return 'Enabled';
        }
        return 'Disabled';
    }),
    ModbusRegister.transform('status_text.grid_charging4', 175, 1, RegisterDataType.UINT16, (_, buffer, log) => {
        if (readBitBE(buffer, 0) === 1) {
            return 'Enabled';
        }
        return 'Disabled';
    }).addTransform('status_text.generator_charging4', (_, buffer) => {
        if (readBitBE(buffer, 1) === 1) {
            return 'Enabled';
        }
        return 'Disabled';
    }),
    ModbusRegister.transform('status_text.grid_charging5', 176, 1, RegisterDataType.UINT16, (_, buffer, log) => {
        if (readBitBE(buffer, 0) === 1) {
            return 'Enabled';
        }
        return 'Disabled';
    }).addTransform('status_text.generator_charging5', (_, buffer) => {
        if (readBitBE(buffer, 1) === 1) {
            return 'Enabled';
        }
        return 'Disabled';
    }),
    ModbusRegister.transform('status_text.grid_charging6', 177, 1, RegisterDataType.UINT16, (_, buffer, log) => {
        if (readBitBE(buffer, 0) === 1) {
            return 'Enabled';
        }
        return 'Disabled';
    }).addTransform('status_text.generator_charging6', (_, buffer) => {
        if (readBitBE(buffer, 1) === 1) {
            return 'Enabled';
        }
        return 'Disabled';
    }),

    /*
     * Powerlimit for this timeslot
     */
    ModbusRegister.default('measure_power.powerlimit1', 154, 1, RegisterDataType.UINT16), //, AccessMode.WriteOnly),
    ModbusRegister.default('measure_power.powerlimit2', 155, 1, RegisterDataType.UINT16), //, AccessMode.WriteOnly),
    ModbusRegister.default('measure_power.powerlimit3', 156, 1, RegisterDataType.UINT16), //, AccessMode.WriteOnly),
    ModbusRegister.default('measure_power.powerlimit4', 157, 1, RegisterDataType.UINT16), //, AccessMode.WriteOnly),
    ModbusRegister.default('measure_power.powerlimit5', 158, 1, RegisterDataType.UINT16), //, AccessMode.WriteOnly),
    ModbusRegister.default('measure_power.powerlimit6', 159, 1, RegisterDataType.UINT16), //, AccessMode.WriteOnly),
    /*
     * Minimum battery percentage for this timeslot
     */
    ModbusRegister.default('measure_percentage.tou_battery1', 166, 1, RegisterDataType.UINT16), //, AccessMode.WriteOnly),
    ModbusRegister.default('measure_percentage.tou_battery2', 167, 1, RegisterDataType.UINT16), //, AccessMode.WriteOnly),
    ModbusRegister.default('measure_percentage.tou_battery3', 168, 1, RegisterDataType.UINT16), //, AccessMode.WriteOnly),
    ModbusRegister.default('measure_percentage.tou_battery4', 169, 1, RegisterDataType.UINT16), //, AccessMode.WriteOnly),
    ModbusRegister.default('measure_percentage.tou_battery5', 170, 1, RegisterDataType.UINT16), //, AccessMode.WriteOnly),
    ModbusRegister.default('measure_percentage.tou_battery6', 171, 1, RegisterDataType.UINT16), //, AccessMode.WriteOnly),
    /*
     * Time for this timeslot
     */
    ModbusRegister.transform('status_text.tou_time1', 148, 1, RegisterDataType.UINT16, (value, buffer, log) => {
        return valueToTime(value);
    }),
    ModbusRegister.transform('status_text.tou_time2', 149, 1, RegisterDataType.UINT16, (value, buffer, log) => {
        return valueToTime(value);
    }),
    ModbusRegister.transform('status_text.tou_time3', 150, 1, RegisterDataType.UINT16, (value, buffer, log) => {
        return valueToTime(value);
    }),
    ModbusRegister.transform('status_text.tou_time4', 151, 1, RegisterDataType.UINT16, (value, buffer, log) => {
        return valueToTime(value);
    }),
    ModbusRegister.transform('status_text.tou_time5', 152, 1, RegisterDataType.UINT16, (value, buffer, log) => {
        return valueToTime(value);
    }),
    ModbusRegister.transform('status_text.tou_time6', 153, 1, RegisterDataType.UINT16, (value, buffer, log) => {
        return valueToTime(value);
    }),
];
