import { createInMemoryLedgerStore } from "@base-game-migration/entitlements-core";
import { describe, expect, it } from "vitest";

import {
  alphaTicketCatalog,
  completeMockPayment,
  createAttributionIntent,
  createMockPayment,
  createOrder,
  fulfillOrder,
  validateCatalog,
  verifyPayment,
} from "../src/index.js";

const now = new Date("2026-07-01T12:00:00.000Z");

describe("payments-core", () => {
  it("validates catalog shape and duplicate item ids", () => {
    expect(() => validateCatalog(alphaTicketCatalog)).not.toThrow();
    expect(() => validateCatalog([alphaTicketCatalog[0]!, alphaTicketCatalog[0]!])).toThrow(
      "Duplicate catalog item id",
    );
  });

  it("creates an order with BAO attribution intent", () => {
    const order = createOrder({
      id: "order_1",
      playerId: "player_1",
      catalogItemId: "starter-ticket-pack",
      catalog: alphaTicketCatalog,
      attribution: {
        builderCode: "horn111",
      },
      now,
    });

    expect(order.status).toBe("pending");
    expect(order.grant).toEqual({ unit: "ticket", amount: 10 });
    expect(order.attribution.builderCodes).toEqual(["horn111"]);
    expect(order.attribution.mockDataSuffix).toMatch(/^0x/);
  });

  it("transitions a mock payment and verifies it", () => {
    const order = createOrder({
      id: "order_1",
      playerId: "player_1",
      catalogItemId: "starter-ticket-pack",
      catalog: alphaTicketCatalog,
      attribution: {
        builderCode: "horn111",
      },
      now,
    });
    const payment = completeMockPayment(createMockPayment({ id: "payment_1", order, now }), now);

    expect(verifyPayment({ order, payment, now })).toMatchObject({
      status: "completed",
      orderId: "order_1",
      paymentId: "payment_1",
    });
  });

  it("fulfills once and ignores duplicate fulfillment", () => {
    const ledger = createInMemoryLedgerStore({ clock: () => now });
    const order = createOrder({
      id: "order_1",
      playerId: "player_1",
      catalogItemId: "starter-ticket-pack",
      catalog: alphaTicketCatalog,
      attribution: {
        builderCode: "horn111",
      },
      now,
    });
    const payment = completeMockPayment(createMockPayment({ id: "payment_1", order, now }), now);
    const verification = verifyPayment({ order, payment, now });

    const fulfilled = fulfillOrder({ order, verification, ledger, now });
    const duplicate = fulfillOrder({ order, verification, ledger, now });

    expect(fulfilled.status).toBe("fulfilled");
    expect(duplicate.status).toBe("duplicate_ignored");
    expect(ledger.getBalance("player_1", "ticket")).toBe(10);
  });

  it("generates a deterministic mock attribution payload", () => {
    const intent = createAttributionIntent({
      builderCode: "horn111",
      registry: "canonical",
      source: "test",
    });

    expect(intent).toMatchObject({
      builderCode: "horn111",
      registry: "canonical",
      source: "test",
      builderCodes: ["horn111"],
    });
    expect(intent.mockDataSuffix).toMatch(/^0x[0-9a-f]+$/);
  });
});
