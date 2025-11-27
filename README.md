# Curator Agent

An AI-powered knowledge base note categorization agent that automatically organizes Markdown notes into categories using LLM-based analysis.

## Overview

Curator Agent is a CLI tool that uses AI (via the Vercel AI SDK) to intelligently categorize and organize Markdown notes within a personal knowledge base. It analyzes note content and metadata, suggests appropriate categories based on existing folder structure, and can automatically move notes to their optimal locations.

## Architecture

The project follows a clean **hexagonal architecture** (ports & adapters pattern):

```
src/
├── agent/           # AI agent logic (LLM-powered categorization)
│   └── categorizeNoteAgent.ts
├── cli/             # Command-line interface entry point
│   └── index.ts
├── domain/          # Core domain models
│   ├── note.ts      # Note and CategoryPath value objects
│   └── categorization.ts  # Categorization actions and suggestions
├── ports/           # Abstract interfaces (ports)
│   └── WorkspacePort.ts   # Workspace operations interface
└── adapters/        # Concrete implementations (adapters)
    └── fs/
        └── FsWorkspace.ts  # Filesystem-based workspace implementation
```

### Key Components

- **Agent**: Uses `generateText()` from Vercel AI SDK with tool-calling capabilities to load notes, list categories, and apply category changes
- **Domain**: Contains `Note` and `CategoryPath` value objects that represent the core business concepts
- **Ports**: Defines the `WorkspacePort` interface for workspace operations
- **Adapters**: `FsWorkspace` implements the workspace interface using the filesystem, handling Markdown parsing with YAML frontmatter support

## Technologies & Dependencies

- **Runtime**: [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime
- **Language**: TypeScript with ESNext features
- **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai/) (`ai` + `@ai-sdk/openai` packages) - For LLM integration
- **Validation**: [Zod](https://zod.dev/) - Runtime type validation for tool schemas

## Prerequisites

- [Bun](https://bun.sh) v1.3.0 or later
- An OpenAI API key (for the AI model)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd curator-agent

# Install dependencies
bun install
```

## Configuration

### Environment Variables

Create a `.env` file in the project root (Bun automatically loads `.env` files):

```env
# Required: OpenAI API key for the AI model
OPENAI_API_KEY=sk-your-api-key-here

# Optional: AI model to use (defaults to gpt-4o)
AI_MODEL=gpt-4o

# Optional: Custom workspace root for notes (defaults to ./notes)
NOTE_WORKSPACE_ROOT=/path/to/your/notes
```

### Workspace Setup

The agent operates on a **workspace** - a directory containing your Markdown notes organized in folders. By default, it looks for a `notes/` directory in the current working directory.

Notes should be Markdown files (`.md`) and can optionally include YAML frontmatter:

```markdown
---
category: AI/Agents
---

# My Note Title

Note content here...
```

## CLI Usage

### Categorize a Note

```bash
bun src/cli/index.ts <relative-path-to-note>
```

**Examples:**

```bash
# Categorize a note from the inbox
bun src/cli/index.ts inbox/idea.md

# Categorize a note at the workspace root
bun src/cli/index.ts random-thought.md

# Using npm scripts (alternative)
bun run dev inbox/idea.md
```

### What the Agent Does

1. **Loads** the specified note and reads its content
2. **Lists** existing categories (folders) in the workspace
3. **Analyzes** the note content using an LLM
4. **Decides** the best category based on content and existing structure
5. **Moves** the note to the appropriate folder (if needed)
6. **Updates** the frontmatter with the new category

### Example Output

```
Categorizing note: inbox/idea.md

=== Agent summary ===
I analyzed the note "AI Tool Ideas" and moved it from inbox/ to AI/Ideas/
as it contains ideas related to artificial intelligence tools and workflows.
```

## Development

```bash
# Run the CLI in development mode
bun run dev <path-to-note>

# Type checking
bun run build

# Run tests (when available)
bun test
```

## Project Structure Notes

- The agent uses **tool-calling** with up to 8 steps to interact with the workspace
- Categories are derived from folder paths (e.g., `AI/Agents` corresponds to the `AI/Agents/` folder)
- The `FsWorkspace` adapter handles YAML frontmatter parsing and file operations
- Notes are identified by their workspace-relative paths

## License

Private project - all rights reserved.
