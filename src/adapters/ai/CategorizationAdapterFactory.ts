// src/adapters/ai/CategorizationAdapterFactory.ts
import type { CategorizationPort } from "../../ports/CategorizationPort.js";
import type { LLMProvider } from "../../infrastructure/config.js";
import { OpenAICategorizationAdapter } from "./OpenAICategorizationAdapter.js";
import { GoogleCategorizationAdapter } from "./GoogleCategorizationAdapter.js";

/**
 * Configuration for creating a categorization adapter.
 */
export interface CategorizationAdapterConfig {
    /** The LLM provider to use */
    provider: LLMProvider;
    /** The model to use for the provider */
    model: string;
}

/**
 * Factory for creating categorization adapters based on the configured LLM provider.
 * 
 * This allows runtime selection of different AI providers (OpenAI, Google, etc.)
 * while maintaining a consistent interface through the CategorizationPort.
 */
export class CategorizationAdapterFactory {
    /**
     * Create a categorization adapter based on the provided configuration.
     * 
     * @param config - The adapter configuration including provider and model
     * @returns A CategorizationPort implementation for the specified provider
     * @throws Error if the provider is not supported
     */
    static create(config: CategorizationAdapterConfig): CategorizationPort {
        switch (config.provider) {
            case "openai":
                return new OpenAICategorizationAdapter({
                    model: config.model,
                });
            case "google":
                return new GoogleCategorizationAdapter({
                    model: config.model,
                });
            default:
                // TypeScript exhaustiveness check - should never reach here
                const exhaustiveCheck: never = config.provider;
                throw new Error(`Unsupported LLM provider: ${exhaustiveCheck}`);
        }
    }
}

