/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import { ModbusDevice } from '../../../models/modbus-device';
import { Brand } from '../../../models/enum/brand';
import { holdingRegisters } from './holding-registers';
import { inputRegisters } from './input-registers';
import { IAPI2 } from '../../../../../api/iapi';
import { Logger } from '../../../../../helpers/log';
import { RegisterType } from '../../../models/enum/register-type';

export class GrowattTLX extends ModbusDevice {
    constructor() {
        super('growatt-tl', Brand.Growatt, 'Growatt 1PH MIC TL-X series', 'Single phase Growatt string inverter.', false);

        this.supportsSolarman = true;
        this.deprecatedCapabilities = ['measure_power.l1', 'measure_power.l2', 'measure_power.l3', 'meter_power.some_test'];

        this.addInputRegisters(inputRegisters);
        this.addHoldingRegisters(holdingRegisters);
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
