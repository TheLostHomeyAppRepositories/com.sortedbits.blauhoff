import { IAPI } from '../../../api/iapi';
import { IBaseLogger } from '../../../helpers/log';
import { defaultValueConverter } from '../helpers/default-value-converter';
import { Brand } from './enum/brand';
import { RegisterType } from './enum/register-type';
import { ModbusRegister } from './modbus-register';
import { SupportedFlowTypes, SupportedFlows } from './supported-flows';

export type DataConverter = (log: IBaseLogger, buffer: Buffer, register: ModbusRegister) => any;

export class Device {
    private isRunningAction = false;

    public hasBattery: boolean;

    /**
     * The converter to use to convert the data read from the device
     *
     * @type {DataConverter}
     * @memberof DeviceInformation
     */
    public readonly converter: DataConverter = defaultValueConverter;

    /**
     * The unique identifier of the device. Should be unique between all devices
     *
     * @type {string}
     * @memberof DeviceInformation
     */
    id: string;

    /**
     * Brand of the device, used during pairing
     *
     * @type {Brand}
     * @memberof DeviceInformation
     */
    brand: Brand;

    /**
     * The name of the device, used during pairing and as a display name
     *
     * @type {string}
     * @memberof DeviceInformation
     */
    name: string;

    /**
     * A description of the device, used during pairing
     *
     * @type {string}
     * @memberof DeviceInformation
     */
    description: string;

    /**
     * Does the device support the Solarman protocol
     *
     * @type {boolean}
     * @memberof DeviceInformation
     */
    public supportsSolarman: boolean = true;

    /**
     * Which capabilities are removed and should be removed from Homey.
     *
     * @type {string[]}
     * @memberof DeviceInformation
     */
    public deprecatedCapabilities: string[] = [];

    /**
     * The input registers of the device
     *
     * @type {ModbusRegister[]}
     * @memberof Device
     */
    public inputRegisters: ModbusRegister[] = [];

    /**
     * The holding registers of the device
     *
     * @type {ModbusRegister[]}
     * @memberof Device
     */
    public holdingRegisters: ModbusRegister[] = [];

    /**
     * The supported flows of the device
     *
     * @type {SupportedFlows}
     * @memberof Device
     */
    public supportedFlows: SupportedFlows = {};

    constructor(id: string, brand: Brand, name: string, description: string, hasBattery: boolean) {
        this.id = id;
        this.brand = brand;
        this.name = name;
        this.description = description;
        this.hasBattery = hasBattery;
    }

    callAction = async (origin: IBaseLogger, action: string, args: any, api: IAPI): Promise<void> => {
        const flowType = SupportedFlowTypes[action as keyof typeof SupportedFlowTypes];

        if (!this.supportedFlows?.actions) {
            origin.filteredError('No supported actions found');
            return;
        }

        const deviceAction = this.supportedFlows.actions[flowType];
        if (!deviceAction) {
            origin.filteredError('Unsupported action', action);
            return;
        }

        while (this.isRunningAction) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        this.isRunningAction = true;
        try {
            await deviceAction(origin, args, api);
        } catch (error) {
            origin.error('Error running action', action, error);
        } finally {
            this.isRunningAction = false;
        }
    };

    addInputRegisters(registers: ModbusRegister[]): Device {
        registers.forEach((register) => (register.registerType = RegisterType.Input));

        this.inputRegisters.push(...registers);
        return this;
    }

    addHoldingRegisters(registers: ModbusRegister[]): Device {
        registers.forEach((register) => (register.registerType = RegisterType.Holding));

        this.holdingRegisters.push(...registers);
        return this;
    }

    getRegisterByTypeAndAddress(type: RegisterType, address: number): ModbusRegister | undefined {
        switch (type) {
            case RegisterType.Input:
                return this.inputRegisters.find((register) => register.address === address);
            case RegisterType.Holding:
                return this.holdingRegisters.find((register) => register.address === address);
            default:
                return undefined;
        }
    }
}
