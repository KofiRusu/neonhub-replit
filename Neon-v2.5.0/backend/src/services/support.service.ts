export async function reply({ notes }: { notes?: string }) {
  const body = `Thanks for reaching out! We’re here to help.${notes ? `\n\nContext: ${notes}` : ""}`;
  return { reply: body, tone: "friendly-professional" };
}



