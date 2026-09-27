/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import { ModbusDevice } from '../../../models/modbus-device';
import { Brand } from '../../../models/enum/brand';
import { holdingRegisters as micHoldingRegisters } from '../growatt-tl/holding-registers';
import { holdingRegisters as tl3HoldingRegisters } from './holding-registers';
import { inputRegisters } from './input-registers';
import { IAPI2 } from '../../../../../api/iapi';
import { RegisterType } from '../../../models/enum/register-type';
import { DeviceType } from '../../../models/modbus-register';
import { IBaseLogger, Logger } from '../../../../../helpers/log';

/*
 * This one class covers the whole MOD TL3-X series (3000-10000W variants
 * share the same registers), but the Active Power Rate register (3) is a
 * percentage, and target_power is watts, so a rated power is needed to
 * convert between them. Only tested against a MOD 6000TL3-X
 * (docs/TASKS.md-style note: see the read-only probe in
 * scripts/modbus/probe-growatt-power-limit.ts). If you pair a
 * different wattage variant of this series, change RATED_POWER_W to
 * match your inverter's nameplate rating - a future version could make
 * this a per-device setting instead.
 */
const RATED_POWER_W = 6000;

export class GrowattTL3X extends ModbusDevice {
    constructor() {
        super('growatt-tl3', Brand.Growatt, 'Growatt 3PH MOD TL3-X series', 'Three phase Growatt string inverter.', false);

        this.supportsSolarman = true;
        this.deprecatedCapabilities = ['measure_power.l1', 'measure_power.l2', 'measure_power.l3'];

        this.writableCapabilities = [
            { capabilityId: 'target_power', deviceTypes: [DeviceType.SOLAR], options: { min: 0, max: RATED_POWER_W, step: 60 } },
        ];
        this.supportedCapabilityListeners = {
            target_power: this.onSetTargetPower,
        };

        this.addInputRegisters(inputRegisters);
        this.addHoldingRegisters(micHoldingRegisters);
        this.addHoldingRegisters(tl3HoldingRegisters);
    }

    verifyConnection = async (api: IAPI2, log: Logger): Promise<boolean> => {
        const register = this.getRegisterByTypeAndAddress(RegisterType.Holding, 23)
        if (!register) {
            return false;
        }

        const values = await api.readRegister(register);

        return (values.length === 1 && values[0].value !== undefined);
    }

    /**
     * target_power capability listener: curtails production by writing
     * Growatt's Active Power Rate register (3, 0-100%). No mode gating
     * needed (unlike the battery's target_power_mode) - the register
     * always takes effect, so releasing control just means writing 100
     * (the capability's max, per PLAN.md's "for a solarpanel, target_power
     * is a positive production cap").
     */
    onSetTargetPower = async (origin: IBaseLogger, value: number, client: IAPI2): Promise<void> => {
        const register = this.getRegisterByTypeAndAddress(RegisterType.Holding, 3);

        if (register === undefined) {
            origin.error('Register not found');
            return;
        }

        if (value < 0 || value > RATED_POWER_W) {
            origin.error('target_power out of range', value);
            return;
        }

        const percent = Math.round((value / RATED_POWER_W) * 100);

        try {
            const output = await client.writeRegister(register, percent);
            origin.log('target_power set to', value, 'W ->', percent, '% Active Power Rate', output);
        } catch (error) {
            origin.error('Error writing target_power', error);
        }
    };
}
