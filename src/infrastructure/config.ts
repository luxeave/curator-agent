// src/infrastructure/config.ts
import path from "node:path";

/**
 * Application configuration loaded from environment variables.
 * 
 * Bun automatically loads .env files, so these values can be
 * set via environment variables or a .env file.
 */
export interface AppConfig {
    /** Root directory for the notes workspace */
    workspaceRoot: string;
    /** AI model to use for categorization */
    aiModel: string;
    /** Whether debug logging is enabled */
    debug: boolean;
}

/**
 * Load configuration from environment variables with sensible defaults.
 */
export function loadConfig(): AppConfig {
    return {
        workspaceRoot:
            process.env.NOTE_WORKSPACE_ROOT ??
            path.resolve(process.cwd(), "notes"),
        aiModel: process.env.AI_MODEL ?? "gpt-4o",
        debug: process.env.DEBUG === "true" || process.env.DEBUG === "1",
    };
}

