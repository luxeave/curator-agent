// src/infrastructure/container.ts
import type { WorkspacePort } from "../ports/WorkspacePort.js";
import type { CategorizationPort } from "../ports/CategorizationPort.js";
import type { LoggerPort } from "../ports/LoggerPort.js";
import { FsWorkspace } from "../adapters/fs/FsWorkspace.js";
import { OpenAICategorizationAdapter } from "../adapters/ai/OpenAICategorizationAdapter.js";
import { ConsoleLogger } from "../adapters/logging/ConsoleLogger.js";
import { CategorizeNoteUseCase } from "../application/CategorizeNoteUseCase.js";
import { loadConfig, type AppConfig } from "./config.js";

/**
 * Dependency Injection Container.
 * 
 * This container wires together all the ports and adapters,
 * creating instances with proper dependency injection.
 * 
 * The container is responsible for:
 * - Loading configuration
 * - Creating adapter instances
 * - Wiring adapters to use cases
 * - Providing access to use cases
 * 
 * This allows easy swapping of implementations for testing
 * or alternative deployments.
 */
export class Container {
    private readonly config: AppConfig;

    // Adapters (cached instances)
    private _workspace?: WorkspacePort;
    private _categorizer?: CategorizationPort;
    private _logger?: LoggerPort;

    // Use cases (cached instances)
    private _categorizeNoteUseCase?: CategorizeNoteUseCase;

    constructor(config?: AppConfig) {
        this.config = config ?? loadConfig();
    }

    // --- Port Accessors ---

    get workspace(): WorkspacePort {
        if (!this._workspace) {
            this._workspace = new FsWorkspace(this.config.workspaceRoot);
        }
        return this._workspace;
    }

    get categorizer(): CategorizationPort {
        if (!this._categorizer) {
            this._categorizer = new OpenAICategorizationAdapter({
                model: this.config.aiModel,
            });
        }
        return this._categorizer;
    }

    get logger(): LoggerPort {
        if (!this._logger) {
            this._logger = new ConsoleLogger();
        }
        return this._logger;
    }

    // --- Use Case Accessors ---

    get categorizeNoteUseCase(): CategorizeNoteUseCase {
        if (!this._categorizeNoteUseCase) {
            this._categorizeNoteUseCase = new CategorizeNoteUseCase(
                this.workspace,
                this.categorizer,
                this.logger
            );
        }
        return this._categorizeNoteUseCase;
    }

    // --- Factory Methods for Testing ---

    /**
     * Create a container with custom adapters (useful for testing).
     */
    static withAdapters(adapters: {
        workspace?: WorkspacePort;
        categorizer?: CategorizationPort;
        logger?: LoggerPort;
    }): Container {
        const container = new Container();
        if (adapters.workspace) container._workspace = adapters.workspace;
        if (adapters.categorizer) container._categorizer = adapters.categorizer;
        if (adapters.logger) container._logger = adapters.logger;
        return container;
    }
}

/**
 * Create and return the default application container.
 * 
 * This is the main entry point for dependency injection.
 */
export function createContainer(): Container {
    return new Container();
}

