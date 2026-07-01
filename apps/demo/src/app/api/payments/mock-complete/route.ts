import { NextResponse } from "next/server";

import { completeDemoPayment } from "../../../../lib/demo-store";
import { jsonError } from "../../../../lib/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
    };

    if (!body.orderId) {
      throw new Error("orderId is required.");
    }

    return NextResponse.json(completeDemoPayment(body.orderId));
  } catch (error) {
    return jsonError(error);
  }
}
