import { NextResponse } from "next/server";
import { nh } from "@neonhub/sdk";

export async function POST(req: Request) {
  const { personId } = await req.json();

  if (!personId) {
    return NextResponse.json({ error: "personId is required" }, { status: 400 });
  }

  const draft = await nh.voice.compose({
    channel: "sms",
    objective: "nurture_checkin",
    personId,
    constraints: { maxChars: 160 },
  });

  const sendResponse = await nh.send.sms({
    to: personId,
    body: draft.body,
  });

  return NextResponse.json(sendResponse);
}
