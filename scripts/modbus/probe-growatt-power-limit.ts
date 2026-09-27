/*
 * Created on Sat Sep 27 2026
 *
 * Read-only probe: reads a handful of Growatt holding registers around
 * the commonly documented "Active Power Rate" (address 3) and export
 * limit block (121-124) that this app's growatt-tl/growatt-tl3 models
 * don't currently implement. Never writes anything - just reads, to
 * confirm whether this specific inverter actually has them before adding
 * real support.
 *
 * Usage: HOST=... PORT=... UNIT_ID=... npx ts-node scripts/modbus/probe-growatt-power-limit.ts
 */

import ModbusRTU from 'modbus-serial';

require('dotenv').config();

const host = process.env.HOST;
const port = Number(process.env.PORT ?? '502');
const unitId = Number(process.env.UNIT_ID ?? '1');

if (!host) {
    console.error('Missing HOST env var (and optionally PORT, UNIT_ID).');
    process.exit(1);
}

// address, length, label - a handful of registers worth checking, based
// on Growatt's publicly documented Modbus RTU protocol for MIN/MIC/MOD
// string inverters. This app's own growatt-tl(3) models only implement
// address 23 (serial) as holding today.
const candidates: { address: number; length: number; label: string }[] = [
    { address: 0, length: 4, label: 'On/off + Active P Rate + Reactive P Rate + Power factor (0-3)' },
    { address: 3, length: 1, label: 'Active P Rate (%) - the one we actually want' },
    { address: 22, length: 2, label: 'Around the serial number block (22-24)' },
    { address: 121, length: 4, label: 'Export limit enable + export limit power rate (121-124, newer firmware)' },
];

async function main(): Promise<void> {
    const client = new ModbusRTU();
    console.log(`Connecting to ${host}:${String(port)} (unit ${String(unitId)})...`);
    await client.connectTCP(host as string, { port });
    client.setID(unitId);
    client.setTimeout(5000);

    for (const { address, length, label } of candidates) {
        try {
            const result = await client.readHoldingRegisters(address, length);
            console.log(`Holding[${address}..${address + length - 1}] (${label}):`, result.data, result.buffer);
        } catch (error) {
            console.log(`Holding[${address}..${address + length - 1}] (${label}): read failed -`, (error as Error).message);
        }
    }

    client.close(() => {
        console.log('Done.');
    });
}

main().catch((error) => {
    console.error('Probe failed:', error);
    process.exit(1);
});
