# Curator Agent

An AI-powered knowledge base note categorization agent that automatically organizes Markdown notes into categories using LLM-based analysis.

## Overview

Curator Agent is a CLI tool that uses AI (via the Vercel AI SDK) to intelligently categorize and organize Markdown notes within a personal knowledge base. It analyzes note content and metadata, suggests appropriate categories based on existing folder structure, and can automatically move notes to their optimal locations.

## Architecture

The project follows a clean **hexagonal architecture** (ports & adapters pattern) with proper separation of concerns:

```
src/
├── application/          # Use cases / Application services
│   └── CategorizeNoteUseCase.ts
├── domain/               # Core domain models (no dependencies)
│   ├── note.ts           # Note and CategoryPath value objects
│   └── categorization.ts # Categorization actions and suggestions
├── ports/                # Abstract interfaces (driven & driving ports)
│   ├── WorkspacePort.ts      # Workspace operations interface
│   ├── CategorizationPort.ts # AI categorization interface
│   └── LoggerPort.ts         # Logging abstraction
├── adapters/             # Concrete implementations
│   ├── ai/
│   │   └── OpenAICategorizationAdapter.ts  # OpenAI-based categorization
│   ├── fs/
│   │   └── FsWorkspace.ts                  # Filesystem workspace
│   └── logging/
│       └── ConsoleLogger.ts                # Console logging
├── infrastructure/       # Configuration and DI
│   ├── config.ts         # Environment configuration
│   └── container.ts      # Dependency injection container
└── cli/                  # Entry point
    └── index.ts
```

### Architectural Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI / Entry Point                        │
│                     (src/cli/index.ts)                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                         │
│         (Container, Config - src/infrastructure/)               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                            │
│          (Use Cases - src/application/)                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  CategorizeNoteUseCase                                   │   │
│  │  - Orchestrates the categorization workflow              │   │
│  │  - Depends only on ports (interfaces)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│   WorkspacePort   │ │ CategorizationPort│ │    LoggerPort     │
│   (interface)     │ │   (interface)     │ │   (interface)     │
└───────────────────┘ └───────────────────┘ └───────────────────┘
            │                   │                   │
            ▼                   ▼                   ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│   FsWorkspace     │ │ OpenAICategoriz-  │ │  ConsoleLogger    │
│   (adapter)       │ │ ationAdapter      │ │   (adapter)       │
└───────────────────┘ └───────────────────┘ └───────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Domain Layer                              │
│                    (src/domain/)                                │
│                                                                 │
│  Note, CategoryPath, CategorizationAction, etc.                 │
│  Pure business logic with no external dependencies              │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

- **Domain Layer**: Pure business logic with `Note`, `CategoryPath`, and `CategorizationAction` value objects. No external dependencies.

- **Ports**: Define abstract interfaces that the application layer depends on:
  - `WorkspacePort` - Load notes, list categories, apply changes
  - `CategorizationPort` - AI-powered category suggestions
  - `LoggerPort` - Logging abstraction

- **Adapters**: Implement the ports with concrete technologies:
  - `FsWorkspace` - Filesystem-based workspace with YAML frontmatter support
  - `OpenAICategorizationAdapter` - Uses Vercel AI SDK with OpenAI models
  - `ConsoleLogger` - Console-based logging

- **Application Layer**: Contains `CategorizeNoteUseCase` which orchestrates the workflow, depending only on ports.

- **Infrastructure**: `Container` wires ports to adapters via dependency injection, making it easy to swap implementations for testing.

### Dependency Injection

The `Container` class in `src/infrastructure/container.ts` handles all wiring:

```typescript
const container = createContainer();
const useCase = container.categorizeNoteUseCase;
await useCase.execute({ relativePath: "inbox/idea.md" });
```

For testing, you can inject mock adapters:

```typescript
const container = Container.withAdapters({
    workspace: mockWorkspace,
    categorizer: mockCategorizer,
    logger: mockLogger,
});
```

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
[curator] Loading note: inbox/idea.md
[curator] Analyzing note content...
[curator] Moving note from "inbox" to "AI/Ideas"
[curator] Successfully categorized note to: AI/Ideas

=== Categorization Result ===
Note: "AI Tool Ideas"
Moved: inbox → AI/Ideas
Reasoning: The note discusses AI-related productivity tools and automation ideas,
           making it a good fit for the AI/Ideas category.
```

## Development

```bash
# Run the CLI in development mode
bun run dev <path-to-note>

# Enable debug logging
DEBUG=true bun src/cli/index.ts inbox/test-idea.md

# Type checking
bun run build

# Run tests (when available)
bun test
```

## Project Structure Notes

- **Hexagonal Architecture**: Clean separation between domain, application, ports, and adapters
- **Dependency Injection**: The `Container` class wires all dependencies, making testing easy
- **Structured AI Output**: Uses `generateObject()` for reliable, typed AI responses
- Categories are derived from folder paths (e.g., `AI/Agents` corresponds to the `AI/Agents/` folder)
- The `FsWorkspace` adapter handles YAML frontmatter parsing and file operations
- Notes are identified by their workspace-relative paths

## License

Private project - all rights reserved.
