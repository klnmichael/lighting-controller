import { NextRequest } from "next/server";
import { updateWizLight } from "@/utils/updateWizLight";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    updateWizLight(body.ip, body);

    return new Response("", { status: 200 });
  } catch (e) {
    console.log(e);
    return new Response("", { status: 500 });
  }
}
