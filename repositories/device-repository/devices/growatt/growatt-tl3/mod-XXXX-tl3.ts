/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import { DeviceInformation } from '../../../models/device-information';
import { Brand } from '../../../models/enum/brand';
import { holdingRegisters as micHoldingRegisters } from '../growatt-tl/holding-registers';
import { inputRegisters } from './input-registers';

export class GrowattTL3X extends DeviceInformation {
    constructor() {
        super('growatt-tl3', Brand.Growatt, 'Growatt 3PH MOD TL3-X series', 'Three phase Growatt string inverters with MODBUS interface.');

        this.supportsSolarman = true;
        this.deprecatedCapabilities = ['measure_power.l1', 'measure_power.l2', 'measure_power.l3'];

        this.addInputRegisters(inputRegisters);
        this.addHoldingRegisters(micHoldingRegisters);
    }
}
