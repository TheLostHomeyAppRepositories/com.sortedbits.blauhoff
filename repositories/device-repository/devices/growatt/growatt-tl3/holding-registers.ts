import { AccessMode } from '../../../models/enum/access-mode';
import { RegisterDataType } from '../../../models/enum/register-datatype';
import { DeviceType, ModbusRegister } from '../../../models/modbus-register';

/*
 * Growatt's "Active Power Rate" register: 0-100, the percentage of rated
 * power the inverter is allowed to produce. Confirmed on a real
 * MOD 6000TL3-X on 2026-09-27 via a read-only probe
 * (scripts/modbus/probe-growatt-power-limit.ts): holding register 3
 * read back 100 (uncapped), matching Growatt's publicly documented
 * protocol.
 *
 * WriteOnly here, like Afore's timeslot.time registers: it doesn't map
 * to a real Homey capability directly (it's a percentage, not watts) -
 * GrowattTL3X converts it to/from target_power in watts itself, using
 * the model's rated power.
 */
export const holdingRegisters: ModbusRegister[] = [
    ModbusRegister.default('active_power_rate', 3, 1, RegisterDataType.UINT16, AccessMode.WriteOnly, {}, [DeviceType.SOLAR]),
];
