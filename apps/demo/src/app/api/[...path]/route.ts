import { NextResponse } from "next/server";

import {
  completeDemoPayment,
  createDemoOrder,
  fulfillDemoOrder,
  getDemoSnapshot,
  spendDemoTicket,
} from "../../../lib/demo-store";
import { jsonError } from "../../../lib/http";

interface RouteContext {
  params: Promise<{
    path: string[];
  }>;
}

function pathKey(path: string[]) {
  return path.join("/");
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { path } = await context.params;

    if (path.length === 3 && path[0] === "players" && path[2] === "balances") {
      return NextResponse.json(getDemoSnapshot(path[1]!));
    }

    return jsonError(new Error(`Unknown demo API route: GET /api/${pathKey(path)}`), 404);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { path } = await context.params;
    const route = pathKey(path);

    if (route === "orders") {
      const body = (await request.json()) as {
        playerId?: string;
        catalogItemId?: string;
      };

      if (!body.playerId || !body.catalogItemId) {
        throw new Error("playerId and catalogItemId are required.");
      }

      return NextResponse.json(createDemoOrder(body.playerId, body.catalogItemId));
    }

    if (route === "payments/mock-complete") {
      const body = (await request.json()) as {
        orderId?: string;
      };

      if (!body.orderId) {
        throw new Error("orderId is required.");
      }

      return NextResponse.json(completeDemoPayment(body.orderId));
    }

    if (route === "fulfill") {
      const body = (await request.json()) as {
        orderId?: string;
      };

      if (!body.orderId) {
        throw new Error("orderId is required.");
      }

      return NextResponse.json(fulfillDemoOrder(body.orderId));
    }

    if (path.length === 3 && path[0] === "players" && path[2] === "spend") {
      return NextResponse.json(spendDemoTicket(path[1]!));
    }

    return jsonError(new Error(`Unknown demo API route: POST /api/${route}`), 404);
  } catch (error) {
    return jsonError(error);
  }
}
