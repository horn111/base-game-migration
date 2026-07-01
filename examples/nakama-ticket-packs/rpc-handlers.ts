import {
  createInMemoryLedgerStore,
  type LedgerStore,
} from "@base-game-migration/entitlements-core";
import {
  alphaTicketCatalog,
  completeMockPayment,
  createMockPayment,
  createOrder,
  fulfillOrder,
  verifyPayment,
  type GameOrder,
  type MockPayment,
} from "@base-game-migration/payments-core";
import {
  createNakamaBgmAdapter,
  type NakamaWalletWriter,
} from "@base-game-migration/nakama-adapter";

interface ExampleState {
  ledger: LedgerStore;
  orders: Map<string, GameOrder>;
  payments: Map<string, MockPayment>;
}

const state: ExampleState = {
  ledger: createInMemoryLedgerStore(),
  orders: new Map(),
  payments: new Map(),
};

export function createExampleHandlers(wallet: NakamaWalletWriter) {
  const adapter = createNakamaBgmAdapter({ wallet });

  return {
    bgm_create_order(playerId: string, catalogItemId = "starter-ticket-pack") {
      const order = createOrder({
        id: `nakama_order_${state.orders.size + 1}`,
        playerId,
        catalogItemId,
        catalog: alphaTicketCatalog,
        attribution: {
          builderCode: "horn111",
          source: "nakama-ticket-packs-example",
        },
      });
      const payment = createMockPayment({
        id: `nakama_payment_${state.payments.size + 1}`,
        order,
      });

      state.orders.set(order.id, order);
      state.payments.set(payment.id, payment);

      return { order, payment };
    },

    async bgm_fulfill_payment(orderId: string) {
      const order = state.orders.get(orderId);

      if (!order) {
        throw new Error(`Unknown order: ${orderId}.`);
      }

      const payment = [...state.payments.values()].find(
        (candidate) => candidate.orderId === orderId,
      );

      if (!payment) {
        throw new Error(`No payment found for order: ${orderId}.`);
      }

      const completedPayment = completeMockPayment(payment);
      state.payments.set(payment.id, completedPayment);
      const fulfillment = fulfillOrder({
        order,
        verification: verifyPayment({ order, payment: completedPayment }),
        ledger: state.ledger,
      });
      const walletReceipt = await adapter.creditFromFulfillment(fulfillment);

      return { fulfillment, walletReceipt };
    },

    bgm_get_balance(playerId: string) {
      return state.ledger.getBalances(playerId);
    },

    async bgm_spend_ticket(playerId: string, sourceId: string) {
      const spend = state.ledger.spendBalance({
        playerId,
        unit: "ticket",
        amount: 1,
        reason: "continue",
        sourceId,
        idempotencyKey: `spend:${sourceId}`,
      });
      const walletReceipt =
        spend.status === "applied" ? await adapter.debitFromSpend(spend) : undefined;

      return { spend, walletReceipt };
    },
  };
}
