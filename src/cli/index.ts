#!/usr/bin/env bun
import { categorizeNoteAgent } from "../agent/categorizeNoteAgent";

async function main() {
    const [, , argPath] = process.argv;

    if (!argPath) {
        console.error(
            "Usage: kb-curator categorize <relative-path-to-note.md>\n" +
            "Example: kb-curator categorize inbox/idea.md"
        );
        process.exit(1);
    }

    // Normalize to a workspace-relative POSIX-style path
    const relPath = argPath.replace(/^\.?[\/\\]*/, "").replace(/\\/g, "/");

    console.log(`Categorizing note: ${relPath}`);
    await categorizeNoteAgent({ relativePath: relPath });
}

main().catch((err) => {
    console.error("Error running agent:", err);
    process.exit(1);
});
