export type EntitlementUnit = "ticket" | "soft_currency" | "unlock";

export type LedgerDirection = "credit" | "debit";

export type LedgerEventStatus = "applied" | "duplicate_ignored" | "rejected";

export interface LedgerEvent {
  id: string;
  playerId: string;
  unit: EntitlementUnit;
  amount: number;
  direction: LedgerDirection;
  reason: string;
  sourceId: string;
  idempotencyKey: string;
  balanceAfter: number;
  status: LedgerEventStatus;
  createdAt: string;
}

export interface LedgerMutationInput {
  playerId: string;
  unit: EntitlementUnit;
  amount: number;
  reason: string;
  sourceId: string;
  idempotencyKey: string;
  now?: Date;
}

export interface LedgerMutationResult {
  status: "applied" | "duplicate_ignored";
  event: LedgerEvent;
  balance: number;
}

export interface SpendRejectedResult {
  status: "rejected";
  reason: "insufficient_balance" | "invalid_amount";
  balance: number;
  event: LedgerEvent;
}

export type SpendBalanceResult = LedgerMutationResult | SpendRejectedResult;

export interface BalanceSnapshot {
  playerId: string;
  balances: Partial<Record<EntitlementUnit, number>>;
}

export interface LedgerStore {
  creditBalance(input: LedgerMutationInput): LedgerMutationResult;
  spendBalance(input: LedgerMutationInput): SpendBalanceResult;
  getBalance(playerId: string, unit: EntitlementUnit): number;
  getBalances(playerId: string): BalanceSnapshot;
  listEvents(playerId?: string): LedgerEvent[];
}

export interface InMemoryLedgerStoreOptions {
  clock?: () => Date;
  eventIdPrefix?: string;
}
