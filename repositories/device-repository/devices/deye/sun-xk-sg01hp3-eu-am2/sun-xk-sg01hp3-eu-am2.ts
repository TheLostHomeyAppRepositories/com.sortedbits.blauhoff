/*
 * Created on Fri Mar 22 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import { IAPI, IAPI2 } from '../../../../../api/iapi';
import { logBits, writeBitsToBuffer } from '../../../../../helpers/bits';
import { IBaseLogger, Logger } from '../../../../../helpers/log';
import { ModbusDevice } from '../../../models/modbus-device';
import { Brand } from '../../../models/enum/brand';
import { RegisterType } from '../../../models/enum/register-type';
import { DeviceType } from '../../../models/modbus-register';
import { holdingRegisters } from './holding-registers';

export class DeyeSunXKSG01HP3 extends ModbusDevice {
    constructor() {
        super('sun-xk-sg01hp3-eu-am2', Brand.Deye, 'BlauHoff Sun *K SG01HP3 EU AM2', 'BlauHoff Deye Sun *K SG01HP3 EU AM2 Series', true);

        this.supportsSolarman = true;
        this.deprecatedCapabilities = ['status_code.work_mode', 'status_code.run_mode'];

        this.supportedFlows = {
            actions: {
                set_max_solar_power: this.setMaxSolarPower,
                set_solar_sell: this.setSolarSell,
                set_max_sell_power: this.setMaxSellPower,
                write_value_to_register: this.writeValueToRegister,
                set_energy_pattern: this.setEnergyPattern,
                set_grid_peak_shaving_on: this.setGridPeakShavingOn,
                set_grid_peak_shaving_off: this.setGridPeakShavingOff,
                set_work_mode_and_zero_export_power: this.setWorkmodeAndZeroExportPower,
                set_time_of_use_enabled: this.setTimeOfUseEnabled,
                set_time_of_use_day_enabled: this.setTimeOfUseDayEnabled,
                set_time_of_use_timeslot_parameters: this.setTimeOfUseTimeslotParametersStart,
                set_all_timeslot_parameters: this.setAllTimeslotParameters,
            },
        };

        this.addHoldingRegisters(holdingRegisters);

        this.stateCalculations = [
            {
                capabilityId: 'measure_power',
                deviceTypes: [DeviceType.SOLAR],
                dependecies: ['measure_power.pv1', 'measure_power.pv2'],
                calculation: async (device, state): Promise<any> => {
                    const pv1 = device.getCapabilityValue('measure_power.pv1');
                    const pv2 = device.getCapabilityValue('measure_power.pv2');

                    return Number(pv1) + Number(pv2);
                }
            }
        ];
    }

    verifyConnection = async (api: IAPI2, log: Logger): Promise<boolean> => {
        const register = this.getRegisterByTypeAndAddress(RegisterType.Holding, 3)
        if (!register) {
            return false;
        }

        const values = await api.readRegister(register);

        return (values.length === 1 && values[0].value !== undefined);
    }

    setMaxSolarPower = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        const register = this.getRegisterByTypeAndAddress(RegisterType.Holding, 340);

        if (register === undefined) {
            origin.derror('Register not found');
            return;
        }

        const { value } = args;

        origin.dlog('Setting max solar power to: ', value);

        if (value < 1000 || value > 7800) {
            origin.derror('Value out of range');
            return;
        }

        try {
            const payload = register.calculatePayload(value, origin);
            const result = await client.writeRegister(register, payload);
            origin.dlog('Output', result);
        } catch (error) {
            origin.derror('Error enabling solar selling', error);
        }
    };

    setMaxSellPower = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        const register = this.getRegisterByTypeAndAddress(RegisterType.Holding, 143);

        if (register === undefined) {
            origin.derror('Register not found');
            return;
        }

        const { value } = args;

        origin.dlog('Setting max sell power to: ', value);

        if (value < 10 || value > 16000) {
            origin.derror('Value out of range');
            return;
        }

        try {
            const payload = register.calculatePayload(value, origin);
            const result = await client.writeRegister(register, payload);
            origin.dlog('Output', result);
        } catch (error) {
            origin.derror('Error enabling solar selling', error);
        }
    };

    setSolarSell = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        const register = this.getRegisterByTypeAndAddress(RegisterType.Holding, 145);
        if (register === undefined) {
            origin.derror('Register not found');
            return;
        }

        const { enabled } = args;

        origin.dlog('Setting solar selling to: ', enabled);

        try {
            const result = await client.writeRegister(register, enabled ? 1 : 0);
            origin.dlog('Output', result);
        } catch (error) {
            origin.derror('Error enabling solar selling', error);
        }
    };

    writeValueToRegister = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        client.writeValueToRegister(args);
    };

    setEnergyPattern = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        const register = this.getRegisterByTypeAndAddress(RegisterType.Holding, 141);

        if (register === undefined) {
            origin.derror('Register not found');
            return;
        }

        const { value } = args;

        if (value !== 'batt_first' && value !== 'load_first') {
            origin.derror('Invalid value', value);
            return;
        }

        origin.dlog('Setting energy pattern to: ', value);

        const newBits = value === 'batt_first' ? [0] : [1];

        try {
            const readBuffer = await client.readAddressWithoutConversion(register);

            if (!readBuffer) {
                throw new Error('Error reading current value');
            }

            logBits(origin, readBuffer);

            const byteIndex = 1; // Big Endian so we count in reverse
            const resultBuffer = writeBitsToBuffer(readBuffer, byteIndex, newBits);
            logBits(origin, resultBuffer);

            const result = await client.writeBufferRegister(register, resultBuffer);
            origin.dlog('Output', result);
        } catch (error) {
            origin.derror('Error reading current value', error);
            return;
        }
    };

    setWorkmodeAndZeroExportPower = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        const workmodes = [
            { id: 'selling_first', value: 0 },
            {
                id: 'zero_export_to_load',
                value: 1,
            },
            {
                id: 'zero_export_to_ct',
                value: 2,
            },
        ];

        const modeRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, 142);
        const powerRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, 104);

        if (!modeRegister || !powerRegister) {
            origin.derror('Register not found');
            return;
        }

        const { value, workmode } = args;

        const workmodeDefinition = workmodes.find((m) => m.id === workmode);

        if (!workmodeDefinition) {
            origin.derror('Invalid workmode', workmode);
            return;
        }

        if (value < 0 || value > 100) {
            origin.derror('Value out of range', value);
            return;
        }

        origin.dlog('Setting workmode to ', workmode, 'with zero export power to ', value, 'W');

        const workModeValue = workmodeDefinition.value;

        try {
            const modeResult = await client.writeRegister(modeRegister, workModeValue);
            origin.dlog('Workmode output', modeResult);

            const payload = powerRegister.calculatePayload(value, origin);
            const powerResult = await client.writeRegister(powerRegister, payload);
            origin.dlog('Power output', powerResult);
        } catch (error) {
            origin.derror('Error setting workmode or power', error);
        }
    };

    setGridPeakShavingOn = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        const modeRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, 178);
        const powerRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, 191);

        if (!modeRegister || !powerRegister) {
            origin.derror('Register not found');
            return;
        }

        const { value } = args;

        if (value < 0 || value > 16000) {
            origin.derror('Value out of range', value);
            return;
        }

        const bits = [1, 1];
        const bitIndex = 4;
        origin.dlog('Setting Grid Peak Shaving mode on with ', value, 'W');

        try {
            const result = await client.writeBitsToRegister(modeRegister, bits, bitIndex);
            origin.dlog('Set `grid peak shaving on` result', result);

            if (result) {
                const payload = powerRegister.calculatePayload(value, origin);
                const powerResult = await client.writeRegister(powerRegister, payload);
                origin.dlog('Power output', powerResult);
            }
        } catch (error) {
            origin.derror('Error setting workmode or power', error);
        }
    };

    setGridPeakShavingOff = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        const modeRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, 178);

        if (!modeRegister) {
            origin.derror('Register not found');
            return;
        }

        origin.dlog('Setting Grid Peak Shaving mode off');

        const bits = [0, 1];
        const bitIndex = 4;

        try {
            const result = await client.writeBitsToRegister(modeRegister, bits, bitIndex);
            origin.dlog('Set `grid peak shaving off` result', result);
        } catch (error) {
            origin.derror('Error setting grid peak shaving mode', error);
        }
    };

    setTimeOfUseEnabled = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        const register = this.getRegisterByTypeAndAddress(RegisterType.Holding, 146);

        if (register === undefined) {
            origin.derror('Register not found');
            return;
        }

        const { enabled } = args;
        origin.dlog('Setting time of use enabled to: ', enabled);
        const bits = enabled === 'true' ? [1] : [0];

        try {
            const result = await client.writeBitsToRegister(register, bits, 0);
            origin.dlog('Set time of use enabled result', result);
        } catch (error) {
            origin.derror('Error setting workmode or power', error);
        }
    };

    setTimeOfUseDayEnabled = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        const register = this.getRegisterByTypeAndAddress(RegisterType.Holding, 146);

        if (register === undefined) {
            origin.derror('Register not found');
            return;
        }

        const { enabled, day } = args;

        if (Number(day) < 1 || Number(day) > 7) {
            origin.derror('Invalid day', day);
        }

        const bitIndex = Number(day);
        const bits = enabled === 'true' ? [1] : [0];

        try {
            const result = await client.writeBitsToRegister(register, bits, bitIndex);
            origin.dlog('Set time of use for day enabled result', result);
        } catch (error) {
            origin.derror('Error setting workmode or power', error);
        }
    };

    setTimeOfUseTimeslotParametersStart = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        const randomTimeout = Math.floor(Math.random() * 600);

        return new Promise((resolve) => {
            setTimeout(() => resolve(this.setTimeOfUseTimeslotParameters(origin, args, client)), randomTimeout);
        });
    };

    setAllTimeslotParameters = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        const { gridcharge, generatorcharge, powerlimit, batterycharge } = args;

        const powerLimitNumber = Number(powerlimit);
        if (powerLimitNumber < 0 || powerLimitNumber > 8000) {
            origin.derror('Invalid power limit', powerlimit);
            return;
        }

        const batteryChargeNumber = Number(batterycharge);
        if (batteryChargeNumber < 0 || batteryChargeNumber > 100) {
            origin.derror('Invalid battery charge', batterycharge);
            return;
        }

        const timeslots = 6;

        const powerRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, 154);
        const batteryRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, 166);
        const chargeRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, 172);

        if (!chargeRegister || !powerRegister || !batteryRegister) {
            origin.derror('Register not found', powerRegister, batteryRegister, chargeRegister);
            return;
        }

        const powerValues = Array.from({ length: timeslots }, (_, i) => powerRegister.calculatePayload(powerLimitNumber, origin));
        const batteryRegisterValues = Array.from({ length: timeslots }, (_, i) => batteryChargeNumber);
        const chargeValues = Array.from({ length: timeslots }, (_, i) => this.chargesToValue(gridcharge, generatorcharge));

        if ((await client.writeRegisters(chargeRegister, chargeValues)) === false) {
            throw new Error('Error setting all timeslot charge');
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        if ((await client.writeRegisters(powerRegister, powerValues)) === false) {
            throw new Error('Error setting all timeslot power');
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        if ((await client.writeRegisters(batteryRegister, batteryRegisterValues)) === false) {
            throw new Error('Error setting all timeslot power');
        }
    };

    setTimeOfUseTimeslotParameters = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        const { timeslot, time, gridcharge, generatorcharge, powerlimit, batterycharge } = args;

        const timeslotNumber = Number(timeslot);
        if (timeslotNumber < 1 || timeslotNumber > 6) {
            origin.derror('Invalid timeslot', timeslot);
            return;
        }

        const powerLimitNumber = Number(powerlimit);
        if (powerLimitNumber < 0 || powerLimitNumber > 8000) {
            origin.derror('Invalid power limit', powerlimit);
            return;
        }

        const batteryChargeNumber = Number(batterycharge);
        if (batteryChargeNumber < 0 || batteryChargeNumber > 100) {
            origin.derror('Invalid battery charge', batterycharge);
            return;
        }

        const chargeAddress = 172 + (timeslotNumber - 1);
        const powerAddress = 154 + (timeslotNumber - 1);
        const batteryAddress = 166 + (timeslotNumber - 1);
        const timeAddress = 148 + (timeslotNumber - 1);

        const chargeRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, chargeAddress);
        const powerRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, powerAddress);
        const batteryRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, batteryAddress);
        const timeRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, timeAddress);

        if (!chargeRegister || !powerRegister || !batteryRegister || !timeRegister) {
            origin.derror('Register not found', chargeAddress, powerAddress, batteryAddress, timeAddress);
            return;
        }

        let chargeValue = this.chargesToValue(gridcharge, generatorcharge);
        const parsedTime = Number(time.replace(':', ''));
        const powerPayload = powerRegister.calculatePayload(powerLimitNumber, origin);

        origin.dlog('Setting timeslot parameters', {
            timeslot,
            parsedTime,
            gridcharge,
            generatorcharge,
            chargeValue,
            powerPayload,
            batteryChargeNumber,
        });

        if ((await client.writeRegister(chargeRegister, chargeValue)) === false) {
            throw new Error('Error setting timeslot charge');
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        if ((await client.writeRegister(powerRegister, powerPayload)) === false) {
            throw new Error('Error setting timeslot power');
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        if ((await client.writeRegister(batteryRegister, batteryChargeNumber)) === false) {
            throw new Error('Error setting timeslot battery');
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        if ((await client.writeRegister(timeRegister, parsedTime)) === false) {
            throw new Error('Error setting timeslot time');
        }
    };

    private chargesToValue = (gridCharge: string, generatorCharge: string): number => {
        let chargeValue = 0;
        if (gridCharge === 'true') {
            chargeValue += 1;
        }
        if (generatorCharge === 'true') {
            chargeValue += 2;
        }
        return chargeValue;
    };
}
