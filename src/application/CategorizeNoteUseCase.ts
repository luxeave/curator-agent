// src/application/CategorizeNoteUseCase.ts
import type { WorkspacePort } from "../ports/WorkspacePort.js";
import type { CategorizationPort } from "../ports/CategorizationPort.js";
import type { LoggerPort } from "../ports/LoggerPort.js";
import type { Note } from "../domain/note.js";

/**
 * Input DTO for the CategorizeNote use case.
 */
export interface CategorizeNoteInput {
    /** Workspace-relative path to the note (e.g., "inbox/idea.md") */
    relativePath: string;
}

/**
 * Output DTO for the CategorizeNote use case.
 */
export interface CategorizeNoteOutput {
    /** The original note before categorization */
    originalNote: Note;
    /** The updated note after categorization (may be same if unchanged) */
    updatedNote: Note;
    /** Whether the note was moved to a different category */
    wasMoved: boolean;
    /** Explanation of why the category was chosen */
    reasoning: string;
}

/**
 * Use case for categorizing a single note using AI.
 * 
 * This orchestrates the workflow:
 * 1. Load the note from the workspace
 * 2. Get available categories
 * 3. Ask AI for categorization suggestion
 * 4. Apply the category change if different
 * 
 * Following hexagonal architecture, this use case depends only on ports
 * (interfaces), not on concrete implementations.
 */
export class CategorizeNoteUseCase {
    constructor(
        private readonly workspace: WorkspacePort,
        private readonly categorizer: CategorizationPort,
        private readonly logger: LoggerPort
    ) {}

    async execute(input: CategorizeNoteInput): Promise<CategorizeNoteOutput> {
        const { relativePath } = input;

        this.logger.info(`Loading note: ${relativePath}`);

        // Step 1: Load the note
        const originalNote = await this.workspace.loadNote(relativePath);
        this.logger.debug(`Loaded note: "${originalNote.title}"`);

        // Step 2: Get available categories
        const availableCategories = await this.workspace.listCategories();
        this.logger.debug(`Found ${availableCategories.length} existing categories`);

        // Step 3: Get AI suggestion
        this.logger.info("Analyzing note content...");
        const decision = await this.categorizer.suggestCategory({
            note: originalNote,
            availableCategories,
        });

        const currentCategoryStr = originalNote.category?.toString() ?? "";
        const suggestedCategoryStr = decision.suggestedCategory.toString();

        // Step 4: Apply change if category is different
        if (currentCategoryStr === suggestedCategoryStr) {
            this.logger.info(`Note already in optimal category: ${suggestedCategoryStr}`);
            return {
                originalNote,
                updatedNote: originalNote,
                wasMoved: false,
                reasoning: decision.reasoning,
            };
        }

        this.logger.info(
            `Moving note from "${currentCategoryStr || "(root)"}" to "${suggestedCategoryStr}"`
        );

        const updatedNote = await this.workspace.applyCategoryChange(
            relativePath,
            decision.suggestedCategory
        );

        this.logger.info(`Successfully categorized note to: ${suggestedCategoryStr}`);

        return {
            originalNote,
            updatedNote,
            wasMoved: true,
            reasoning: decision.reasoning,
        };
    }
}

