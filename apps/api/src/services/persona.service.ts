import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";

export type PersonaWithRelations = Prisma.PersonaGetPayload<{
  include: {
    keywords: true;
    calendars: true;
  };
}>;

export type CreatePersonaInput = {
  name: string;
  summary?: string | null;
};

export type UpdatePersonaInput = {
  name?: string;
  summary?: string | null;
};

export async function listPersonas(): Promise<PersonaWithRelations[]> {
  return prisma.persona.findMany({
    orderBy: { name: "asc" },
    include: {
      keywords: {
        orderBy: [
          { priority: "desc" },
          { term: "asc" },
        ],
      },
      calendars: {
        orderBy: { publishAt: "asc" },
      },
    },
  });
}

export async function getPersonaById(id: number): Promise<PersonaWithRelations | null> {
  return prisma.persona.findUnique({
    where: { id },
    include: {
      keywords: true,
      calendars: true,
    },
  });
}

export async function createPersona(input: CreatePersonaInput): Promise<PersonaWithRelations> {
  return prisma.persona.create({
    data: {
      name: input.name,
      summary: input.summary ?? null,
    },
    include: {
      keywords: true,
      calendars: true,
    },
  });
}

export async function updatePersona(id: number, input: UpdatePersonaInput): Promise<PersonaWithRelations> {
  return prisma.persona.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.summary !== undefined ? { summary: input.summary ?? null } : {}),
    },
    include: {
      keywords: true,
      calendars: true,
    },
  });
}

export async function deletePersona(id: number): Promise<void> {
  await prisma.persona.delete({
    where: { id },
  });
}

