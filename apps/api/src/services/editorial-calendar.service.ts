import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";

export type EditorialEntry = Prisma.EditorialCalendarGetPayload<{
  include: { persona: true };
}>;

export type EditorialFilters = {
  personaId?: number;
  status?: string;
};

export type CreateEditorialInput = {
  title: string;
  publishAt: Date;
  priority?: number | null;
  status?: string | null;
  personaId?: number | null;
};

export type UpdateEditorialInput = Partial<CreateEditorialInput>;

export async function listEditorialEntries(filters: EditorialFilters = {}): Promise<EditorialEntry[]> {
  return prisma.editorialCalendar.findMany({
    where: {
      ...(filters.personaId ? { personaId: filters.personaId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    include: { persona: true },
    orderBy: [
      { publishAt: "asc" },
      { priority: "desc" },
    ],
  });
}

export async function getEditorialEntry(id: number): Promise<EditorialEntry | null> {
  return prisma.editorialCalendar.findUnique({
    where: { id },
    include: { persona: true },
  });
}

export async function createEditorialEntry(input: CreateEditorialInput): Promise<EditorialEntry> {
  return prisma.editorialCalendar.create({
    data: {
      title: input.title,
      publishAt: input.publishAt,
      priority: input.priority ?? null,
      status: input.status ?? "planned",
      personaId: input.personaId ?? null,
    },
    include: { persona: true },
  });
}

export async function updateEditorialEntry(id: number, input: UpdateEditorialInput): Promise<EditorialEntry> {
  return prisma.editorialCalendar.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.publishAt !== undefined ? { publishAt: input.publishAt } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.personaId !== undefined ? { personaId: input.personaId } : {}),
    },
    include: { persona: true },
  });
}

export async function deleteEditorialEntry(id: number): Promise<void> {
  await prisma.editorialCalendar.delete({
    where: { id },
  });
}

