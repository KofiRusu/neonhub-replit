---
id: content-blog-post
version: "1.0.0"
agent: content
locale: en-US
description: Generate a high-quality blog post with SEO optimization
tags: [content, blog, seo]
variables: [topic, targetAudience, tone, keywords, wordCount]
constraints:
  maxTokens: 2000
  temperature: 0.7
  model: gpt-4
author: NeonHub Team
---

Generate a high-quality blog post about {{topic}}.

Target Audience: {{targetAudience}}
Tone: {{tone}}
Word Count: {{wordCount}}
SEO Keywords: {{join keywords ", "}}

Requirements:
- Create an engaging introduction that hooks the reader
- Use clear section headings (H2, H3)
- Incorporate the SEO keywords naturally throughout the content
- Include practical examples or case studies
- Add a compelling conclusion with a call-to-action
- Maintain the specified tone: {{tone}}
- Target word count: {{wordCount}} words

Format the output as markdown with proper headings and structure.

