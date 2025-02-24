import { getBrand, getDeviceModelName } from '../helpers/brand-name';
import { Brand } from '../models/enum/brand';

describe('brand-name', () => {
    test('get-brand with existing name', async () => {
        const growatt = getBrand('growatt');
        expect(growatt).toBe(Brand.Growatt);
    });

    test('get-brand with non existing name', async () => {
        const response = getBrand('some-non-existing-name');
        expect(response).toBeUndefined();
    });

    test('get-device-model-name with existing model', async () => {
        const model = getDeviceModelName(Brand.Deye, 'sun-xk-sg01hp3-eu-am2', false);
        expect(model).toBe('Deye Sun *K SG01HP3 EU AM2 Series');
    });

    test('get-device-model-name with non existing model', async () => {
        const blauhoff = getDeviceModelName(Brand.Deye, 'non existing model', false);
        expect(blauhoff).toBe('Unknown Deye device');

        const kstar = getDeviceModelName(Brand.Afore, 'non existing model', false);
        expect(kstar).toBe('Unknown Afore device');
    });
});
