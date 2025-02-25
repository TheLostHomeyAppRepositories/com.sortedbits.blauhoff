/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import fs from 'fs';
import path from 'path';
import { unitForCapability } from '../helpers/units';
import { DeviceRepository } from '../repositories/device-repository/device-repository';
import { orderModbusRegisters } from '../repositories/device-repository/helpers/order-modbus-registers';
import { DeviceType, ModbusRegister, ModbusRegisterOptions } from '../repositories/device-repository/models/modbus-register';
import { getSupportedFlowTypeKeys } from '../repositories/device-repository/models/supported-flows';
import { findFile } from './modbus/helpers/fs-helpers';

const capabilitiesOptions: { [key: string]: any } = {};

const driverComposeFiles = findFile('./drivers', 'driver.compose.json');
driverComposeFiles.push(path.resolve('./.homeycompose/drivers/templates/defaults.json'));

for (const file of driverComposeFiles) {
    const json = fs.readFileSync(file, { encoding: 'utf-8' });
    const obj = JSON.parse(json);

    if (obj['capabilitiesOptions']) {
        const allKeys = Object.keys(obj['capabilitiesOptions']);

        for (const key of allKeys) {
            if (obj['capabilitiesOptions'][key]['title']['en']) {
                if (Object.keys(capabilitiesOptions).indexOf(key) === -1) {
                    capabilitiesOptions[key] = obj['capabilitiesOptions'][key]['title']['en'];
                }
            }
        }
    }
}

const devicesTypesToString = (devicesTypes: DeviceType[]): string => {
    const values = [];

    if (devicesTypes.indexOf(DeviceType.BATTERY) > -1) {
        values.push('Battery');
    }

    if (devicesTypes.indexOf(DeviceType.SOLAR) > -1) {
        values.push('Inverter');
    }

    const result = values.join(', ');
    return result;
}

const readFlowInfo = (flowType: string, flowId: string) => {
    const path = '.homeycompose/flow/' + flowType + '/' + flowId + '.json';

    const json = fs.readFileSync(path, { encoding: 'utf-8' });
    const obj = JSON.parse(json);

    let result: any = {};
    result['id'] = obj['id'];
    result['title'] = obj['title']['en'];
    result['titleFormatted'] = obj['titleFormatted']['en'];

    const args = obj['args'];

    let argsInfo: any[] = [];
    for (const arg of args) {
        if (arg['type'] !== 'device') {
            let argInfo: any = {};

            argInfo['name'] = arg['name'];
            if (arg['title']['en']) {
                argInfo['title'] = arg['title']['en'];
            }
            if (arg['hint'] && arg['hint']['en']) {
                argInfo['hint'] = arg['hint']['en'];
            }

            argInfo['type'] = arg['type'];

            let description = '';
            if (arg['type'] == 'dropdown' && arg['values']) {
                const values = arg['values'];

                values.forEach((value: any) => {
                    description = description.concat(value['title']['en'], '<br/>');
                });
            }

            argInfo['description'] = description;

            argsInfo.push(argInfo);
        }
    }

    result['args'] = argsInfo;

    return result;
};

capabilitiesOptions['measure_power'] = 'Power';
capabilitiesOptions['meter_power'] = 'Energy';

const allFlowTypes = getSupportedFlowTypeKeys();

const brands = DeviceRepository.getInstance().getBrands();

const optionsToRange = (options: ModbusRegisterOptions) => {
    if (options.validValueMin !== undefined && options.validValueMax !== undefined) {
        return `${options.validValueMin} - ${options.validValueMax}`;
    }

    if (options.validValueMin !== undefined) {
        return `>= ${options.validValueMin}`;
    }

    if (options.validValueMax !== undefined) {
        return `<= ${options.validValueMax}`;
    }

    return '-';
};

const printRegisters = (title: string, registers: ModbusRegister[]): string => {
    var output = '';

    output += `### ${title}\n`;
    output += '| Address | Length | Data Type | Unit | Scale | Tranformation | Capability ID | Capability name | Range | DeviceTypes |\n';
    output += '| ------- | ------ | --------- | ---- | ----- | ------------- | ------------- | --------------- | ----- | ----------- |\n';

    registers.forEach((register) => {
        register.parseConfigurations.forEach((config) => {
            const unit = unitForCapability(config.capabilityId);
            output += `| ${register.address}`;
            output += `| ${register.length}`;
            output += `| ${register.dataType.toString()}`;
            output += `| ${unit}`;
            output += `| ${config.scale ?? '-'}`;
            output += `| ${config.transformation ? 'Yes' : 'No'}`;
            output += `| ${config.capabilityId}`;
            output += `| ${capabilitiesOptions[config.capabilityId]}`;
            output += `| ${optionsToRange(config.options)}`;
            output += `| ${devicesTypesToString(register.deviceTypes)} |\n`
        });
    });

    return output;
}

brands.forEach((brand) => {
    const models = DeviceRepository.getInstance().getDevicesByBrand(brand);

    models.forEach((model) => {
        let output = '';

        const filename = `repositories/device-repository/devices/${brand.toLocaleLowerCase()}/${model.id}/README.md`;

        output += `## ${model.name}\n`;
        output += `${model.description}\n\n`;

        output += printRegisters('Input Registers Inverter', model.getInputRegisters(DeviceType.SOLAR));
        output += printRegisters('Input Registers Battery', model.getInputRegisters(DeviceType.BATTERY));
        output += printRegisters('Holding Registers Inverter', model.getHoldingRegisters(DeviceType.SOLAR));
        output += printRegisters('Holding Registers Battery', model.getHoldingRegisters(DeviceType.BATTERY));

        if (model.supportedFlows && model.supportedFlows.actions) {
            output += '\n### Supported flow actions\n';

            allFlowTypes.forEach((flowType) => {
                if (model.supportedFlows && model.supportedFlows.actions) {
                    const flow = model.supportedFlows.actions[flowType];

                    if (flow) {
                        const flowInfo = readFlowInfo('actions', flowType);

                        output += `\n#### ${flowInfo.title}\n`;
                        output += `${flowInfo.titleFormatted}\n`;

                        if (flowInfo.args.length > 0) {
                            output += `| Name | Argument | Type |  Description |\n`;
                            output += `| ------------- | ----- | ------------- | --------------- |\n`;

                            for (const arg of flowInfo.args) {
                                output += `| ${arg.name} `;
                                output += `| ${arg.title} `;
                                output += `| ${arg.type} `;
                                output += `| ${arg.hint ?? '-'} |\n`;
                            }
                        }
                    }
                }
            });
        }

        output += '\n';

        fs.writeFileSync(filename, output);
    });
});
