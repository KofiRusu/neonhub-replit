import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";

const TEST_KEY = "a".repeat(64);
let originalKey: string | undefined;

async function loadEncryption() {
  return await import("../encryption.js");
}

describe("encryption utilities", () => {
  beforeAll(() => {
    originalKey = process.env.ENCRYPTION_KEY;
  });

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
    jest.resetModules();
  });

  it("encrypts and decrypts payloads using AES-256-GCM", async () => {
    const { encrypt, decrypt } = await loadEncryption();

    const secret = "NeonHub keeps customer data safe";
    const encrypted = encrypt(secret);
    expect(encrypted.split(":")).toHaveLength(3);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(secret);
  });

  it("throws for malformed encrypted payloads", async () => {
    const { decrypt } = await loadEncryption();
    expect(() => decrypt("invalid-format")).toThrow("Invalid encrypted data format");
  });

  it("masks tokens for display", async () => {
    const { maskToken } = await loadEncryption();
    expect(maskToken("short")).toBe("****");
    expect(maskToken("1234567890123456")).toBe("1234...3456");
  });

  it("rejects missing encryption key at load time", async () => {
    delete process.env.ENCRYPTION_KEY;
    jest.resetModules();
    await expect(import("../encryption.js")).rejects.toThrow("ENCRYPTION_KEY must be 64 hex characters");
  });

  afterAll(() => {
    process.env.ENCRYPTION_KEY = originalKey;
  });
});
