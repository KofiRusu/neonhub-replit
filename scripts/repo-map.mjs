#!/usr/bin/env node
/**
 * Offline repository map generator.
 * Prints a summary to stdout and writes the same content to docs/REPO_MAP.md.
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUTPUT_PATH = path.join(ROOT, "docs", "REPO_MAP.md");

const sections = [
  { name: "apps", dir: path.join(ROOT, "apps") },
  { name: "packages", dir: path.join(ROOT, "packages") },
  { name: "scripts", dir: path.join(ROOT, "scripts") },
];

const timestamp = new Date().toISOString();

function isDescriptive(line) {
  if (!line) return false;
  const alphanumeric = line.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  if (alphanumeric.length < 4) return false;
  return /[a-zA-Z]/.test(alphanumeric);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function firstMeaningfulLine(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;
      if (line.startsWith("#!") && rawLine.startsWith("#!")) {
        continue;
      }
      if (/^[-=*_#]{6,}$/.test(line)) {
        continue;
      }
      if (/^set -[a-zA-Z ]+$/.test(line)) {
        continue;
      }
      if (line.startsWith("//") || line.startsWith("#")) {
        const cleaned = line
          .replace(/^\/\/\s?/, "")
          .replace(/^#\s?/, "")
          .trim();
        if (isDescriptive(cleaned)) {
          return cleaned;
        }
        continue;
      }
      if (line.startsWith("/*")) {
        const cleaned = line.replace(/^\/\*+/, "").replace(/\*\/$/, "").trim();
        if (isDescriptive(cleaned)) {
          return cleaned;
        }
        continue;
      }
      if (line.startsWith("*")) {
        const cleaned = line.replace(/^\*\s*/, "").trim();
        if (isDescriptive(cleaned)) {
          return cleaned;
        }
        continue;
      }
      if (/^[:$]/.test(line)) {
        continue;
      }
      if (!isDescriptive(line)) {
        continue;
      }
      return line.length > 120 ? `${line.slice(0, 117)}...` : line;
    }
  } catch {
    // ignore
  }
  return null;
}

function describeEntry(absPath, relPath) {
  const stats = fs.statSync(absPath);
  if (stats.isDirectory()) {
    const pkg = readJson(path.join(absPath, "package.json"));
    if (pkg?.description) {
      return pkg.description;
    }
    const readme = path.join(absPath, "README.md");
    if (fs.existsSync(readme)) {
      const line = firstMeaningfulLine(readme);
      if (line) {
        return line;
      }
    }
    return "Purpose pending documentation.";
  }

  if (stats.isFile()) {
    const line = firstMeaningfulLine(absPath);
    if (line && isDescriptive(line)) {
      return line;
    }
    return "Script file (documentation not provided).";
  }

  return "Unknown entry type.";
}

function buildSection(section) {
  if (!fs.existsSync(section.dir)) {
    return `## ${section.name}\n- _Directory missing_\n`;
  }

  const entries = fs
    .readdirSync(section.dir, { withFileTypes: true })
    .filter((entry) => {
      if (section.name === "scripts") {
        return entry.isFile() || entry.isDirectory();
      }
      return entry.isDirectory();
    })
    .map((entry) => {
      const relPath = path.posix.join(section.name, entry.name);
      const absPath = path.join(section.dir, entry.name);
      const description = describeEntry(absPath, relPath);
      return { relPath, description };
    })
    .sort((a, b) => a.relPath.localeCompare(b.relPath));

  if (!entries.length) {
    return `## ${section.name}\n- _No entries found_\n`;
  }

  const lines = entries.map(
    (entry) => `- \`${entry.relPath}\` – ${entry.description}`
  );
  return `## ${section.name}\n${lines.join("\n")}\n`;
}

const header = `# NeonHub Repository Map\n\nGenerated: ${timestamp}\n`;
const body = sections.map(buildSection).join("\n");
const content = `${header}\n${body}`.trimEnd() + "\n";

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, content, "utf8");

console.log(content);
