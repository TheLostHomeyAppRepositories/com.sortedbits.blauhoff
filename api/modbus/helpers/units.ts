/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

/**
 * Returns the unit symbol for a given capability.
 * @param capabilityId - The capability ID.
 * @returns The unit symbol corresponding to the capability.
 */
export const unitForCapability = (capabilityId: string): string => {
    const parts = capabilityId.split('.');
    if (parts.length < 2) {
        return '';
    }

    const capability = parts[0];

    switch (capability) {
        case 'measure_voltage':
            return 'V';
        case 'measure_current':
            return 'A';
        case 'measure_power':
            return 'W';
        case 'measure_percentage':
            return '%';
        case 'measure_temperature':
            return '°C';
        case 'meter_power':
            return 'kWh';

        default: return '';
    }
};
