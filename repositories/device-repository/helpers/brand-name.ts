/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

import { DeviceRepository } from '../../device-repository/device-repository';
import { Brand } from '../models/enum/brand';

/**
 * Returns the corresponding Brand based on the provided brandName string.
 * @param brandName - The brand name string.
 * @returns The corresponding Brand enum value, or undefined if no match is found.
 */
export const getBrand = (brandName: string): Brand | undefined => {
    return (Object.values(Brand) as unknown as string[]).includes(brandName) ? (brandName as unknown as Brand) : undefined;
};

/**
 * Retrieves the device model name based on the brand name and model ID.
 * If the model is found, returns the model name.
 * If the model is not found, returns a string indicating an unknown device of the specified brand.
 * @param brandName - The brand name of the device.
 * @param modelId - The model ID of the device.
 * @returns The device model name or a string indicating an unknown device.
 */
export const getDeviceModelName = (brandName: Brand, modelId: string, battery: boolean): string => {
    const model = DeviceRepository.getInstance().getDeviceById(modelId);

    if (model) {
        if (battery) {
            return `${model.name} battery`;
        }
        return `${model.name} inverter`;
    }

    const output = brandName.charAt(0).toUpperCase() + brandName.slice(1);
    return `Unknown ${output} device`;
};

export const brandToBrandName = (brand: Brand): string => {
    switch (brand) {
        case Brand.Afore:
            return 'Afore';
        case Brand.Growatt:
            return 'Growatt';
        case Brand.Deye:
            return 'Deye';
        default:
            return 'Unknown';
    }
};
