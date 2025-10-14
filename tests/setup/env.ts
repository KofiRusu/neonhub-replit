// Test environment setup
// Provides safe defaults for environment variables during tests

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/testdb';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key-for-testing';
process.env.OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

