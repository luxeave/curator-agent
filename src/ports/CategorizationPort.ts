// src/ports/CategorizationPort.ts
import type { CategoryPath, Note } from "../domain/note.js";

/**
 * Result of a categorization decision made by an AI service.
 */
export interface CategorizationDecision {
    /** The suggested category for the note */
    suggestedCategory: CategoryPath;
    /** Human-readable explanation of why this category was chosen */
    reasoning: string;
    /** Confidence level of the decision (0-1) */
    confidence?: number;
}

/**
 * Context provided to the categorization service to make a decision.
 */
export interface CategorizationContext {
    /** The note to categorize */
    note: Note;
    /** Available categories in the workspace */
    availableCategories: CategoryPath[];
}

/**
 * Port for AI-powered note categorization.
 * 
 * This interface abstracts the AI service used to analyze notes
 * and suggest appropriate categories. Implementations can use
 * different AI providers (OpenAI, Anthropic, local models, etc.)
 */
export interface CategorizationPort {
    /**
     * Analyze a note and suggest the best category for it.
     * 
     * @param context - The categorization context including the note and available categories
     * @returns A promise resolving to the categorization decision
     */
    suggestCategory(context: CategorizationContext): Promise<CategorizationDecision>;
}

