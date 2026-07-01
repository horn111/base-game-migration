import type {
  NakamaBgmAdapter,
  NakamaBgmAdapterOptions,
  NakamaRpcResponse,
  NakamaWalletUpdate,
  WalletEventLike,
} from "./types";

export const nakamaBgmRpcNames = {
  createOrder: "bgm_create_order",
  fulfillPayment: "bgm_fulfill_payment",
  getBalance: "bgm_get_balance",
  spendTicket: "bgm_spend_ticket",
} as const;

export function ledgerEventToWalletUpdate(event: WalletEventLike): NakamaWalletUpdate {
  const signedAmount = event.direction === "credit" ? event.amount : -event.amount;

  return {
    userId: event.playerId,
    changeset: {
      [`bgm_${event.unit}`]: signedAmount,
    },
    metadata: {
      bgm_event_id: event.id,
      bgm_event_status: event.status,
      bgm_reason: event.reason,
      bgm_source_id: event.sourceId,
      bgm_unit: event.unit,
      bgm_balance_after: event.balanceAfter,
    },
  };
}

export function toRpcResponse<T>(operation: () => T): NakamaRpcResponse<T> {
  try {
    return {
      ok: true,
      result: operation(),
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "bgm_adapter_error",
        message: error instanceof Error ? error.message : "Unknown Nakama adapter error.",
      },
    };
  }
}

export function createNakamaBgmAdapter(options: NakamaBgmAdapterOptions): NakamaBgmAdapter {
  return {
    rpcNames: nakamaBgmRpcNames,

    async creditFromFulfillment(result) {
      if (!result.ledgerEvent) {
        throw new Error(`Cannot credit Nakama wallet for ${result.status} fulfillment.`);
      }

      return options.wallet.updateWallet(ledgerEventToWalletUpdate(result.ledgerEvent));
    },

    async debitFromSpend(result) {
      if (result.status !== "applied") {
        throw new Error(`Cannot debit Nakama wallet for ${result.status} spend.`);
      }

      return options.wallet.updateWallet(ledgerEventToWalletUpdate(result.event));
    },
  };
}
