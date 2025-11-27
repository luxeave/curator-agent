// src/ports/WorkspacePort.ts
import { CategoryPath, type Note } from "../domain/note.js";

export interface WorkspacePort {
    /**
     * Load a note (Markdown) by workspace-relative path.
     */
    loadNote(relativePath: string): Promise<Note>;

    /**
     * List existing categories in the workspace (e.g., from folder structure).
     */
    listCategories(): Promise<CategoryPath[]>;

    /**
     * Apply a category change by updating frontmatter and moving the file
     * into the appropriate folder.
     *
     * Returns the updated Note aggregate.
     */
    applyCategoryChange(
        notePath: string,
        newCategory: CategoryPath
    ): Promise<Note>;
}
