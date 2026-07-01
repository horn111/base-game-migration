import {
  createInMemoryLedgerStore,
  type LedgerStore,
} from "@base-game-migration/entitlements-core";
import {
  alphaTicketCatalog,
  completeMockPayment,
  createAttributionIntent,
  createMockPayment,
  createOrder,
  fulfillOrder,
  verifyPayment,
  type GameOrder,
  type MockPayment,
} from "@base-game-migration/payments-core";

import { demoBuilderCode } from "./demo-config";

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
  log: DemoLogEntry[];
  latestOrder?: GameOrder;
  latestPayment?: MockPayment;
}

interface DemoStore {
  ledger: LedgerStore;
  orders: Map<string, GameOrder>;
  payments: Map<string, MockPayment>;
  log: DemoLogEntry[];
  orderCounter: number;
  paymentCounter: number;
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
    orders: new Map<string, GameOrder>(),
    payments: new Map<string, MockPayment>(),
    log: [],
    orderCounter: 0,
    paymentCounter: 0,
    spendCounter: 0,
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

function pushLog(entry: Omit<DemoLogEntry, "id">) {
  const store = getDemoStore();
  const nextId = `log_${(store.log.length + 1).toString().padStart(4, "0")}`;
  store.log = [{ id: nextId, ...entry }, ...store.log].slice(0, 8);
}

export function getDemoSnapshot(playerId = players[0]!.id): DemoSnapshot {
  const store = getDemoStore();
  const orders = [...store.orders.values()];
  const payments = [...store.payments.values()];
  const latestOrder = orders.at(-1);
  const latestPayment = latestOrder
    ? payments.find((payment) => payment.orderId === latestOrder.id)
    : undefined;

  return {
    catalog: alphaTicketCatalog,
    players,
    selectedPlayerId: playerId,
    balances: store.ledger.getBalances(playerId),
    orders,
    payments,
    log: store.log,
    latestOrder,
    latestPayment,
  };
}

export function createDemoOrder(playerId: string, catalogItemId: string) {
  const store = getDemoStore();
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
  pushLog({
    label: "Order created",
    detail: `${order.itemTitle} reserved for ${order.playerId}.`,
    status: "pending",
  });

  return {
    order,
    payment,
    snapshot: getDemoSnapshot(playerId),
  };
}

export function completeDemoPayment(orderId: string) {
  const store = getDemoStore();
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
  pushLog({
    label: "Mock payment completed",
    detail: `${completedPayment.amount} ${completedPayment.currency} marked completed.`,
    status: "completed",
  });

  return {
    order: paidOrder,
    payment: completedPayment,
    snapshot: getDemoSnapshot(order.playerId),
  };
}

export function fulfillDemoOrder(orderId: string) {
  const store = getDemoStore();
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
  pushLog({
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
    snapshot: getDemoSnapshot(order.playerId),
  };
}

export function spendDemoTicket(playerId: string) {
  const store = getDemoStore();
  store.spendCounter += 1;

  const result = store.ledger.spendBalance({
    playerId,
    unit: "ticket",
    amount: 1,
    reason: "continue",
    sourceId: `demo_run_${store.spendCounter.toString().padStart(4, "0")}`,
    idempotencyKey: `demo_spend_${store.spendCounter.toString().padStart(4, "0")}`,
  });

  pushLog({
    label: result.status === "applied" ? "Ticket spent" : "Spend rejected",
    detail:
      result.status === "applied"
        ? `1 ticket consumed. Balance: ${result.balance}.`
        : `Need 1 ticket. Current balance: ${result.balance}.`,
    status: result.status === "applied" ? "fulfilled" : "rejected",
  });

  return {
    spend: result,
    snapshot: getDemoSnapshot(playerId),
  };
}
