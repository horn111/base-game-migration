import {
  createInMemoryLedgerStore,
  type LedgerEvent,
  type LedgerStore,
} from "@base-game-migration/entitlements-core";
import {
  alphaTicketCatalog,
  completeMockPayment,
  createAttributionIntent,
  createMockPayment,
  createOrder,
  fulfillOrder,
  verifyBasePayPayment,
  verifyPayment,
  type BasePayStatusReader,
  type GameOrder,
  type MockPayment,
  type PaymentVerificationResult,
} from "@base-game-migration/payments-core";

import { demoBuilderCode } from "./demo-config";
import { getBaseScanTxUrl, getGrantDemoConfig, recordedBasePayProof } from "./grant-config";

export interface DemoPlayer {
  id: string;
  handle: string;
  role: string;
}

export interface DemoLogEntry {
  id: string;
  label: string;
  detail: string;
  status: "pending" | "completed" | "fulfilled" | "duplicate" | "rejected";
}

export interface DemoSnapshot {
  catalog: typeof alphaTicketCatalog;
  players: DemoPlayer[];
  selectedPlayerId: string;
  balances: ReturnType<LedgerStore["getBalances"]>;
  orders: GameOrder[];
  payments: MockPayment[];
  basePayProofs: DemoBasePayProof[];
  log: DemoLogEntry[];
  latestOrder?: GameOrder;
  latestPayment?: MockPayment;
  latestBasePayProof?: DemoBasePayProof;
  grant: ReturnType<typeof getGrantDemoConfig> & {
    basePayReady: boolean;
  };
}

export interface DemoBasePayProof {
  id: string;
  orderId: string;
  paymentId: string;
  playerId: string;
  amount: string;
  recipient: string;
  sender?: string;
  status: PaymentVerificationResult["status"];
  source: "live" | "recorded";
  testnet: boolean;
  explorerUrl: string;
  verification: PaymentVerificationResult;
  createdAt: string;
  updatedAt: string;
}

export interface DemoStore {
  ledger: LedgerStore;
  orders: Map<string, GameOrder>;
  payments: Map<string, MockPayment>;
  basePayProofs: Map<string, DemoBasePayProof>;
  log: DemoLogEntry[];
  orderCounter: number;
  paymentCounter: number;
  basePayCounter: number;
  spendCounter: number;
}

interface SerializedDemoOrder {
  id: string;
  playerId: string;
  catalogItemId: string;
  status: GameOrder["status"];
  createdAt: string;
  updatedAt: string;
  attribution?: GameOrder["attribution"];
  grant?: GameOrder["grant"];
  itemTitle?: string;
  price?: GameOrder["price"];
}

interface SerializedDemoPayment {
  id: string;
  orderId: string;
  status: MockPayment["status"];
  createdAt: string;
  updatedAt: string;
  amount?: MockPayment["amount"];
  currency?: MockPayment["currency"];
  playerId?: MockPayment["playerId"];
}

interface SerializedDemoBasePayProof {
  id?: string;
  orderId: string;
  paymentId: string;
  playerId: string;
  amount: string;
  recipient: string;
  sender?: string;
  status: PaymentVerificationResult["status"];
  source: DemoBasePayProof["source"];
  testnet: boolean;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  explorerUrl?: string;
  verification?: PaymentVerificationResult;
}

export interface SerializedDemoStore {
  version?: number;
  ledgerEvents: LedgerEvent[];
  orders: SerializedDemoOrder[];
  payments: SerializedDemoPayment[];
  basePayProofs: SerializedDemoBasePayProof[];
  log: DemoLogEntry[];
  orderCounter: number;
  paymentCounter: number;
  basePayCounter: number;
  spendCounter: number;
}

const players: DemoPlayer[] = [
  {
    id: "player_ada",
    handle: "Ada",
    role: "speedrunner",
  },
  {
    id: "player_max",
    handle: "Max",
    role: "raid tester",
  },
];

const globalForDemo = globalThis as typeof globalThis & {
  __baseGameMigrationDemo?: DemoStore;
};

function createDemoStore(): DemoStore {
  return {
    ledger: createInMemoryLedgerStore({
      eventIdPrefix: "demo_evt",
    }),
    basePayProofs: new Map<string, DemoBasePayProof>(),
    orders: new Map<string, GameOrder>(),
    payments: new Map<string, MockPayment>(),
    basePayCounter: 0,
    log: [],
    orderCounter: 0,
    paymentCounter: 0,
    spendCounter: 0,
  };
}

function safeDate(value?: string) {
  const date = value ? new Date(value) : new Date();

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function serializeOrder(order: GameOrder): SerializedDemoOrder {
  return {
    catalogItemId: order.catalogItemId,
    createdAt: order.createdAt,
    id: order.id,
    playerId: order.playerId,
    status: order.status,
    updatedAt: order.updatedAt,
  };
}

function hydrateOrder(order: SerializedDemoOrder): GameOrder {
  if (order.itemTitle && order.price && order.grant && order.attribution) {
    return order as GameOrder;
  }

  const hydrated = createOrder({
    id: order.id,
    playerId: order.playerId,
    catalogItemId: order.catalogItemId,
    catalog: alphaTicketCatalog,
    attribution: {
      builderCode: demoBuilderCode,
      source: "base-game-migration-demo",
    },
    now: safeDate(order.createdAt),
  });

  return {
    ...hydrated,
    status: order.status,
    updatedAt: order.updatedAt,
  };
}

function serializePayment(payment: MockPayment): SerializedDemoPayment {
  return {
    createdAt: payment.createdAt,
    id: payment.id,
    orderId: payment.orderId,
    status: payment.status,
    updatedAt: payment.updatedAt,
  };
}

function hydratePayment(
  payment: SerializedDemoPayment,
  orders: Map<string, GameOrder>,
): MockPayment | undefined {
  if (payment.amount && payment.currency && payment.playerId) {
    return payment as MockPayment;
  }

  const order = orders.get(payment.orderId);

  if (!order) {
    return undefined;
  }

  return {
    amount: order.price.amount,
    createdAt: payment.createdAt,
    currency: order.price.currency,
    id: payment.id,
    orderId: payment.orderId,
    playerId: order.playerId,
    status: payment.status,
    updatedAt: payment.updatedAt,
  };
}

function serializeBasePayProof(proof: DemoBasePayProof): SerializedDemoBasePayProof {
  return {
    amount: proof.amount,
    createdAt: proof.createdAt,
    id: proof.id,
    orderId: proof.orderId,
    paymentId: proof.paymentId,
    playerId: proof.playerId,
    reason: proof.verification.reason,
    recipient: proof.recipient,
    sender: proof.sender,
    source: proof.source,
    status: proof.status,
    testnet: proof.testnet,
    updatedAt: proof.updatedAt,
  };
}

function hydrateBasePayProof(proof: SerializedDemoBasePayProof): DemoBasePayProof {
  const createdAt = proof.createdAt;
  const updatedAt = proof.updatedAt;
  const verification =
    proof.verification ??
    ({
      amount: proof.amount,
      checkedAt: updatedAt,
      currency: "USDC",
      orderId: proof.orderId,
      paymentId: proof.paymentId,
      provider: "base_pay",
      reason: proof.reason,
      recipient: proof.recipient,
      sender: proof.sender,
      status: proof.status,
      testnet: proof.testnet,
    } satisfies PaymentVerificationResult);

  return {
    amount: proof.amount,
    createdAt,
    explorerUrl: proof.explorerUrl ?? getBaseScanTxUrl(proof.paymentId),
    id: proof.id ?? `demo_base_pay_${proof.paymentId.slice(-6)}`,
    orderId: proof.orderId,
    paymentId: proof.paymentId,
    playerId: proof.playerId,
    recipient: proof.recipient,
    sender: proof.sender,
    source: proof.source,
    status: proof.status,
    testnet: proof.testnet,
    updatedAt,
    verification,
  };
}

function serializeLogEntry(entry: DemoLogEntry): DemoLogEntry {
  return {
    ...entry,
    detail: entry.detail.length > 140 ? `${entry.detail.slice(0, 137)}...` : entry.detail,
  };
}

export function createDemoStoreFromState(state?: SerializedDemoStore): DemoStore {
  const store = createDemoStore();

  if (!state) {
    return store;
  }

  store.orderCounter = state.orderCounter ?? 0;
  store.paymentCounter = state.paymentCounter ?? 0;
  store.basePayCounter = state.basePayCounter ?? 0;
  store.spendCounter = state.spendCounter ?? 0;
  store.log = (state.log ?? []).slice(0, 6);

  for (const serializedOrder of state.orders ?? []) {
    const order = hydrateOrder(serializedOrder);
    store.orders.set(order.id, order);
  }

  for (const serializedPayment of state.payments ?? []) {
    const payment = hydratePayment(serializedPayment, store.orders);

    if (payment) {
      store.payments.set(payment.id, payment);
    }
  }

  for (const serializedProof of state.basePayProofs ?? []) {
    const proof = hydrateBasePayProof(serializedProof);
    store.basePayProofs.set(proof.paymentId, proof);
  }

  for (const event of state.ledgerEvents ?? []) {
    const input = {
      playerId: event.playerId,
      unit: event.unit,
      amount: event.amount,
      reason: event.reason,
      sourceId: event.sourceId,
      idempotencyKey: event.idempotencyKey,
      now: new Date(event.createdAt),
    };

    if (event.direction === "credit") {
      store.ledger.creditBalance(input);
    } else {
      store.ledger.spendBalance(input);
    }
  }

  normalizeDemoStore(store);
  return store;
}

export function serializeDemoStore(store: DemoStore): SerializedDemoStore {
  return {
    version: 2,
    ledgerEvents: store.ledger.listEvents().slice(-6),
    basePayProofs: [...store.basePayProofs.values()].slice(-2).map(serializeBasePayProof),
    orders: [...store.orders.values()].slice(-2).map(serializeOrder),
    payments: [...store.payments.values()].slice(-2).map(serializePayment),
    basePayCounter: store.basePayCounter,
    log: store.log.slice(0, 6).map(serializeLogEntry),
    orderCounter: store.orderCounter,
    paymentCounter: store.paymentCounter,
    spendCounter: store.spendCounter,
  };
}

function normalizeDemoStore(store: DemoStore) {
  for (const [orderId, order] of store.orders) {
    if (
      order.attribution.source === "base-game-migration-demo" &&
      order.attribution.builderCode !== demoBuilderCode
    ) {
      store.orders.set(orderId, {
        ...order,
        attribution: createAttributionIntent({
          builderCode: demoBuilderCode,
          registry: order.attribution.registry,
          source: order.attribution.source,
        }),
      });
    }
  }
}

export function getDemoStore() {
  globalForDemo.__baseGameMigrationDemo ??= createDemoStore();
  normalizeDemoStore(globalForDemo.__baseGameMigrationDemo);
  return globalForDemo.__baseGameMigrationDemo;
}

export function resetDemoStore() {
  globalForDemo.__baseGameMigrationDemo = createDemoStore();
  return getDemoSnapshot(players[0]!.id);
}

function pushLog(store: DemoStore, entry: Omit<DemoLogEntry, "id">) {
  const nextId = `log_${(store.log.length + 1).toString().padStart(4, "0")}`;
  store.log = [{ id: nextId, ...entry }, ...store.log].slice(0, 8);
}

export function getDemoSnapshot(
  playerId = players[0]!.id,
  store: DemoStore = getDemoStore(),
): DemoSnapshot {
  const orders = [...store.orders.values()];
  const payments = [...store.payments.values()];
  const basePayProofs = [...store.basePayProofs.values()];
  const latestOrder = orders.at(-1);
  const latestPayment = latestOrder
    ? payments.find((payment) => payment.orderId === latestOrder.id)
    : undefined;
  const latestBasePayProof = latestOrder
    ? basePayProofs.filter((proof) => proof.orderId === latestOrder.id).at(-1)
    : basePayProofs.at(-1);
  const grant = getGrantDemoConfig();

  return {
    catalog: alphaTicketCatalog,
    players,
    selectedPlayerId: playerId,
    balances: store.ledger.getBalances(playerId),
    orders,
    payments,
    basePayProofs,
    log: store.log,
    latestOrder,
    latestPayment,
    latestBasePayProof,
    grant: {
      ...grant,
      basePayReady: Boolean(grant.receiverAddress),
    },
  };
}

export function createDemoOrder(
  playerId: string,
  catalogItemId: string,
  store: DemoStore = getDemoStore(),
) {
  store.orderCounter += 1;
  store.paymentCounter += 1;

  const order = createOrder({
    id: `demo_order_${store.orderCounter.toString().padStart(4, "0")}`,
    playerId,
    catalogItemId,
    catalog: alphaTicketCatalog,
    attribution: {
      builderCode: demoBuilderCode,
      source: "base-game-migration-demo",
    },
  });
  const payment = createMockPayment({
    id: `demo_payment_${store.paymentCounter.toString().padStart(4, "0")}`,
    order,
  });

  store.orders.set(order.id, order);
  store.payments.set(payment.id, payment);
  pushLog(store, {
    label: "Order created",
    detail: `${order.itemTitle} reserved for ${order.playerId}.`,
    status: "pending",
  });

  return {
    order,
    payment,
    snapshot: getDemoSnapshot(playerId, store),
  };
}

export function completeDemoPayment(orderId: string, store: DemoStore = getDemoStore()) {
  const order = store.orders.get(orderId);

  if (!order) {
    throw new Error(`Unknown order: ${orderId}.`);
  }

  const payment = [...store.payments.values()].find((candidate) => candidate.orderId === orderId);

  if (!payment) {
    throw new Error(`No payment found for order: ${orderId}.`);
  }

  const completedPayment = completeMockPayment(payment);
  const paidOrder: GameOrder = {
    ...order,
    status: "paid",
    updatedAt: completedPayment.updatedAt,
  };
  store.orders.set(order.id, paidOrder);
  store.payments.set(payment.id, completedPayment);
  pushLog(store, {
    label: "Mock payment completed",
    detail: `${completedPayment.amount} ${completedPayment.currency} marked completed.`,
    status: "completed",
  });

  return {
    order: paidOrder,
    payment: completedPayment,
    snapshot: getDemoSnapshot(order.playerId, store),
  };
}

export function fulfillDemoOrder(orderId: string, store: DemoStore = getDemoStore()) {
  const order = store.orders.get(orderId);

  if (!order) {
    throw new Error(`Unknown order: ${orderId}.`);
  }

  const payment = [...store.payments.values()].find((candidate) => candidate.orderId === orderId);

  if (!payment) {
    throw new Error(`No payment found for order: ${orderId}.`);
  }

  const verification = verifyPayment({ order, payment });
  const fulfillment = fulfillOrder({
    order,
    verification,
    ledger: store.ledger,
  });
  const status = fulfillment.status === "fulfilled" ? "fulfilled" : order.status;
  const fulfilledOrder: GameOrder = {
    ...order,
    status,
    updatedAt: new Date().toISOString(),
  };
  store.orders.set(order.id, fulfilledOrder);
  pushLog(store, {
    label:
      fulfillment.status === "duplicate_ignored"
        ? "Duplicate fulfillment ignored"
        : "Order fulfilled",
    detail:
      fulfillment.status === "duplicate_ignored"
        ? `${payment.id} was already credited.`
        : `${order.grant.amount} ${order.grant.unit} credited to ${order.playerId}.`,
    status: fulfillment.status === "duplicate_ignored" ? "duplicate" : "fulfilled",
  });

  return {
    order: fulfilledOrder,
    payment,
    fulfillment,
    snapshot: getDemoSnapshot(order.playerId, store),
  };
}

function createBasePayProof(params: {
  order: GameOrder;
  verification: PaymentVerificationResult;
  source: DemoBasePayProof["source"];
  store: DemoStore;
}): DemoBasePayProof {
  params.store.basePayCounter += 1;
  const now = new Date().toISOString();

  return {
    amount: params.verification.amount,
    createdAt: now,
    explorerUrl: getBaseScanTxUrl(params.verification.paymentId),
    id: `demo_base_pay_${params.store.basePayCounter.toString().padStart(4, "0")}`,
    orderId: params.order.id,
    paymentId: params.verification.paymentId,
    playerId: params.order.playerId,
    recipient: params.verification.recipient ?? "",
    sender: params.verification.sender,
    source: params.source,
    status: params.verification.status,
    testnet: params.verification.testnet ?? false,
    updatedAt: now,
    verification: params.verification,
  };
}

export async function verifyDemoBasePayPayment(
  input: {
    orderId: string;
    paymentId: string;
    payerAddress?: string;
    expectedAmount?: string;
    expectedRecipient?: string;
    source?: DemoBasePayProof["source"];
    statusReader?: BasePayStatusReader;
  },
  store: DemoStore = getDemoStore(),
) {
  const order = store.orders.get(input.orderId);

  if (!order) {
    throw new Error(`Unknown order: ${input.orderId}.`);
  }

  const grant = getGrantDemoConfig();

  const expectedAmount = input.expectedAmount ?? grant.amount;
  const expectedRecipient = input.expectedRecipient ?? grant.receiverAddress;

  if (!expectedRecipient) {
    throw new Error("NEXT_PUBLIC_BGM_RECEIVER_ADDRESS is required for real Base Pay mode.");
  }

  const existingProof = store.basePayProofs.get(input.paymentId);

  if (existingProof && existingProof.orderId !== order.id) {
    throw new Error(`Base Pay payment ${input.paymentId} is already attached to another order.`);
  }

  if (existingProof) {
    pushLog(store, {
      detail: `${input.paymentId} was already checked for ${order.id}.`,
      label: "Duplicate Base Pay proof ignored",
      status: "duplicate",
    });

    return {
      order,
      proof: existingProof,
      snapshot: getDemoSnapshot(order.playerId, store),
      verification: existingProof.verification,
    };
  }

  const verification = await verifyBasePayPayment({
    expectedAmount,
    expectedRecipient,
    expectedSender: input.payerAddress,
    order,
    paymentId: input.paymentId,
    statusReader:
      input.statusReader ??
      (async () => {
        throw new Error("A Base Pay status reader is required for live verification.");
      }),
    testnet: false,
  });
  const proof = createBasePayProof({
    order,
    source: input.source ?? "live",
    store,
    verification,
  });
  store.basePayProofs.set(proof.paymentId, proof);

  if (verification.status === "completed") {
    store.orders.set(order.id, {
      ...order,
      status: "paid",
      updatedAt: verification.checkedAt,
    });
  }

  pushLog(store, {
    detail:
      verification.status === "completed"
        ? `${verification.amount} USDC verified on Base mainnet.`
        : (verification.reason ?? `Base Pay status: ${verification.status}.`),
    label:
      verification.status === "completed" ? "Base Pay proof verified" : "Base Pay proof rejected",
    status: verification.status === "completed" ? "completed" : "rejected",
  });

  return {
    order: store.orders.get(order.id) ?? order,
    proof,
    snapshot: getDemoSnapshot(order.playerId, store),
    verification,
  };
}

export async function replayRecordedBasePayProof(
  orderId: string,
  store: DemoStore = getDemoStore(),
) {
  const order = store.orders.get(orderId);

  if (!order) {
    throw new Error(`Unknown order: ${orderId}.`);
  }

  return verifyDemoBasePayPayment(
    {
      expectedAmount: recordedBasePayProof.amount,
      expectedRecipient: recordedBasePayProof.recipientAddress,
      orderId,
      payerAddress: recordedBasePayProof.payerAddress,
      paymentId: recordedBasePayProof.paymentId,
      source: "recorded",
      statusReader: async () => ({
        amount: recordedBasePayProof.amount,
        id: recordedBasePayProof.paymentId,
        recipient: recordedBasePayProof.recipientAddress,
        sender: recordedBasePayProof.payerAddress,
        status: "completed",
      }),
    },
    store,
  );
}

export function fulfillDemoBasePayOrder(orderId: string, store: DemoStore = getDemoStore()) {
  const order = store.orders.get(orderId);

  if (!order) {
    throw new Error(`Unknown order: ${orderId}.`);
  }

  const proof = [...store.basePayProofs.values()]
    .filter((candidate) => candidate.orderId === order.id && candidate.status === "completed")
    .at(-1);

  if (!proof) {
    throw new Error(`No completed Base Pay proof found for order: ${orderId}.`);
  }

  const fulfillment = fulfillOrder({
    ledger: store.ledger,
    order,
    verification: proof.verification,
  });
  const fulfilledOrder: GameOrder = {
    ...order,
    status: fulfillment.status === "fulfilled" ? "fulfilled" : order.status,
    updatedAt: new Date().toISOString(),
  };
  store.orders.set(order.id, fulfilledOrder);
  pushLog(store, {
    detail:
      fulfillment.status === "duplicate_ignored"
        ? `${proof.paymentId} was already credited.`
        : `${order.grant.amount} ${order.grant.unit} credited after Base Pay verification.`,
    label:
      fulfillment.status === "duplicate_ignored"
        ? "Duplicate fulfillment ignored"
        : "Base Pay order fulfilled",
    status: fulfillment.status === "duplicate_ignored" ? "duplicate" : "fulfilled",
  });

  return {
    fulfillment,
    order: fulfilledOrder,
    proof,
    snapshot: getDemoSnapshot(order.playerId, store),
  };
}

export function spendDemoTicket(playerId: string, store: DemoStore = getDemoStore()) {
  store.spendCounter += 1;

  const result = store.ledger.spendBalance({
    playerId,
    unit: "ticket",
    amount: 1,
    reason: "continue",
    sourceId: `demo_run_${store.spendCounter.toString().padStart(4, "0")}`,
    idempotencyKey: `demo_spend_${store.spendCounter.toString().padStart(4, "0")}`,
  });

  pushLog(store, {
    label: result.status === "applied" ? "Ticket spent" : "Spend rejected",
    detail:
      result.status === "applied"
        ? `1 ticket consumed. Balance: ${result.balance}.`
        : `Need 1 ticket. Current balance: ${result.balance}.`,
    status: result.status === "applied" ? "fulfilled" : "rejected",
  });

  return {
    spend: result,
    snapshot: getDemoSnapshot(playerId, store),
  };
}
