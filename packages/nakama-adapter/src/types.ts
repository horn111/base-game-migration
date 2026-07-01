import type { LedgerEvent, SpendBalanceResult } from "@base-game-migration/entitlements-core";
import type { FulfillmentResult } from "@base-game-migration/payments-core";

export interface NakamaWalletUpdate {
  userId: string;
  changeset: Record<string, number>;
  metadata: Record<string, string | number | boolean>;
}

export interface NakamaWalletReceipt {
  update: NakamaWalletUpdate;
  accepted: boolean;
}

export interface NakamaWalletWriter {
  updateWallet(update: NakamaWalletUpdate): Promise<NakamaWalletReceipt>;
}

export interface NakamaBgmAdapterOptions {
  wallet: NakamaWalletWriter;
}

export interface NakamaBgmAdapter {
  creditFromFulfillment(result: FulfillmentResult): Promise<NakamaWalletReceipt>;
  debitFromSpend(result: SpendBalanceResult): Promise<NakamaWalletReceipt>;
  rpcNames: {
    createOrder: "bgm_create_order";
    fulfillPayment: "bgm_fulfill_payment";
    getBalance: "bgm_get_balance";
    spendTicket: "bgm_spend_ticket";
  };
}

export interface NakamaRpcResponse<T> {
  ok: boolean;
  result?: T;
  error?: {
    code: string;
    message: string;
  };
}

export type WalletEventLike = Pick<
  LedgerEvent,
  | "amount"
  | "balanceAfter"
  | "direction"
  | "id"
  | "playerId"
  | "reason"
  | "sourceId"
  | "status"
  | "unit"
>;
