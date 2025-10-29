import type { Prisma } from "@prisma/client";

export function connectById(id?: string | null) {
  if (!id) {
    return undefined;
  }
  return { connect: { id } } as const;
}

export function mapJsonExtras(input: unknown, keep: string[]) {
  if (!input || typeof input !== "object") {
    return undefined;
  }

  const extras: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!keep.includes(key) && value !== undefined) {
      extras[key] = value;
    }
  }

  return Object.keys(extras).length > 0 ? { metadata: extras as Prisma.JsonValue } : undefined;
}

export function teamUniqueWhere(params: { slug?: string | null; organizationId?: string | null; name?: string | null }) {
  const { slug, organizationId, name } = params;

  if (slug) {
    return { slug };
  }

  if (organizationId && name) {
    return {
      organizationId_name: {
        organizationId,
        name,
      },
    };
  }

  throw new Error("teamUniqueWhere requires a slug or an organizationId/name pair");
}
