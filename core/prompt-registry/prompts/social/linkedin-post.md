---
id: social-linkedin-post
version: "1.0.0"
agent: social
locale: en-US
description: Generate professional LinkedIn post
tags: [social, linkedin, professional]
variables: [topic, angle, hashtags, includeEmoji]
constraints:
  maxTokens: 500
  temperature: 0.7
  model: gpt-3.5-turbo
---

Create a professional LinkedIn post about: {{topic}}

Angle: {{angle}}
Hashtags: {{join hashtags " "}}
{{#if includeEmoji}}Include relevant emojis{{/if}}

Requirements:
- Hook in the first line
- Value-driven content
- Personal or professional insight
- 3-5 relevant hashtags at the end
- Encourage engagement (ask a question or prompt discussion)
- Length: 150-200 words
- Professional yet conversational tone

Output the complete LinkedIn post ready to publish.

