import { NextResponse } from "next/server";

import { createDemoOrder } from "../../../lib/demo-store";
import { jsonError } from "../../../lib/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      playerId?: string;
      catalogItemId?: string;
    };

    if (!body.playerId || !body.catalogItemId) {
      throw new Error("playerId and catalogItemId are required.");
    }

    return NextResponse.json(createDemoOrder(body.playerId, body.catalogItemId));
  } catch (error) {
    return jsonError(error);
  }
}
