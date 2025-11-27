// src/domain/categorization.ts
import { CategoryPath, type Note } from "./note";

export type CategorizationAction =
    | { type: "KEEP"; category?: CategoryPath }
    | { type: "MOVE"; from?: CategoryPath; to: CategoryPath };

export interface CategorizationSuggestion {
    noteId: string;
    action: CategorizationAction;
}

/**
 * Simple helper to build a "MOVE" suggestion.
 */
export function moveToCategory(
    note: Note,
    newCategory: CategoryPath
): CategorizationSuggestion {
    return {
        noteId: note.id,
        action: {
            type: "MOVE",
            from: note.category,
            to: newCategory,
        },
    };
}

/**
 * Helper for "KEEP" suggestion.
 */
export function keepCategory(note: Note): CategorizationSuggestion {
    return {
        noteId: note.id,
        action: {
            type: "KEEP",
            category: note.category,
        },
    };
}
