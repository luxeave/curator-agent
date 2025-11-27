// src/infrastructure/fs/FsWorkspace.ts
import fs from "node:fs/promises";
import path from "node:path";
import type { WorkspacePort } from "../../ports/WorkspacePort.js";
import { CategoryPath, type Note } from "../../domain/note.js";

interface ParsedNoteFile {
  frontmatter: Record<string, string>;
  body: string;
}

/**
 * Very simple YAML-frontmatter-like parsing:
 * ---
 * key: value
 * ---
 * body...
 *
 * Only handles flat key: value pairs, enough for demo.
 */
function parseNoteFile(raw: string): ParsedNoteFile {
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    return { frontmatter: {}, body: raw };
  }

  let i = 1;
  const fm: Record<string, string> = {};
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (line.trim() === "---") {
      i++;
      break;
    }
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) fm[key] = value;
  }

  const body = lines.slice(i).join("\n");
  return { frontmatter: fm, body };
}

function serializeNoteFile(parsed: ParsedNoteFile): string {
  const entries = Object.entries(parsed.frontmatter);
  if (entries.length === 0) {
    return parsed.body;
  }
  const fmLines = entries.map(([k, v]) => `${k}: ${v}`);
  return ["---", ...fmLines, "---", "", parsed.body].join("\n");
}

/**
 * Derive a Note title from content or filename.
 */
function deriveTitle(relativePath: string, body: string): string {
  const lines = body.split(/\r?\n/);
  const h1 = lines.find((line) => line.trim().startsWith("# "));
  if (h1) {
    return h1.replace(/^#\s*/, "").trim() || path.basename(relativePath);
  }
  return path.basename(relativePath, path.extname(relativePath));
}

/**
 * Filesystem-backed implementation of WorkspacePort.
 */
export class FsWorkspace implements WorkspacePort {
  constructor(private readonly workspaceRoot: string) {}

  private resolveAbsolute(relativePath: string): string {
    const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
    return path.join(this.workspaceRoot, normalized);
  }

  private deriveCategoryFromPath(relativePath: string): CategoryPath | undefined {
    const dir = path.dirname(relativePath).replace(/\\/g, "/");
    if (dir === "." || dir === "") {
      return undefined;
    }
    return CategoryPath.fromRaw(dir);
  }

  async loadNote(relativePath: string): Promise<Note> {
    const absPath = this.resolveAbsolute(relativePath);
    const raw = await fs.readFile(absPath, "utf8");
    const parsed = parseNoteFile(raw);

    const categoryFromFm = parsed.frontmatter["category"];
    const category =
      categoryFromFm && categoryFromFm.trim() !== ""
        ? CategoryPath.fromRaw(categoryFromFm)
        : this.deriveCategoryFromPath(relativePath);

    const title = deriveTitle(relativePath, parsed.body);

    return {
      id: relativePath,
      path: relativePath,
      title,
      content: parsed.body,
      category,
    };
  }

  async listCategories(): Promise<CategoryPath[]> {
    const categories = new Set<string>();

    const walk = async (currentRel: string) => {
      const abs = this.resolveAbsolute(currentRel);
      const entries = await fs.readdir(abs, { withFileTypes: true });
      for (const entry of entries) {
        const entryRel = path
          .join(currentRel, entry.name)
          .replace(/\\/g, "/")
          .replace(/^\/+/, "");

        if (entry.isDirectory()) {
          categories.add(entryRel);
          await walk(entryRel);
        }
      }
    };

    await walk(".");
    const result: CategoryPath[] = [];
    for (const cat of categories) {
      if (cat === "." || cat === "") continue;
      result.push(CategoryPath.fromRaw(cat));
    }
    return result;
  }

  async applyCategoryChange(
    notePath: string,
    newCategory: CategoryPath
  ): Promise<Note> {
    const currentRel = notePath.replace(/\\/g, "/").replace(/^\/+/, "");
    const absOld = this.resolveAbsolute(currentRel);

    const raw = await fs.readFile(absOld, "utf8");
    const parsed = parseNoteFile(raw);

    // Update frontmatter category
    parsed.frontmatter["category"] = newCategory.toString();
    const newContent = serializeNoteFile(parsed);

    const fileName = path.basename(currentRel);
    const newRel = path
      .join(newCategory.toString(), fileName)
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");
    const absNew = this.resolveAbsolute(newRel);

    await fs.mkdir(path.dirname(absNew), { recursive: true });
    await fs.writeFile(absNew, newContent, "utf8");

    if (absNew !== absOld) {
      await fs.unlink(absOld);
    }

    const note = await this.loadNote(newRel);
    return note;
  }
}
