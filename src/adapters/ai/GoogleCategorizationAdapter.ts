// src/adapters/ai/GoogleCategorizationAdapter.ts
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type {
    CategorizationPort,
    CategorizationContext,
    CategorizationDecision,
} from "../../ports/CategorizationPort.js";
import { CategoryPath } from "../../domain/note.js";

/**
 * Configuration options for the Google categorization adapter.
 */
export interface GoogleCategorizationConfig {
    /** The Google model to use (e.g., "gemini-1.5-flash", "gemini-1.5-pro") */
    model: string;
}

/**
 * Schema for the structured output from the AI model.
 */
const categorizationResponseSchema = z.object({
    category: z.string().describe("The suggested category path, like 'AI/Agents' or 'Product/Ideas'"),
    reasoning: z.string().describe("Brief explanation of why this category was chosen"),
    confidence: z.number().min(0).max(1).describe("Confidence level from 0 to 1"),
});

/**
 * Google-based implementation of the CategorizationPort.
 * 
 * Uses structured output (generateObject) to get reliable categorization
 * decisions from Google's Gemini models.
 */
export class GoogleCategorizationAdapter implements CategorizationPort {
    private readonly model: string;

    constructor(config: GoogleCategorizationConfig) {
        this.model = config.model;
    }

    async suggestCategory(context: CategorizationContext): Promise<CategorizationDecision> {
        const { note, availableCategories } = context;

        const prompt = this.buildPrompt(note, availableCategories);

        const { object } = await generateObject({
            model: google(this.model),
            schema: categorizationResponseSchema,
            prompt,
        });

        return {
            suggestedCategory: CategoryPath.fromRaw(object.category),
            reasoning: object.reasoning,
            confidence: object.confidence,
        };
    }

    private buildPrompt(
        note: { title: string; content: string; category?: { toString(): string } },
        availableCategories: Array<{ toString(): string }>
    ): string {
        const categoryList = availableCategories.length > 0
            ? availableCategories.map((c) => `  - ${c.toString()}`).join("\n")
            : "  (no existing categories)";

        const currentCategory = note.category?.toString() ?? "(uncategorized)";

        return [
            "You are an AI note categorization assistant for a personal knowledge base.",
            "",
            "## Task",
            "Analyze the following note and suggest the best category for it.",
            "",
            "## Rules",
            "- Prefer existing categories when they fit well.",
            "- Only suggest a new category if no existing one is appropriate.",
            "- Use hierarchical paths like 'AI/Agents' or 'Product/Ideas'.",
            "- Keep category names concise and descriptive.",
            "",
            "## Note Details",
            `**Title:** ${note.title}`,
            `**Current Category:** ${currentCategory}`,
            "",
            "**Content:**",
            note.content,
            "",
            "## Available Categories",
            categoryList,
        ].join("\n");
    }
}

