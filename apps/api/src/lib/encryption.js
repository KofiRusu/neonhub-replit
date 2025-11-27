"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.maskToken = maskToken;
var crypto_1 = require("crypto");
var ALGORITHM = 'aes-256-gcm';
var ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32');
}
/**
 * Encrypts text using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData
 */
function encrypt(text) {
    var iv = crypto_1.default.randomBytes(16);
    var cipher = crypto_1.default.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    var encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    var authTag = cipher.getAuthTag();
    // Format: iv:authTag:encrypted
    return "".concat(iv.toString('hex'), ":").concat(authTag.toString('hex'), ":").concat(encrypted);
}
/**
 * Decrypts text encrypted with AES-256-GCM
 * @param encryptedData - Encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 */
function decrypt(encryptedData) {
    var parts = encryptedData.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }
    var iv = Buffer.from(parts[0], 'hex');
    var authTag = Buffer.from(parts[1], 'hex');
    var encrypted = parts[2];
    var decipher = crypto_1.default.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);
    var decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
/**
 * Masks a token for display purposes
 * Shows only first and last 4 characters
 */
function maskToken(token) {
    if (!token || token.length < 12) {
        return '****';
    }
    return "".concat(token.slice(0, 4), "...").concat(token.slice(-4));
}
