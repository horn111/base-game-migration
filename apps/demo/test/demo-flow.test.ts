import { describe, expect, it } from "vitest";

import {
  completeDemoPayment,
  createDemoOrder,
  fulfillDemoOrder,
  resetDemoStore,
  spendDemoTicket,
} from "../src/lib/demo-store";
import { demoBuilderCode } from "../src/lib/demo-config";

describe("demo ticket-pack flow", () => {
  it("creates, completes, fulfills, deduplicates, and spends tickets", () => {
    resetDemoStore();

    const created = createDemoOrder("player_ada", "starter-ticket-pack");
    expect(created.order.status).toBe("pending");
    expect(created.order.attribution.builderCode).toBe(demoBuilderCode);
    expect(created.order.attribution.builderCodes).toEqual([demoBuilderCode]);
    expect(created.payment.status).toBe("pending");

    const completed = completeDemoPayment(created.order.id);
    expect(completed.payment.status).toBe("completed");

    const fulfilled = fulfillDemoOrder(created.order.id);
    expect(fulfilled.fulfillment.status).toBe("fulfilled");
    expect(fulfilled.snapshot.balances.balances.ticket).toBe(10);

    const duplicate = fulfillDemoOrder(created.order.id);
    expect(duplicate.fulfillment.status).toBe("duplicate_ignored");
    expect(duplicate.snapshot.balances.balances.ticket).toBe(10);

    const spend = spendDemoTicket("player_ada");
    expect(spend.spend.status).toBe("applied");
    expect(spend.snapshot.balances.balances.ticket).toBe(9);
  });

  it("returns a clear rejected state when spending without tickets", () => {
    resetDemoStore();

    const spend = spendDemoTicket("player_ada");

    expect(spend.spend.status).toBe("rejected");
    if (spend.spend.status !== "rejected") {
      throw new Error("Expected spend to be rejected.");
    }
    expect(spend.spend.reason).toBe("insufficient_balance");
  });
});
