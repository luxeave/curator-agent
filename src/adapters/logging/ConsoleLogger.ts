// src/adapters/logging/ConsoleLogger.ts
import type { LoggerPort } from "../../ports/LoggerPort.js";

/**
 * Console-based implementation of LoggerPort.
 */
export class ConsoleLogger implements LoggerPort {
    private readonly prefix: string;

    constructor(prefix: string = "[curator]") {
        this.prefix = prefix;
    }

    info(message: string): void {
        console.log(`${this.prefix} ${message}`);
    }

    warn(message: string): void {
        console.warn(`${this.prefix} ⚠️  ${message}`);
    }

    error(message: string, error?: unknown): void {
        console.error(`${this.prefix} ❌ ${message}`);
        if (error) {
            console.error(error);
        }
    }

    debug(message: string): void {
        if (process.env.DEBUG) {
            console.log(`${this.prefix} [debug] ${message}`);
        }
    }
}

