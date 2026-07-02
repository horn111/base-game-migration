import {
  completeDemoPayment,
  createDemoOrder,
  fulfillDemoOrder,
  getDemoSnapshot,
  spendDemoTicket,
} from "../../../lib/demo-store";
import { createDemoStoreFromRequest, jsonWithDemoState } from "../../../lib/demo-session";
import { jsonError } from "../../../lib/http";

interface RouteContext {
  params: Promise<{
    path: string[];
  }>;
}

function pathKey(path: string[]) {
  return path.join("/");
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { path } = await context.params;
    const store = createDemoStoreFromRequest(request);

    if (path.length === 3 && path[0] === "players" && path[2] === "balances") {
      return jsonWithDemoState(getDemoSnapshot(path[1]!, store), store);
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
    const store = createDemoStoreFromRequest(request);

    if (route === "orders") {
      const body = (await request.json()) as {
        playerId?: string;
        catalogItemId?: string;
      };

      if (!body.playerId || !body.catalogItemId) {
        throw new Error("playerId and catalogItemId are required.");
      }

      return jsonWithDemoState(createDemoOrder(body.playerId, body.catalogItemId, store), store);
    }

    if (route === "payments/mock-complete") {
      const body = (await request.json()) as {
        orderId?: string;
      };

      if (!body.orderId) {
        throw new Error("orderId is required.");
      }

      return jsonWithDemoState(completeDemoPayment(body.orderId, store), store);
    }

    if (route === "fulfill") {
      const body = (await request.json()) as {
        orderId?: string;
      };

      if (!body.orderId) {
        throw new Error("orderId is required.");
      }

      return jsonWithDemoState(fulfillDemoOrder(body.orderId, store), store);
    }

    if (path.length === 3 && path[0] === "players" && path[2] === "spend") {
      return jsonWithDemoState(spendDemoTicket(path[1]!, store), store);
    }

    return jsonError(new Error(`Unknown demo API route: POST /api/${route}`), 404);
  } catch (error) {
    return jsonError(error);
  }
}
