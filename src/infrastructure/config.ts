// src/infrastructure/config.ts
import path from "node:path";

/**
 * Supported LLM providers for categorization.
 */
export type LLMProvider = "openai" | "google";

/**
 * Application configuration loaded from environment variables.
 *
 * Bun automatically loads .env files, so these values can be
 * set via environment variables or a .env file.
 */
export interface AppConfig {
    /** Root directory for the notes workspace */
    workspaceRoot: string;
    /** LLM provider to use for categorization (openai or google) */
    llmProvider: LLMProvider;
    /** AI model to use for categorization */
    aiModel: string;
    /** Whether debug logging is enabled */
    debug: boolean;
}

/**
 * Default models for each LLM provider.
 */
const defaultModels: Record<LLMProvider, string> = {
    openai: "gpt-4o",
    google: "gemini-1.5-flash",
};

/**
 * Load configuration from environment variables with sensible defaults.
 */
export function loadConfig(): AppConfig {
    const llmProvider = parseLLMProvider(process.env.LLM_PROVIDER);
    return {
        workspaceRoot:
            process.env.NOTE_WORKSPACE_ROOT ??
            path.resolve(process.cwd(), "notes"),
        llmProvider,
        aiModel: process.env.AI_MODEL ?? defaultModels[llmProvider],
        debug: process.env.DEBUG === "true" || process.env.DEBUG === "1",
    };
}

/**
 * Parse and validate the LLM_PROVIDER environment variable.
 */
function parseLLMProvider(value: string | undefined): LLMProvider {
    if (!value) {
        return "openai"; // Default to OpenAI for backwards compatibility
    }
    const normalized = value.toLowerCase().trim();
    if (normalized === "openai" || normalized === "google") {
        return normalized;
    }
    console.warn(
        `Invalid LLM_PROVIDER "${value}". Supported values: "openai", "google". Defaulting to "openai".`
    );
    return "openai";
}

