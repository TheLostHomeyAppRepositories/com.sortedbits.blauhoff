/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import { IAPI, IAPI2 } from '../../../../../api/iapi';
import { IBaseLogger } from '../../../../../helpers/log';
import { ModbusDevice } from '../../../models/modbus-device';
import { Brand } from '../../../models/enum/brand';
import { bufferForDataType } from '../../../models/enum/register-datatype';
import { RegisterType } from '../../../models/enum/register-type';
import { DeviceType } from '../../../models/modbus-register';
import { holdingRegisters } from './holding-registers';
import { inputRegisters } from './input-registers';

export class AforeAFXKTH extends ModbusDevice {
    constructor() {
        super('af-xk-th-three-phase-hybrid', Brand.Afore, 'BlauHoff AF XK-TH', 'BlauHoff Afore AF XK-TH Three Phase Hybrid Inverter Series', true);

        this.supportsSolarman = true;
        this.deprecatedCapabilities = ['status_text.batter_state'];

        this.supportedFlows = {
            actions: {
                set_charge_command: this.setChargeCommand,
                write_value_to_register: this.writeValueToRegister,
                set_ems_mode: this.setEmsMode,
                set_ac_charging_timeslot: this.setAcChargingTimeslot,
                set_timing_ac_charge_off: this.setTimingAcChargeOff,
                set_timing_ac_charge_on: this.setTimingAcChargeOn,
            },
        };

        this.stateCalculations = [];

        this.addInputRegisters(inputRegisters);
        this.addHoldingRegisters(holdingRegisters);
    }

    writeValueToRegister = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        client.writeValueToRegister(args);
    };

    setChargeCommand = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        const emsRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, 2500);
        const commandRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, 2501);
        const powerRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, 2502);

        if (commandRegister === undefined || powerRegister === undefined || emsRegister === undefined) {
            origin.error('Register not found');
            return;
        }

        const { value, charge_command } = args;

        if (value < -22000 || value > 22000) {
            origin.error('Value out of range');
            return;
        }

        const commandValue = charge_command === 'charge' ? '00aa' : '00bb';
        const commandBuffer = Buffer.from(commandValue, 'hex');
        const powerBuffer = bufferForDataType(powerRegister.dataType, value);

        origin.log('Setting charge command', commandBuffer, 'and power', powerBuffer);

        try {
            const powerOutput = await client.writeBufferRegister(powerRegister, powerBuffer);
            const commandOutput = await client.writeBufferRegister(commandRegister, commandBuffer);
            const emsModeOutput = await client.writeRegister(emsRegister, 4);

            origin.log('Command and power output', emsModeOutput, commandOutput, powerOutput);
        } catch (error) {
            origin.error('Error writing to register', error);
        }
    };

    setEmsMode = async (origin: IBaseLogger, args: { mode: number }, client: IAPI2): Promise<void> => {
        const emsRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, 2500);

        if (emsRegister === undefined) {
            origin.error('Register not found');
            return;
        }

        const { mode } = args;

        const modeNumber = Number(mode);

        if (isNaN(modeNumber)) {
            origin.error('Trying to set an invalid EMS mode', mode);
            return;
        }

        if (modeNumber < 0 || modeNumber > 8) {
            origin.error('Value out of range');
            return;
        }

        origin.filteredLog('Setting EMS mode to', modeNumber, typeof modeNumber);

        try {
            const emsModeOutput = await client.writeRegister(emsRegister, modeNumber);

            origin.log('setEmsModeOutput', emsModeOutput);
        } catch (error) {
            origin.error('Error writing to register', error);
        }
    };

    setAcChargingTimeslot = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        const { timeslot, starttime, endtime } = args;
        if (timeslot < 1 || timeslot > 4) {
            origin.error('Value out of range');
            return;
        }

        if (!starttime || !endtime) {
            origin.error('Start or end time not provided');
            return;
        }

        const timeToBuffer = (time: string): Buffer => {
            const [hours, minutes] = time.split(':');
            const buffer = Buffer.from([parseInt(hours), parseInt(minutes)]);
            return buffer;
        };

        const startAddress = 2509 + (timeslot - 1) * 2;
        const endAddress = 2510 + (timeslot - 1) * 2;

        const startBuffer = timeToBuffer(starttime);
        const endBuffer = timeToBuffer(endtime);

        const startRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, startAddress);
        const endRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, endAddress);

        if (startRegister === undefined || endRegister === undefined) {
            origin.error('Register not found');
            return;
        }

        try {
            const startOutput = await client.writeBufferRegister(startRegister, startBuffer);
            const endOutput = await client.writeBufferRegister(endRegister, endBuffer);

            origin.log('Start and end time output', startOutput, endOutput);
        } catch (error) {
            origin.error('Error writing to register', error);
        }
    };

    setTimingAcChargeOff = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        const register = this.getRegisterByTypeAndAddress(RegisterType.Holding, 206);

        if (register === undefined) {
            origin.error('Register not found');
            return;
        }

        try {
            const output = await client.writeBitsToRegister(register, [0], 4);
            origin.log('Output', output);
        } catch (error) {
            origin.error('Error writing to register', error);
        }
    };

    setTimingAcChargeOn = async (origin: IBaseLogger, args: any, client: IAPI2): Promise<void> => {
        const enabledRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, 206);
        const acpchgmaxRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, 2504);
        const acsocmaxchgRegister = this.getRegisterByTypeAndAddress(RegisterType.Holding, 2505);

        if (enabledRegister === undefined || acpchgmaxRegister === undefined || acsocmaxchgRegister === undefined) {
            origin.error('Register not found');
            return;
        }

        const { acpchgmax, acsocmaxchg } = args;

        if (acpchgmax < 0 || acpchgmax > 100 || acsocmaxchg < 0 || acsocmaxchg > 100) {
            origin.error('Value out of range');
            return;
        }

        try {
            const output = await client.writeBitsToRegister(enabledRegister, [1], 4);

            const acpchgmaxOutput = await client.writeRegister(acpchgmaxRegister, acpchgmaxRegister.calculatePayload(acpchgmax, origin));
            const acsocmaxchgOutput = await client.writeRegister(acsocmaxchgRegister, acsocmaxchgRegister.calculatePayload(acsocmaxchg, origin));

            origin.log('Output', output, acpchgmaxOutput, acsocmaxchgOutput);
        } catch (error) {
            origin.error('Error writing to register', error);
        }
    };
}
