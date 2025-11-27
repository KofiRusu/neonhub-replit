import { describe, it, expect, beforeEach } from '@jest/globals';
import { PromptCompiler } from '../compiler.js';
import { PromptTemplate } from '../types.js';

describe('PromptCompiler', () => {
  let compiler: PromptCompiler;

  beforeEach(() => {
    compiler = new PromptCompiler();
  });

  const sampleTemplate: PromptTemplate = {
    metadata: {
      id: 'test-prompt',
      version: '1.0.0',
      agent: 'test',
      locale: 'en-US',
      variables: ['name', 'topic'],
      tags: [],
    },
    template: 'Hello {{name}}, let\'s talk about {{topic}}!',
  };

  it('should compile simple template', () => {
    const compiled = compiler.compile(sampleTemplate, {
      name: 'Alice',
      topic: 'AI',
    });

    expect(compiled.user).toBe('Hello Alice, let\'s talk about AI!');
    expect(compiled.id).toBe('test-prompt');
    expect(compiled.version).toBe('1.0.0');
  });

  it('should compile system prompt', () => {
    const template: PromptTemplate = {
      ...sampleTemplate,
      system: 'You are a {{role}} assistant.',
    };

    const compiled = compiler.compile(template, {
      name: 'Alice',
      topic: 'AI',
      role: 'helpful',
    });

    expect(compiled.system).toBe('You are a helpful assistant.');
  });

  it('should compile with uppercase helper', () => {
    const template: PromptTemplate = {
      ...sampleTemplate,
      template: 'Hello {{uppercase name}}!',
    };

    const compiled = compiler.compile(template, {
      name: 'alice',
      topic: 'AI',
    });

    expect(compiled.user).toBe('Hello ALICE!');
  });

  it('should compile with lowercase helper', () => {
    const template: PromptTemplate = {
      ...sampleTemplate,
      template: 'Email: {{lowercase email}}',
    };

    const compiled = compiler.compile(template, {
      name: 'Alice',
      topic: 'AI',
      email: 'ALICE@EXAMPLE.COM',
    });

    expect(compiled.user).toBe('Email: alice@example.com');
  });

  it('should compile with truncate helper', () => {
    const template: PromptTemplate = {
      ...sampleTemplate,
      template: 'Summary: {{truncate description 20}}',
    };

    const compiled = compiler.compile(template, {
      name: 'Alice',
      topic: 'AI',
      description: 'This is a very long description that should be truncated',
    });

    expect(compiled.user).toBe('Summary: This is a very long...');
  });

  it('should compile with join helper', () => {
    const template: PromptTemplate = {
      ...sampleTemplate,
      template: 'Keywords: {{join keywords ", "}}',
    };

    const compiled = compiler.compile(template, {
      name: 'Alice',
      topic: 'AI',
      keywords: ['machine learning', 'neural networks', 'deep learning'],
    });

    expect(compiled.user).toBe('Keywords: machine learning, neural networks, deep learning');
  });

  it('should compile with conditional helper', () => {
    const template: PromptTemplate = {
      ...sampleTemplate,
      template: '{{#if premium}}Premium user{{else}}Standard user{{/if}}',
    };

    const compiled1 = compiler.compile(template, {
      name: 'Alice',
      topic: 'AI',
      premium: true,
    });

    const compiled2 = compiler.compile(template, {
      name: 'Bob',
      topic: 'ML',
      premium: false,
    });

    expect(compiled1.user).toBe('Premium user');
    expect(compiled2.user).toBe('Standard user');
  });

  it('should compile examples', () => {
    const template: PromptTemplate = {
      ...sampleTemplate,
      examples: [
        { user: 'Hello {{name}}', assistant: 'Hi there!' },
        { user: 'What is {{topic}}?', assistant: 'Let me explain.' },
      ],
    };

    const compiled = compiler.compile(template, {
      name: 'Alice',
      topic: 'AI',
    });

    expect(compiled.examples).toHaveLength(2);
    expect(compiled.examples?.[0].user).toBe('Hello Alice');
    expect(compiled.examples?.[1].user).toBe('What is AI?');
  });

  it('should compute consistent hash', () => {
    const compiled = compiler.compile(sampleTemplate, {
      name: 'Alice',
      topic: 'AI',
    });

    const hash1 = compiler.hash(compiled);
    const hash2 = compiler.hash(compiled);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256
  });

  it('should compute different hash for different content', () => {
    const compiled1 = compiler.compile(sampleTemplate, {
      name: 'Alice',
      topic: 'AI',
    });

    const compiled2 = compiler.compile(sampleTemplate, {
      name: 'Bob',
      topic: 'ML',
    });

    const hash1 = compiler.hash(compiled1);
    const hash2 = compiler.hash(compiled2);

    expect(hash1).not.toBe(hash2);
  });

  it('should validate variables', () => {
    const validation1 = compiler.validateVariables(sampleTemplate, {
      name: 'Alice',
      topic: 'AI',
    });

    expect(validation1.valid).toBe(true);
    expect(validation1.missing).toHaveLength(0);

    const validation2 = compiler.validateVariables(sampleTemplate, {
      name: 'Alice',
    });

    expect(validation2.valid).toBe(false);
    expect(validation2.missing).toContain('topic');
  });

  it('should extract variables from template', () => {
    const variables = compiler.extractVariables('Hello {{name}}, your score is {{score}}!');
    expect(variables).toContain('name');
    expect(variables).toContain('score');
    expect(variables).toHaveLength(2);
  });

  it('should extract variables with helpers', () => {
    const variables = compiler.extractVariables('{{uppercase name}} - {{join keywords}}');
    expect(variables).toContain('name');
    expect(variables).toContain('keywords');
  });

  it('should handle missing variables gracefully', () => {
    const template: PromptTemplate = {
      ...sampleTemplate,
      template: 'Hello {{name}}!',
    };

    expect(() => {
      compiler.compile(template, {});
    }).not.toThrow();
  });
});

