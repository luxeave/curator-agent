// src/agent/categorizeNoteAgent.ts
import { generateText, stepCountIs, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import path from "node:path";
import { FsWorkspace } from "../adapters/fs/FsWorkspace.js";
import { CategoryPath } from "../domain/note.js";

// Workspace root – adjust or load from env
const WORKSPACE_ROOT =
  process.env.NOTE_WORKSPACE_ROOT ?? path.resolve(process.cwd(), "notes");

// Default model - can be overridden via environment variable
const AI_MODEL = process.env.AI_MODEL ?? "gpt-4o";

const workspace = new FsWorkspace(WORKSPACE_ROOT);

export interface CategorizeNoteInput {
  relativePath: string; // workspace-relative path like "inbox/idea.md"
}

/**
 * Run the agent loop for a single note, using tools to:
 * - load the note
 * - list existing categories
 * - decide whether to move it
 * - apply the move
 */
export async function categorizeNoteAgent(
  input: CategorizeNoteInput
): Promise<void> {
  const { relativePath } = input;

  const { text } = await generateText({
    model: openai(AI_MODEL),
    // You can tune this prompt to your personal taxonomy style.
    prompt: [
      "You are an AI note categorization assistant.",
      "",
      "You are working inside a personal knowledge base using Markdown files.",
      "Categories are represented as folder paths like 'AI/Agents' or 'Product/Ideas'.",
      "",
      `Your task is to decide the best category for a single note.`,
      `You have access to tools to load the note, list existing categories, and apply a category change.`,
      "",
      "Rules:",
      "- Prefer existing categories when possible.",
      "- Only create a new category if no existing one fits reasonably well.",
      "- When you move a note, use a clear, concise category path.",
      "",
      `The target note is at workspace-relative path: "${relativePath}".`,
      "Use the tools to inspect it and then apply any category change you think is appropriate.",
      "When you are done, reply with a short summary of what you did.",
    ].join("\n"),
    stopWhen: stepCountIs(8), // allow up to 8 tool-using steps
    tools: {
      load_note: tool({
        description:
          "Load a Markdown note by its workspace-relative path and return its content and current category.",
        inputSchema: z.object({
          path: z
            .string()
            .describe(
              "The workspace-relative path of the note, like 'inbox/idea.md'."
            ),
        }),
        execute: async ({ path }) => {
          const note = await workspace.loadNote(path);
          return {
            id: note.id,
            path: note.path,
            title: note.title,
            content: note.content,
            category: note.category ? note.category.toString() : null,
          };
        },
      }),

      list_categories: tool({
        description:
          "List all existing categories (folders) in the workspace so you can choose the best fit.",
        inputSchema: z.object({}),
        execute: async () => {
          const categories = await workspace.listCategories();
          return {
            categories: categories.map((c) => c.toString()),
          };
        },
      }),

      apply_category_change: tool({
        description:
          "Apply a category change to a note by moving its file to the new category folder and updating its category metadata.",
        inputSchema: z.object({
          path: z
            .string()
            .describe("Workspace-relative path of the note to change."),
          newCategory: z
            .string()
            .describe(
              "The new category path for the note, like 'AI/Agents' or 'Product/Ideas'."
            ),
        }),
        execute: async ({ path, newCategory }) => {
          const categoryPath = CategoryPath.fromRaw(newCategory);
          const updated = await workspace.applyCategoryChange(path, categoryPath);
          return {
            id: updated.id,
            path: updated.path,
            title: updated.title,
            category: updated.category ? updated.category.toString() : null,
          };
        },
      }),
    },
  });

  // Final summary from the model (e.g. "Moved note X from /Misc to /AI/Agents").
  // For a CLI demo, just print it.
  console.log("\n=== Agent summary ===");
  console.log(text);
}
