---
id: seo-meta-description
version: "1.0.0"
agent: seo
locale: en-US
description: Generate SEO-optimized meta description
tags: [seo, meta, description]
variables: [pageTitle, primaryKeyword, contentSummary]
constraints:
  maxTokens: 200
  temperature: 0.5
  model: gpt-3.5-turbo
---

Create an SEO-optimized meta description for a webpage.

Page Title: {{pageTitle}}
Primary Keyword: {{primaryKeyword}}
Content Summary: {{truncate contentSummary 200}}

Requirements:
- Maximum 155-160 characters
- Include the primary keyword naturally
- Create a compelling call-to-action
- Accurately summarize the page content
- Use active voice
- Make it click-worthy

Output only the meta description, nothing else.

