#!/usr/bin/env bun
import { createContainer } from "../infrastructure/container.js";

async function main() {
    const [, , argPath] = process.argv;

    if (!argPath) {
        console.error(
            "Usage: curator-agent <relative-path-to-note.md>\n" +
            "Example: curator-agent inbox/idea.md"
        );
        process.exit(1);
    }

    // Normalize to a workspace-relative POSIX-style path
    const relPath = argPath.replace(/^\.?[\/\\]*/, "").replace(/\\/g, "/");

    // Create DI container and get the use case
    const container = createContainer();
    const categorizeNote = container.categorizeNoteUseCase;

    // Execute the use case
    const result = await categorizeNote.execute({ relativePath: relPath });

    // Output summary
    console.log("\n=== Categorization Result ===");
    console.log(`Note: "${result.originalNote.title}"`);
    if (result.wasMoved) {
        const from = result.originalNote.category?.toString() ?? "(root)";
        const to = result.updatedNote.category?.toString() ?? "(root)";
        console.log(`Moved: ${from} → ${to}`);
    } else {
        console.log(`Status: Already in optimal category`);
    }
    console.log(`Reasoning: ${result.reasoning}`);
}

main().catch((err) => {
    console.error("Error running agent:", err);
    process.exit(1);
});
