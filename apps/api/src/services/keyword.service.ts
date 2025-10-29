import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";

export type KeywordWithPersona = Prisma.KeywordGetPayload<{
  include: { persona: true };
}>;

export type KeywordFilters = {
  personaId?: number;
};

export type CreateKeywordInput = {
  term: string;
  intent: string;
  priority?: number | null;
  personaId?: number | null;
};

export type UpdateKeywordInput = Partial<CreateKeywordInput>;

export async function listKeywords(filters: KeywordFilters = {}): Promise<KeywordWithPersona[]> {
  return prisma.keyword.findMany({
    where: {
      ...(filters.personaId ? { personaId: filters.personaId } : {}),
    },
    include: { persona: true },
    orderBy: [
      { priority: "desc" },
      { term: "asc" },
    ],
  });
}

export async function getKeyword(id: number): Promise<KeywordWithPersona | null> {
  return prisma.keyword.findUnique({
    where: { id },
    include: { persona: true },
  });
}

export async function createKeyword(input: CreateKeywordInput): Promise<KeywordWithPersona> {
  return prisma.keyword.create({
    data: {
      term: input.term,
      intent: input.intent,
      priority: input.priority ?? null,
      personaId: input.personaId ?? null,
    },
    include: { persona: true },
  });
}

export async function updateKeyword(id: number, input: UpdateKeywordInput): Promise<KeywordWithPersona> {
  return prisma.keyword.update({
    where: { id },
    data: {
      ...(input.term !== undefined ? { term: input.term } : {}),
      ...(input.intent !== undefined ? { intent: input.intent } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.personaId !== undefined ? { personaId: input.personaId } : {}),
    },
    include: { persona: true },
  });
}

export async function deleteKeyword(id: number): Promise<void> {
  await prisma.keyword.delete({
    where: { id },
  });
}

