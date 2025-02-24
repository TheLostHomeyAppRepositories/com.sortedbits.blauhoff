/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import { Device } from '../../../models/device';
import { Brand } from '../../../models/enum/brand';
import { holdingRegisters } from './holding-registers';
import { inputRegisters } from './input-registers';

export class GrowattTLX extends Device {
    constructor() {
        super('growatt-tl', Brand.Growatt, 'Growatt 1PH MIC TL-X series', 'Single phase Growatt string inverter.', false);

        this.supportsSolarman = true;
        this.deprecatedCapabilities = ['measure_power.l1', 'measure_power.l2', 'measure_power.l3', 'meter_power.some_test'];

        this.addInputRegisters(inputRegisters);
        this.addHoldingRegisters(holdingRegisters);
    }
}
