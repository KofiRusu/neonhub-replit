import path from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv({
  path: path.resolve(__dirname, '.env.test'),
  override: false
});

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
