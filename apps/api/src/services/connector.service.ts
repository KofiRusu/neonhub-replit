import { Prisma, type ConnectorAuth, ConnectorKind } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { logger } from "../lib/logger.js";
import { connectorRegistry } from "../connectors/base/ConnectorRegistry.js";
import type { Connector } from "../connectors/base/Connector.js";
import type { ConnectorMetadata } from "../connectors/base/types.js";

function toDbPayload(connector: Connector) {
  const meta = connector.metadata;
  return {
    name: meta.name,
    displayName: meta.displayName,
    description: meta.description,
    category: meta.category as ConnectorKind,
    iconUrl: meta.iconUrl ?? null,
    websiteUrl: meta.websiteUrl ?? null,
    authType: meta.authType,
    authConfig: (meta.authConfig ?? {}) as Prisma.InputJsonValue,
    isEnabled: true,
    isVerified: true,
    triggers: connector.triggers
      .map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        pollingIntervalSeconds: t.pollingIntervalSeconds,
      })) as Prisma.InputJsonValue,
    actions: connector.actions
      .map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
      })) as Prisma.InputJsonValue,
    metadata: {} as Prisma.InputJsonValue,
  };
}

export async function syncRegisteredConnectors() {
  const connectors = connectorRegistry.list();
  for (const connector of connectors) {
    await prisma.connector.upsert({
      where: { name: connector.metadata.name },
      create: toDbPayload(connector),
      update: toDbPayload(connector),
    });
  }
  const registeredNames = connectors.map(c => c.metadata.name);
  await prisma.connector.updateMany({
    where: {
      name: { notIn: registeredNames },
    },
    data: { isEnabled: false },
  });
}

export async function listConnectors() {
  const records = await prisma.connector.findMany({
    orderBy: { displayName: "asc" },
  });

  const registry = connectorRegistry.list();
  return records.map(record => {
    const runtime = registry.find(conn => conn.metadata.name === record.name);
    return {
      ...record,
      runtimeRegistered: Boolean(runtime),
    };
  });
}

export async function getConnector(name: string): Promise<ConnectorMetadata | null> {
  const connector = connectorRegistry.get(name);
  if (!connector) return null;
  return connector.metadata;
}

export async function listConnectorAuths(userId: string) {
  return prisma.connectorAuth.findMany({
    where: { userId },
    include: {
      connector: {
        select: {
          displayName: true,
          iconUrl: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function markConnectorAuthError(authId: string, error: Error) {
  await prisma.connectorAuth.update({
    where: { id: authId },
    data: {
      status: "error",
      lastError: error.message,
      updatedAt: new Date(),
    },
  });
  logger.error({ authId, error }, "Connector auth marked as error");
}

export async function recordConnectorUsage(auth: ConnectorAuth) {
  await prisma.connectorAuth.update({
    where: { id: auth.id },
    data: {
      lastUsedAt: new Date(),
      status: "active",
    },
  });
}
