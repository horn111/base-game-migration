import type {
  EntitlementUnit,
  LedgerEvent,
  LedgerStore,
} from "@base-game-migration/entitlements-core";

export type PaymentCurrency = "USDC";

export type OrderStatus = "pending" | "paid" | "fulfilled" | "rejected";

export type MockPaymentStatus = "pending" | "completed" | "failed";

export interface MoneyAmount {
  amount: string;
  currency: PaymentCurrency;
}

export interface CatalogGrant {
  unit: EntitlementUnit;
  amount: number;
}

export interface CatalogItem {
  id: string;
  title: string;
  description: string;
  price: MoneyAmount;
  grant: CatalogGrant;
  tags?: string[];
}

export interface BuilderAttributionInput {
  builderCode: string;
  registry?: "canonical" | "custom";
  source?: string;
}

export interface BuilderAttributionIntent {
  builderCode: string;
  registry: "canonical" | "custom";
  source: string;
  builderCodes: string[];
  mockDataSuffix: `0x${string}`;
  note: string;
}

export interface GameOrder {
  id: string;
  playerId: string;
  catalogItemId: string;
  itemTitle: string;
  price: MoneyAmount;
  grant: CatalogGrant;
  status: OrderStatus;
  attribution: BuilderAttributionIntent;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  id?: string;
  playerId: string;
  catalogItemId: string;
  catalog: CatalogItem[];
  attribution: BuilderAttributionInput;
  now?: Date;
}

export interface MockPayment {
  id: string;
  orderId: string;
  playerId: string;
  amount: string;
  currency: PaymentCurrency;
  status: MockPaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export type PaymentProvider = "mock" | "base_pay";

export interface CreateMockPaymentInput {
  id?: string;
  order: GameOrder;
  now?: Date;
}

export interface PaymentVerificationInput {
  order: GameOrder;
  payment: MockPayment;
  now?: Date;
}

export type PaymentVerificationStatus =
  | "completed"
  | "pending"
  | "failed"
  | "not_found"
  | "mismatched_order"
  | "amount_mismatch"
  | "recipient_mismatch"
  | "sender_mismatch";

export interface PaymentVerificationResult {
  status: PaymentVerificationStatus;
  orderId: string;
  paymentId: string;
  amount: string;
  currency: PaymentCurrency;
  checkedAt: string;
  provider?: PaymentProvider;
  sender?: string;
  recipient?: string;
  reason?: string;
  testnet?: boolean;
}

export type BasePayStatusType = "pending" | "completed" | "failed" | "not_found";

export interface BasePayStatus {
  status: BasePayStatusType;
  id: string;
  message?: string;
  sender?: string;
  amount?: string;
  recipient?: string;
  reason?: string;
}

export interface BasePayStatusInput {
  id: string;
  testnet: boolean;
}

export type BasePayStatusReader = (input: BasePayStatusInput) => Promise<BasePayStatus>;

export interface VerifyBasePayPaymentInput {
  order: GameOrder;
  paymentId: string;
  expectedAmount: string;
  expectedRecipient: string;
  expectedSender?: string;
  statusReader: BasePayStatusReader;
  testnet?: boolean;
  now?: Date;
}

export interface FulfillOrderInput {
  order: GameOrder;
  verification: PaymentVerificationResult;
  ledger: LedgerStore;
  now?: Date;
}

export interface FulfillmentResult {
  status: "fulfilled" | "duplicate_ignored" | "rejected";
  orderId: string;
  paymentId: string;
  playerId: string;
  grant: CatalogGrant;
  ledgerEvent?: LedgerEvent;
  balance?: number;
  reason?: string;
}
