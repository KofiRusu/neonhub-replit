# @neonhub/prompt-registry

Prompt registry with metadata, versioning, compilation, and snapshot testing.

## Features

- 📝 **Markdown & JSON** prompt templates
- 🏷️ **Metadata & Versioning** for tracking and governance
- 🔧 **Handlebars Compilation** with custom helpers
- 📸 **Snapshot Testing** for prompt regression detection
- 🔍 **Search & Discovery** by agent, tag, or description
- 🌐 **Multi-locale Support** for internationalization
- 📊 **Usage Statistics** and analytics

## Installation

```bash
pnpm add @neonhub/prompt-registry
```

## Usage

### Registry

```typescript
import { PromptRegistry } from '@neonhub/prompt-registry';

const registry = new PromptRegistry('./prompts');
await registry.loadAll();

// Get a prompt
const prompt = registry.get('content-blog-post', '1.0.0');
if (prompt) {
  console.log(prompt.metadata);
}

// Search prompts
const contentPrompts = registry.getByAgent('content');
const seoPrompts = registry.getByTag('seo');

// Statistics
const stats = registry.getStats();
console.log(stats); // { totalPrompts: 10, totalVersions: 15, agents: ['content', 'seo', 'email'] }
```

### Compiler

```typescript
import { PromptCompiler } from '@neonhub/prompt-registry';

const compiler = new PromptCompiler();

const compiled = compiler.compile(prompt, {
  topic: 'AI in Marketing',
  targetAudience: 'Marketing professionals',
  tone: 'professional',
  keywords: ['AI', 'automation', 'ROI'],
  wordCount: 1000,
});

console.log(compiled.user); // Compiled prompt text
console.log(compiled.system); // System prompt if defined
```

### Snapshot Testing

```typescript
import { SnapshotTester } from '@neonhub/prompt-registry';

const tester = new SnapshotTester('./snapshots');
await tester.loadAll();

// Save a snapshot
await tester.save(prompt, variables, expectedOutput);

// Test against snapshot
const result = await tester.test(prompt, variables);
if (!result.passed) {
  console.error('Snapshot test failed!');
  console.log('Expected:', result.expected);
  console.log('Actual:', result.actual);
}

// Update snapshot
await tester.update(prompt, variables);
```

## Prompt Format

### Markdown with Frontmatter

```markdown
---
id: content-blog-post
version: "1.0.0"
agent: content
locale: en-US
description: Generate a high-quality blog post
tags: [content, blog, seo]
variables: [topic, audience, tone]
constraints:
  maxTokens: 2000
  temperature: 0.7
  model: gpt-4
---

Generate a blog post about {{topic}} for {{audience}}.

Tone: {{tone}}
```

### JSON Format

```json
{
  "metadata": {
    "id": "email-campaign",
    "version": "1.0.0",
    "agent": "email",
    "variables": ["product", "benefits"]
  },
  "template": "Discover {{product}} - {{join benefits ', '}}",
  "system": "You are an email marketing expert."
}
```

## Handlebars Helpers

Built-in helpers:

- `{{uppercase text}}` - Convert to uppercase
- `{{lowercase text}}` - Convert to lowercase
- `{{capitalize text}}` - Capitalize first letter
- `{{truncate text length}}` - Truncate with ellipsis
- `{{json object}}` - JSON stringify
- `{{join array separator}}` - Join array elements
- `{{eq a b}}` - Equality check
- `{{ne a b}}` - Not equal
- `{{gt a b}}` - Greater than
- `{{lt a b}}` - Less than

Example:

```handlebars
Keywords: {{join keywords ", "}}
Short description: {{truncate description 100}}
{{#if isPremium}}
  Premium content for {{uppercase userName}}
{{/if}}
```

## Directory Structure

```
prompts/
├── content/
│   ├── blog-post.md
│   └── landing-page.md
├── seo/
│   ├── meta-description.md
│   └── title-tags.md
├── email/
│   └── campaign.md
└── social/
    └── linkedin-post.md

snapshots/
└── content-blog-post-1.0.0-a1b2c3d4.snapshot.json
```

## API Reference

### PromptRegistry

- `loadAll()` - Load all prompts from directory
- `register(template)` - Register a prompt
- `get(id, version?)` - Get prompt by ID and version
- `getVersions(id)` - Get all versions of a prompt
- `getByAgent(agent)` - Get prompts for an agent
- `getByTag(tag)` - Get prompts with a tag
- `search(query)` - Search prompts
- `list()` - List all prompt IDs
- `getStats()` - Get statistics

### PromptCompiler

- `compile(template, variables)` - Compile prompt with variables
- `hash(compiled)` - Compute SHA-256 hash
- `validateVariables(template, variables)` - Validate required variables
- `extractVariables(template)` - Extract variable names

### SnapshotTester

- `loadAll()` - Load all snapshots
- `save(template, variables, output)` - Save snapshot
- `test(template, variables)` - Test against snapshot
- `update(template, variables)` - Update snapshot
- `cleanup(days)` - Remove old snapshots
- `getByPromptId(id)` - Get snapshots for prompt

## Testing

```bash
pnpm test
```

## License

MIT

