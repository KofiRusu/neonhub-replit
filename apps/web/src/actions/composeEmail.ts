"use server";

import type { ComposerResult } from "@neonhub/sdk";
import { nh } from "@neonhub/sdk";

export async function composeEmailFor(personId: string): Promise<ComposerResult> {
  const draft = await nh.voice.compose({
    channel: "email",
    objective: "demo_book",
    personId,
    constraints: { maxVariants: 2 },
  });

  return draft;
}
