import fetch from 'node-fetch';

import { API } from '../blauhoff';
import { Logger } from '../log';
import { BlauHoffDevice } from '../blauhoff-device';

jest.mock('node-fetch');
const { Response } = jest.requireActual('node-fetch');

const successObject = {
    msg: 'OK',
    code: 200,
    t: 1684756685989,
    data: {
        pvRatePower: 6118, // W
        gridRatePower: 4600, // W
        batteryRatePower: 51725, // W
        batteryCapacity: 10, // kWh
    },
};

const failObject = {
    msg: 'ERROR',
    code: 401,
    t: 1684756685989,
};

describe('get-rate-power', () => {
    test('Succesfully get rate powers', async () => {
        const api = new API(new Logger());
        api.userToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9';

        expect(fetch).toHaveBeenCalledTimes(0);

        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
            new Response(JSON.stringify(successObject)),
        );

        const testDevice: BlauHoffDevice = {
            id: '1',
            serial: 'SHA602131202215005',
            model: 'SPHA6.0H-10.24kW',
        };

        const response = await api.getRatePower(testDevice);

        const expectedHeaders = {
            Accept: '*/*',
            Authorization: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9',
            'Content-Type': 'application/json',
        };

        expect(fetch).toHaveBeenCalledWith(
            `https://api-vpp-au.weiheng-tech.com/api/vpp/v1/hub/device/info?deviceSn=${testDevice.serial}`,
            { body: '{}', headers: expectedHeaders, method: 'get' },
        );

        expect(response).toStrictEqual(successObject.data);
    });

    test('failed get rate powers', async () => {
        const api = new API(new Logger());
        api.userToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9';

        expect(fetch).toHaveBeenCalledTimes(0);

        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
            new Response(JSON.stringify(failObject)),
        );

        const testDevice: BlauHoffDevice = {
            id: '1',
            serial: 'SHA602131202215005',
            model: 'SPHA6.0H-10.24kW',
        };

        const response = await api.getRatePower(testDevice);

        const expectedHeaders = {
            Accept: '*/*',
            Authorization: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9',
            'Content-Type': 'application/json',
        };

        expect(fetch).toHaveBeenCalledWith(
            `https://api-vpp-au.weiheng-tech.com/api/vpp/v1/hub/device/info?deviceSn=${testDevice.serial}`,
            { body: '{}', headers: expectedHeaders, method: 'get' },
        );

        expect(response).toStrictEqual(undefined);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
});
