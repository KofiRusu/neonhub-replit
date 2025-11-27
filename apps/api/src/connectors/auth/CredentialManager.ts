import { prisma } from "../../db/prisma.js";
import { encrypt, decrypt, maskToken } from "../../lib/encryption.js";
import { Prisma, type ConnectorAuth, ConnectorKind } from "@prisma/client";
import type { ConnectorAuthContext } from "../base/types.js";

export interface SaveConnectorAuthParams {
  userId: string;
  connectorId: string;
  connectorKind: ConnectorKind;
  accountId?: string | null;
  accountName?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  apiKey?: string | null;
  apiSecret?: string | null;
  scope?: string | null;
  tokenType?: string | null;
  expiresAt?: Date | null;
  metadata?: Record<string, unknown> | null;
}

export interface DecryptedConnectorAuth
  extends Omit<ConnectorAuth, "accessToken" | "refreshToken" | "apiKey" | "apiSecret" | "metadata"> {
  accessToken?: string | null;
  refreshToken?: string | null;
  apiKey?: string | null;
  apiSecret?: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MaskedConnectorAuth extends DecryptedConnectorAuth {
  accessTokenMasked?: string;
  refreshTokenMasked?: string;
  apiKeyMasked?: string;
  apiSecretMasked?: string;
}

function maybeEncrypt(value?: string | null) {
  if (!value) return null;
  return encrypt(value);
}

function maybeDecrypt(value?: string | null) {
  if (!value) return undefined;
  return decrypt(value);
}

function toJsonValue(data?: Record<string, unknown> | null): Prisma.JsonValue {
  return (data ?? {}) as Prisma.JsonValue;
}

function jsonToRecord(value: Prisma.JsonValue | null): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

export class ConnectorCredentialManager {
  async save(params: SaveConnectorAuthParams) {
    const encryptedAccessToken = maybeEncrypt(params.accessToken);
    const encryptedRefreshToken = maybeEncrypt(params.refreshToken);
    const encryptedApiKey = maybeEncrypt(params.apiKey);
    const encryptedApiSecret = maybeEncrypt(params.apiSecret);
    const metadata = toJsonValue(params.metadata);
    const timestamp = new Date();

    return prisma.connectorAuth.upsert({
      where: {
        userId_connectorId_accountId: {
          userId: params.userId,
          connectorId: params.connectorId,
          accountId: params.accountId ?? null,
        },
      },
      update: {
        accountId: params.accountId ?? null,
        accountName: params.accountName ?? null,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        apiKey: encryptedApiKey,
        apiSecret: encryptedApiSecret,
        scope: params.scope ?? null,
        tokenType: params.tokenType ?? null,
        expiresAt: params.expiresAt ?? null,
        metadata,
        status: "active",
        lastUsedAt: timestamp,
        updatedAt: timestamp,
        connectorKind: params.connectorKind,
      } satisfies Prisma.ConnectorAuthUncheckedUpdateInput,
      create: {
        userId: params.userId,
        connectorId: params.connectorId,
        connectorKind: params.connectorKind,
        accountId: params.accountId ?? null,
        accountName: params.accountName ?? null,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        apiKey: encryptedApiKey,
        apiSecret: encryptedApiSecret,
        scope: params.scope ?? null,
        tokenType: params.tokenType ?? null,
        expiresAt: params.expiresAt ?? null,
        metadata,
        status: "active",
        lastUsedAt: timestamp,
      } satisfies Prisma.ConnectorAuthUncheckedCreateInput,
    });
  }

  async get(userId: string, connectorId: string, accountId?: string | null): Promise<DecryptedConnectorAuth | null> {
    const auth = await prisma.connectorAuth.findFirst({
      where: {
        userId,
        connectorId,
        status: "active",
        ...(accountId !== undefined ? { accountId: accountId ?? "" } : {}),
      },
    });

    if (!auth) return null;

    return {
      ...auth,
      accessToken: maybeDecrypt(auth.accessToken),
      refreshToken: maybeDecrypt(auth.refreshToken),
      apiKey: maybeDecrypt(auth.apiKey),
      apiSecret: maybeDecrypt(auth.apiSecret),
      metadata: jsonToRecord(auth.metadata) ?? null,
    };
  }

  async toContext(userId: string, connectorId: string, accountId?: string | null): Promise<ConnectorAuthContext | null> {
    const auth = await this.get(userId, connectorId, accountId);
    if (!auth) return null;
    return {
      accessToken: auth.accessToken ?? undefined,
      refreshToken: auth.refreshToken ?? undefined,
      apiKey: auth.apiKey ?? undefined,
      apiSecret: auth.apiSecret ?? undefined,
      metadata: auth.metadata ?? undefined,
    };
  }

  async listMasked(userId: string): Promise<MaskedConnectorAuth[]> {
    const auths = await prisma.connectorAuth.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return auths.map(auth => ({
      ...auth,
      metadata: jsonToRecord(auth.metadata) ?? null,
      accessToken: undefined,
      refreshToken: undefined,
      apiKey: undefined,
      apiSecret: undefined,
      accessTokenMasked: auth.accessToken ? maskToken(maybeDecrypt(auth.accessToken) || "") : undefined,
      refreshTokenMasked: auth.refreshToken ? maskToken(maybeDecrypt(auth.refreshToken) || "") : undefined,
      apiKeyMasked: auth.apiKey ? maskToken(maybeDecrypt(auth.apiKey) || "") : undefined,
      apiSecretMasked: auth.apiSecret ? maskToken(maybeDecrypt(auth.apiSecret) || "") : undefined,
    }));
  }

  async revoke(id: string) {
    await prisma.connectorAuth.update({
      where: { id },
      data: { status: "revoked", updatedAt: new Date() },
    });
  }

  async remove(id: string) {
    await prisma.connectorAuth.delete({
      where: { id },
    });
  }
}

export const connectorCredentialManager = new ConnectorCredentialManager();
