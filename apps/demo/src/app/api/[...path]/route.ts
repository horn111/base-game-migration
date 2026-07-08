import {
  completeDemoPayment,
  createDemoStoreFromState,
  createDemoOrder,
  fulfillDemoOrder,
  fulfillDemoBasePayOrder,
  getDemoSnapshot,
  replayRecordedBasePayProof,
  spendDemoTicket,
  verifyDemoBasePayPayment,
} from "../../../lib/demo-store";
import { readLiveBasePayStatus } from "../../../lib/base-pay-status";
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

    if (route === "grant/base-pay/verify") {
      const body = (await request.json()) as {
        orderId?: string;
        paymentId?: string;
        payerAddress?: string;
      };

      if (!body.orderId || !body.paymentId) {
        throw new Error("orderId and paymentId are required.");
      }

      return jsonWithDemoState(
        await verifyDemoBasePayPayment(
          {
            orderId: body.orderId,
            payerAddress: body.payerAddress,
            paymentId: body.paymentId,
            statusReader: readLiveBasePayStatus,
          },
          store,
        ),
        store,
      );
    }

    if (route === "grant/base-pay/replay") {
      const body = (await request.json()) as {
        orderId?: string;
      };

      if (!body.orderId) {
        throw new Error("orderId is required.");
      }

      return jsonWithDemoState(await replayRecordedBasePayProof(body.orderId, store), store);
    }

    if (route === "grant/fulfill") {
      const body = (await request.json()) as {
        orderId?: string;
      };

      if (!body.orderId) {
        throw new Error("orderId is required.");
      }

      return jsonWithDemoState(fulfillDemoBasePayOrder(body.orderId, store), store);
    }

    if (route === "grant/reset") {
      const resetStore = createDemoStoreFromState();

      return jsonWithDemoState({ snapshot: getDemoSnapshot("player_ada", resetStore) }, resetStore);
    }

    if (path.length === 3 && path[0] === "players" && path[2] === "spend") {
      return jsonWithDemoState(spendDemoTicket(path[1]!, store), store);
    }

    return jsonError(new Error(`Unknown demo API route: POST /api/${route}`), 404);
  } catch (error) {
    return jsonError(error);
  }
}
