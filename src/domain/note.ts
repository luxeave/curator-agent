// src/domain/note.ts
export type NoteId = string;

/**
 * Value object representing a category path like "AI/Agents".
 */
export class CategoryPath {
    private constructor(private readonly value: string) { }

    static fromRaw(raw: string): CategoryPath {
        const normalized = raw.trim().replace(/\\/g, "/").replace(/\/+/g, "/");
        const cleaned = normalized.replace(/^\/|\/$/g, "");
        if (!cleaned) {
            throw new Error("CategoryPath cannot be empty");
        }
        return new CategoryPath(cleaned);
    }

    static root(): CategoryPath {
        return new CategoryPath("");
    }

    toString(): string {
        return this.value;
    }

    isRoot(): boolean {
        return this.value === "";
    }
}

/**
 * Aggregate root representing a note in the knowledge base.
 */
export interface Note {
    id: NoteId;          // usually workspace-relative path
    title: string;
    content: string;
    category?: CategoryPath;
    path: string;        // workspace-relative file path
}
