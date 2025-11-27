// src/ports/LoggerPort.ts

/**
 * Port for logging operations.
 * 
 * Abstracts logging so use cases don't depend on console or any specific
 * logging implementation.
 */
export interface LoggerPort {
    info(message: string): void;
    warn(message: string): void;
    error(message: string, error?: unknown): void;
    debug(message: string): void;
}

