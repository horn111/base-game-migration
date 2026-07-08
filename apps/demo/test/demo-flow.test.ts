import { describe, expect, it } from "vitest";

import {
  completeDemoPayment,
  createDemoStoreFromState,
  createDemoOrder,
  fulfillDemoBasePayOrder,
  fulfillDemoOrder,
  getDemoSnapshot,
  replayRecordedBasePayProof,
  resetDemoStore,
  serializeDemoStore,
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

  it("hydrates ticket balances from serialized demo session state", () => {
    const store = createDemoStoreFromState();
    const created = createDemoOrder("player_ada", "starter-ticket-pack", store);
    completeDemoPayment(created.order.id, store);
    fulfillDemoOrder(created.order.id, store);

    const restoredStore = createDemoStoreFromState(serializeDemoStore(store));

    expect(getDemoSnapshot("player_ada", restoredStore).balances.balances.ticket).toBe(10);
    expect(spendDemoTicket("player_ada", restoredStore).snapshot.balances.balances.ticket).toBe(9);
  });

  it("replays a recorded Base Pay proof and fulfills without double-crediting", async () => {
    const store = createDemoStoreFromState();
    const created = createDemoOrder("player_ada", "starter-ticket-pack", store);
    const verified = await replayRecordedBasePayProof(created.order.id, store);

    expect(verified.verification.status).toBe("completed");
    expect(verified.proof.source).toBe("recorded");
    expect(verified.snapshot.latestBasePayProof?.status).toBe("completed");

    const fulfilled = fulfillDemoBasePayOrder(created.order.id, store);
    const duplicate = fulfillDemoBasePayOrder(created.order.id, store);

    expect(fulfilled.fulfillment.status).toBe("fulfilled");
    expect(duplicate.fulfillment.status).toBe("duplicate_ignored");
    expect(duplicate.snapshot.balances.balances.ticket).toBe(10);

    const spend = spendDemoTicket("player_ada", store);
    expect(spend.snapshot.balances.balances.ticket).toBe(9);
  });

  it("hydrates recorded Base Pay proof state from serialized demo session state", async () => {
    const store = createDemoStoreFromState();
    const created = createDemoOrder("player_ada", "starter-ticket-pack", store);
    await replayRecordedBasePayProof(created.order.id, store);

    const restoredStore = createDemoStoreFromState(serializeDemoStore(store));
    const snapshot = getDemoSnapshot("player_ada", restoredStore);

    expect(snapshot.latestBasePayProof?.source).toBe("recorded");
    expect(snapshot.latestBasePayProof?.status).toBe("completed");
  });

  it("keeps the recorded grant flow session under the browser cookie limit", async () => {
    const store = createDemoStoreFromState();
    const created = createDemoOrder("player_ada", "starter-ticket-pack", store);

    await replayRecordedBasePayProof(created.order.id, store);
    fulfillDemoBasePayOrder(created.order.id, store);
    fulfillDemoBasePayOrder(created.order.id, store);
    spendDemoTicket("player_ada", store);

    const encoded = Buffer.from(JSON.stringify(serializeDemoStore(store)), "utf8").toString(
      "base64url",
    );

    expect(encoded.length).toBeLessThan(4096);
  });
});
