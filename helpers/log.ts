/*
 * Created on Wed Mar 20 2024
 * Copyright © 2024 Wim Haanstra
 *
 * Non-commercial use only
 */

export interface IBaseLogger {
    /**
     * Log a message to the console (stdout)
     * @param {...*} args
     */
    log(...args: any[]): void;
    /**
     * Log a message to the console (stderr)
     * @param {...*} args
     */
    error(...args: any[]): void;

    dlog(...args: any[]): void;
    derror(...args: any[]): void;
}

export class Logger implements IBaseLogger {
    log(...args: any[]): void {
        // eslint-disable-next-line no-console
        console.log(...args);
    }

    dlog(...args: any[]): void {
        // eslint-disable-next-line no-console
        console.log(...args);
    }

    derror(...args: any[]): void {
        // eslint-disable-next-line no-console
        console.log(...args);
    }

    error(...args: any[]): void {
        // eslint-disable-next-line no-console
        console.error(...args);
    }
}
