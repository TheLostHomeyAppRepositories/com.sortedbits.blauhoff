import { Logger } from "./log";

export class CommandQueue {
    private queue: Array<string> = [];
    private busy: boolean = false;

    constructor(private log: Logger) {
    }

    setBusy = (value: boolean) => {
        this.busy = value;
    }

    wait = async (command: string, maxOccurences: number): Promise<boolean> => {
        const commandsInQueue = this.queue.filter(t => t === command).length;

        this.log.dlog(`Found ${command} ${commandsInQueue} times in the queue`)

        if (commandsInQueue >= maxOccurences) {
            this.log.derror(`Too many of command ${command} in queue (${commandsInQueue} vs ${maxOccurences})`);
            return false;
        }

        this.queue.push(command);

        while (this.busy) {
            this.log.dlog(`Waiting in queue for ${command}`);
            await this.delay(500);
        }

        const index = this.queue.indexOf(command);
        if (index > -1) {
            delete this.queue[index];
        }

        this.busy = true;

        return true;
    }

    private delay = async (timeout: number): Promise<void> => {
        return new Promise(resolve => {
            setTimeout(resolve, timeout);
        });
    }
}