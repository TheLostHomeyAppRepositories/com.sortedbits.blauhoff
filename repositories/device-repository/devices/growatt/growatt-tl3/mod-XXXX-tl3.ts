/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import { ModbusDevice } from '../../../models/modbus-device';
import { Brand } from '../../../models/enum/brand';
import { holdingRegisters as micHoldingRegisters } from '../growatt-tl/holding-registers';
import { inputRegisters } from './input-registers';
import { IAPI2 } from '../../../../../api/iapi';
import { RegisterType } from '../../../models/enum/register-type';
import { Logger } from '../../../../../helpers/log';

export class GrowattTL3X extends ModbusDevice {
    constructor() {
        super('growatt-tl3', Brand.Growatt, 'Growatt 3PH MOD TL3-X series', 'Three phase Growatt string inverter.', false);

        this.supportsSolarman = true;
        this.deprecatedCapabilities = ['measure_power.l1', 'measure_power.l2', 'measure_power.l3'];

        this.addInputRegisters(inputRegisters);
        this.addHoldingRegisters(micHoldingRegisters);
    }

    verifyConnection = async (api: IAPI2, log: Logger): Promise<boolean> => {
        const register = this.getRegisterByTypeAndAddress(RegisterType.Holding, 23)
        if (!register) {
            return false;
        }

        const values = await api.readRegister(register);

        return (values.length === 1 && values[0].value !== undefined);
    }
}
