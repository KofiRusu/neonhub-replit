import path from "path";
import { jest } from "@jest/globals";
import { config as loadEnv } from "dotenv";

const envPath = path.resolve(process.cwd(), ".env.test");

loadEnv({
  path: envPath,
  override: false,
});

process.env.NODE_ENV = process.env.NODE_ENV || "test";

jest.mock("superjson", () => ({
  __esModule: true,
  default: {
    serialize: (data: unknown) => ({ json: data }),
    deserialize: <T>(value: T) => value,
  },
  serialize: (data: unknown) => ({ json: data }),
  deserialize: <T>(value: T) => value,
  stringify: JSON.stringify,
  parse: JSON.parse,
}));
