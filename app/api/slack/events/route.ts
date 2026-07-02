import { NextResponse } from "next/server";
import { loadSlackOfficeConfig } from "@/lib/slack/config";
import { verifySlackRequestSignature } from "@/lib/slack/bot-client";
import { handleSlackEventCallback, type SlackMessageEvent } from "@/lib/slack/events-handler";

export async function POST(request: Request) {
  const rawBody = await request.text();
  let body: {
    type?: string;
    challenge?: string;
    token?: string;
    event?: unknown;
    event_id?: string;
  };

  try {
    body = JSON.parse(rawBody) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const config = await loadSlackOfficeConfig();
  const signingSecret = config.supportSigningSecret.trim();

  if (signingSecret) {
    const valid = verifySlackRequestSignature(
      signingSecret,
      request.headers.get("x-slack-signature"),
      request.headers.get("x-slack-request-timestamp"),
      rawBody,
    );
    if (!valid) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
  }

  if (body.type === "url_verification" && body.challenge) {
    return NextResponse.json({ challenge: body.challenge });
  }

  if (body.type === "event_callback") {
    void handleSlackEventCallback(
      body as { type?: string; event?: SlackMessageEvent; event_id?: string },
    ).catch(() => undefined);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
