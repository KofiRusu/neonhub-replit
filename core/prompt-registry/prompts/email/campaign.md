---
id: email-campaign
version: "1.0.0"
agent: email
locale: en-US
description: Generate email campaign content
tags: [email, marketing, campaign]
variables: [campaignType, subject, audience, productName, benefits, ctaUrl]
constraints:
  maxTokens: 1000
  temperature: 0.6
  model: gpt-4
system: You are an expert email marketing copywriter who creates compelling, conversion-focused email campaigns.
---

Create an email campaign for: {{campaignType}}

Subject Line Ideas: {{subject}}
Target Audience: {{audience}}
Product/Service: {{productName}}
Key Benefits: {{join benefits ", "}}
CTA URL: {{ctaUrl}}

Structure:
1. Attention-grabbing subject line (provide 3 variations)
2. Personalized greeting
3. Engaging opening paragraph
4. Key benefits (bullet points)
5. Social proof or testimonial hook
6. Strong call-to-action
7. Footer with unsubscribe

Tone: Professional but friendly, benefit-focused
Length: 200-300 words

Output in HTML email format.

