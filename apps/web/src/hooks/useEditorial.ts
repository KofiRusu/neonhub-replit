import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchEditorialCalendar,
  fetchKeywords,
  fetchPersonas,
  type EditorialEntryRecord,
  type KeywordRecord,
  type PersonaRecord,
} from "@/src/lib/adapters/editorial";

export function usePersonas() {
  return useQuery<PersonaRecord[]>({
    queryKey: ["personas", "all"],
    queryFn: fetchPersonas,
    staleTime: 60 * 1000,
  });
}

export function useKeywords(personaId?: number) {
  return useQuery<KeywordRecord[]>({
    queryKey: ["keywords", personaId ?? "all"],
    queryFn: () => fetchKeywords(personaId),
    staleTime: 60 * 1000,
  });
}

export function useEditorialCalendar(personaId?: number) {
  return useQuery<EditorialEntryRecord[]>({
    queryKey: ["editorial-calendar", personaId ?? "all"],
    queryFn: () => fetchEditorialCalendar(personaId),
    staleTime: 60 * 1000,
  });
}

export function useEditorialOverview(personaId?: number) {
  const personas = usePersonas();
  const keywords = useKeywords(personaId);
  const calendar = useEditorialCalendar(personaId);

  const personaOptions = useMemo(() => {
    if (!personas.data) return [];
    return personas.data.map((persona) => ({
      id: persona.id,
      name: persona.name,
      summary: persona.summary,
    }));
  }, [personas.data]);

  return {
    personas,
    personaOptions,
    keywords,
    calendar,
  };
}

export type { PersonaRecord, KeywordRecord, EditorialEntryRecord } from "@/src/lib/adapters/editorial";

