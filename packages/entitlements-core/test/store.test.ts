import { describe, expect, it } from "vitest";

import { createInMemoryLedgerStore } from "../src/index.js";

const now = new Date("2026-07-01T12:00:00.000Z");

describe("createInMemoryLedgerStore", () => {
  it("credits and reads a ticket balance", () => {
    const ledger = createInMemoryLedgerStore({ clock: () => now });

    const result = ledger.creditBalance({
      playerId: "player_1",
      unit: "ticket",
      amount: 10,
      reason: "ticket_pack_fulfillment",
      sourceId: "payment_1",
      idempotencyKey: "payment_1",
    });

    expect(result.status).toBe("applied");
    expect(result.balance).toBe(10);
    expect(result.event.createdAt).toBe(now.toISOString());
    expect(ledger.getBalance("player_1", "ticket")).toBe(10);
  });

  it("ignores duplicate credits with the same idempotency key", () => {
    const ledger = createInMemoryLedgerStore();

    ledger.creditBalance({
      playerId: "player_1",
      unit: "ticket",
      amount: 10,
      reason: "ticket_pack_fulfillment",
      sourceId: "payment_1",
      idempotencyKey: "payment_1",
    });

    const duplicate = ledger.creditBalance({
      playerId: "player_1",
      unit: "ticket",
      amount: 10,
      reason: "ticket_pack_fulfillment",
      sourceId: "payment_1",
      idempotencyKey: "payment_1",
    });

    expect(duplicate.status).toBe("duplicate_ignored");
    expect(duplicate.balance).toBe(10);
    expect(ledger.listEvents("player_1")).toHaveLength(1);
  });

  it("spends tickets and rejects insufficient balances", () => {
    const ledger = createInMemoryLedgerStore();

    ledger.creditBalance({
      playerId: "player_1",
      unit: "ticket",
      amount: 2,
      reason: "ticket_pack_fulfillment",
      sourceId: "payment_1",
      idempotencyKey: "payment_1",
    });

    const spend = ledger.spendBalance({
      playerId: "player_1",
      unit: "ticket",
      amount: 1,
      reason: "continue",
      sourceId: "run_1",
      idempotencyKey: "spend_1",
    });

    expect(spend.status).toBe("applied");
    expect(spend.balance).toBe(1);

    const rejected = ledger.spendBalance({
      playerId: "player_1",
      unit: "ticket",
      amount: 2,
      reason: "continue",
      sourceId: "run_2",
      idempotencyKey: "spend_2",
    });

    expect(rejected.status).toBe("rejected");
    if (rejected.status !== "rejected") {
      throw new Error("Expected spend to be rejected.");
    }
    expect(rejected.reason).toBe("insufficient_balance");
    expect(rejected.balance).toBe(1);
  });
});
