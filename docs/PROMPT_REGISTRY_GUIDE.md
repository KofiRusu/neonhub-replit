# Prompt Registry Guide

## Overview

The Prompt Registry provides centralized management of all LLM prompts with versioning, compilation, and testing capabilities.

## Creating Prompts

### Markdown Format (Recommended)

```markdown
---
id: content-blog-post
version: "1.0.0"
agent: content
locale: en-US
description: Generate a high-quality blog post
tags: [content, blog, seo]
variables: [topic, tone, keywords]
constraints:
  maxTokens: 2000
  temperature: 0.7
  model: gpt-4
---

Generate a blog post about {{topic}}.

Tone: {{tone}}
Keywords: {{join keywords ", "}}

Requirements:
- Engaging introduction
- Clear structure
- SEO optimized
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
  "template": "Discover {{product}} - {{join benefits}}",
  "system": "You are an email marketing expert."
}
```

## Handlebars Helpers

### Built-in Helpers

- `{{uppercase text}}` - HELLO
- `{{lowercase text}}` - hello
- `{{capitalize text}}` - Hello
- `{{truncate text 100}}` - Hello wo...
- `{{json object}}` - {"key": "value"}
- `{{join array ", "}}` - item1, item2
- `{{#if condition}}...{{/if}}`
- `{{eq a b}}`, `{{ne a b}}`, `{{gt a b}}`

### Custom Helpers

Register custom helpers:

```typescript
compiler.handlebars.registerHelper('custom', (arg) => {
  return arg.toUpperCase();
});
```

## Versioning

### Semantic Versioning

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features
- **Patch** (1.0.0 → 1.0.1): Bug fixes

### Version Management

```typescript
// Get specific version
const v1 = registry.get('prompt-id', '1.0.0');

// Get latest version
const latest = registry.get('prompt-id');

// Get all versions
const versions = registry.getVersions('prompt-id');
```

## Snapshot Testing

### Creating Snapshots

```typescript
await tester.save(template, variables, expectedOutput);
```

### Running Tests

```typescript
const result = await tester.test(template, variables);
if (!result.passed) {
  console.error('Expected:', result.expected);
  console.error('Actual:', result.actual);
}
```

### Updating Snapshots

```typescript
await tester.update(template, variables);
```

## Best Practices

1. **One Prompt Per File**: Keep prompts focused
2. **Descriptive IDs**: Use clear, hierarchical naming
3. **Version Everything**: Always specify version
4. **Document Variables**: List all required variables
5. **Test Before Deploy**: Use snapshots for regression testing
6. **Use Templates**: Leverage Handlebars for reusability
7. **Keep It DRY**: Extract common patterns to helpers

## Examples

### Blog Post Prompt

```markdown
---
id: content-blog-post
version: "1.0.0"
agent: content
variables: [topic, targetAudience, tone, keywords, wordCount]
---

Generate a {{wordCount}}-word blog post about {{topic}}.

Target Audience: {{targetAudience}}
Tone: {{tone}}
Keywords: {{join keywords ", "}}
```

### Email Campaign

```markdown
---
id: email-campaign
version: "1.0.0"
agent: email
variables: [productName, benefits, ctaUrl]
system: You are an expert email copywriter.
---

Create an email promoting {{productName}}.

Benefits:
{{#each benefits}}
- {{this}}
{{/each}}

CTA: {{ctaUrl}}
```

### SEO Meta Description

```markdown
---
id: seo-meta-description
version: "1.0.0"
agent: seo
variables: [pageTitle, primaryKeyword]
constraints:
  maxTokens: 200
  temperature: 0.5
---

Create an SEO-optimized meta description (155-160 chars).

Page: {{pageTitle}}
Keyword: {{primaryKeyword}}

Output only the meta description.
```

## Migration

### From Hardcoded Prompts

```typescript
// Before
const prompt = `Generate content about ${topic}`;

// After
const template = registry.get('content-generate');
const compiled = compiler.compile(template, { topic });
```

### From Legacy System

```typescript
// Export from old system
const oldPrompts = await oldSystem.export();

// Import to registry
for (const prompt of oldPrompts) {
  registry.register({
    metadata: {
      id: prompt.id,
      version: '1.0.0',
      agent: prompt.agent,
      variables: prompt.variables,
    },
    template: prompt.text,
  });
}
```

## Troubleshooting

### Missing Variables

**Error**: `Missing required variables: topic`

**Solution**: Ensure all variables in metadata are provided

### Compilation Errors

**Error**: `Failed to compile prompt`

**Solution**: Check Handlebars syntax, ensure helpers exist

### Snapshot Failures

**Error**: `Snapshot test failed`

**Solution**: Review changes, update snapshot if intentional

---

**End of Guide**

