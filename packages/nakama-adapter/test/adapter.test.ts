import { createInMemoryLedgerStore } from "@base-game-migration/entitlements-core";
import {
  alphaTicketCatalog,
  completeMockPayment,
  createMockPayment,
  createOrder,
  fulfillOrder,
  verifyPayment,
} from "@base-game-migration/payments-core";
import { describe, expect, it, vi } from "vitest";

import {
  createNakamaBgmAdapter,
  ledgerEventToWalletUpdate,
  nakamaBgmRpcNames,
  toRpcResponse,
} from "../src/index.js";

const now = new Date("2026-07-01T12:00:00.000Z");

describe("nakama-adapter", () => {
  it("maps fulfillment ledger events to Nakama wallet credits", () => {
    const event = {
      id: "evt_1",
      playerId: "player_1",
      unit: "ticket",
      amount: 10,
      direction: "credit",
      reason: "ticket_pack_fulfillment",
      sourceId: "payment_1",
      idempotencyKey: "fulfillment:payment_1",
      balanceAfter: 10,
      status: "applied",
      createdAt: now.toISOString(),
    } as const;

    expect(ledgerEventToWalletUpdate(event)).toEqual({
      userId: "player_1",
      changeset: {
        bgm_ticket: 10,
      },
      metadata: {
        bgm_balance_after: 10,
        bgm_event_id: "evt_1",
        bgm_event_status: "applied",
        bgm_reason: "ticket_pack_fulfillment",
        bgm_source_id: "payment_1",
        bgm_unit: "ticket",
      },
    });
  });

  it("writes wallet credits from a fulfillment result", async () => {
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
    const result = fulfillOrder({
      order,
      verification: verifyPayment({ order, payment, now }),
      ledger,
      now,
    });
    const updateWallet = vi.fn(async (update) => ({
      update,
      accepted: true,
    }));
    const adapter = createNakamaBgmAdapter({
      wallet: {
        updateWallet,
      },
    });

    const receipt = await adapter.creditFromFulfillment(result);

    expect(receipt.accepted).toBe(true);
    expect(updateWallet).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "player_1",
        changeset: {
          bgm_ticket: 10,
        },
      }),
    );
  });

  it("maps spend events to wallet debits", async () => {
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
    const updateWallet = vi.fn(async (update) => ({
      update,
      accepted: true,
    }));
    const adapter = createNakamaBgmAdapter({
      wallet: {
        updateWallet,
      },
    });

    await adapter.debitFromSpend(spend);

    expect(updateWallet).toHaveBeenCalledWith(
      expect.objectContaining({
        changeset: {
          bgm_ticket: -1,
        },
      }),
    );
  });

  it("exposes the alpha RPC names and maps adapter errors", () => {
    expect(nakamaBgmRpcNames).toEqual({
      createOrder: "bgm_create_order",
      fulfillPayment: "bgm_fulfill_payment",
      getBalance: "bgm_get_balance",
      spendTicket: "bgm_spend_ticket",
    });

    const response = toRpcResponse(() => {
      throw new Error("bad payload");
    });

    expect(response).toEqual({
      ok: false,
      error: {
        code: "bgm_adapter_error",
        message: "bad payload",
      },
    });
  });
});
