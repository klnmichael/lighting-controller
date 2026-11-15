import { createHash, timingSafeEqual } from "node:crypto";
import { Apinator } from "@apinator/server";
import { APINATOR_CHANNEL } from "../../../../lib/apinator-protocol.ts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { APINATOR_APP_ID, APINATOR_KEY, APINATOR_SECRET, APINATOR_CLUSTER, APINATOR_CONTROL_PASSWORD } = process.env;
  if (!APINATOR_APP_ID || !APINATOR_KEY || !APINATOR_SECRET ||
    !APINATOR_CLUSTER || !["us", "eu"].includes(APINATOR_CLUSTER) ||
    !APINATOR_CONTROL_PASSWORD || !/^[\x21-\x7e]{32,}$/.test(APINATOR_CONTROL_PASSWORD)) {
    return Response.json({ error: "Remote control is not configured" }, { status: 503 });
  }
  const provided = request.headers.get("authorization");
  const expectedHash = createHash("sha256").update(`Bearer ${APINATOR_CONTROL_PASSWORD}`).digest();
  const providedHash = createHash("sha256").update(provided ?? "").digest();
  if (!timingSafeEqual(expectedHash, providedHash)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (Number(request.headers.get("content-length")) > 4096) {
    return Response.json({ error: "Request too large" }, { status: 413 });
  }
  let body: unknown;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text) > 4096) {
      return Response.json({ error: "Request too large" }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("socket_id" in body) ||
    typeof body.socket_id !== "string" || body.socket_id.length === 0 || body.socket_id.length > 256 ||
    !("channel_name" in body) || body.channel_name !== APINATOR_CHANNEL) {
    return Response.json({ error: "Invalid channel request" }, { status: 400 });
  }
  const apinator = new Apinator({
    appId: APINATOR_APP_ID,
    key: APINATOR_KEY,
    secret: APINATOR_SECRET,
    cluster: APINATOR_CLUSTER,
  });
  return Response.json(apinator.authenticateChannel(body.socket_id, APINATOR_CHANNEL), {
    headers: { "Cache-Control": "no-store" },
  });
}
