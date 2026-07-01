import { NextResponse } from "next/server";

import { getDemoSnapshot } from "../../../../../lib/demo-store";
import { jsonError } from "../../../../../lib/http";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    return NextResponse.json(getDemoSnapshot(id));
  } catch (error) {
    return jsonError(error);
  }
}
