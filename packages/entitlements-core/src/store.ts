import type {
  BalanceSnapshot,
  EntitlementUnit,
  InMemoryLedgerStoreOptions,
  LedgerEvent,
  LedgerMutationInput,
  LedgerMutationResult,
  LedgerStore,
  SpendBalanceResult,
} from "./types";

const DEFAULT_EVENT_ID_PREFIX = "evt";

export function createInMemoryLedgerStore(options: InMemoryLedgerStoreOptions = {}): LedgerStore {
  const clock = options.clock ?? (() => new Date());
  const eventIdPrefix = options.eventIdPrefix ?? DEFAULT_EVENT_ID_PREFIX;
  const balances = new Map<string, Map<EntitlementUnit, number>>();
  const idempotencyEvents = new Map<string, LedgerEvent>();
  const events: LedgerEvent[] = [];
  let eventCounter = 0;

  function nextEventId() {
    eventCounter += 1;
    return `${eventIdPrefix}_${eventCounter.toString().padStart(4, "0")}`;
  }

  function readBalance(playerId: string, unit: EntitlementUnit) {
    return balances.get(playerId)?.get(unit) ?? 0;
  }

  function writeBalance(playerId: string, unit: EntitlementUnit, balance: number) {
    const playerBalances = balances.get(playerId) ?? new Map<EntitlementUnit, number>();
    playerBalances.set(unit, balance);
    balances.set(playerId, playerBalances);
  }

  function duplicateResult(idempotencyKey: string): LedgerMutationResult | undefined {
    const event = idempotencyEvents.get(idempotencyKey);

    if (!event) {
      return undefined;
    }

    return {
      status: "duplicate_ignored",
      event: {
        ...event,
        status: "duplicate_ignored",
      },
      balance: event.balanceAfter,
    };
  }

  function createEvent(
    input: LedgerMutationInput,
    direction: "credit" | "debit",
    balanceAfter: number,
    status: LedgerEvent["status"] = "applied",
  ): LedgerEvent {
    return {
      id: nextEventId(),
      playerId: input.playerId,
      unit: input.unit,
      amount: input.amount,
      direction,
      reason: input.reason,
      sourceId: input.sourceId,
      idempotencyKey: input.idempotencyKey,
      balanceAfter,
      status,
      createdAt: (input.now ?? clock()).toISOString(),
    };
  }

  return {
    creditBalance(input) {
      const duplicate = duplicateResult(input.idempotencyKey);

      if (duplicate) {
        return duplicate;
      }

      const currentBalance = readBalance(input.playerId, input.unit);
      const nextBalance = currentBalance + input.amount;
      const event = createEvent(input, "credit", nextBalance);
      writeBalance(input.playerId, input.unit, nextBalance);
      idempotencyEvents.set(input.idempotencyKey, event);
      events.push(event);

      return {
        status: "applied",
        event,
        balance: nextBalance,
      };
    },

    spendBalance(input): SpendBalanceResult {
      const duplicate = duplicateResult(input.idempotencyKey);

      if (duplicate) {
        return duplicate;
      }

      const currentBalance = readBalance(input.playerId, input.unit);

      if (input.amount <= 0) {
        const event = createEvent(input, "debit", currentBalance, "rejected");
        return {
          status: "rejected",
          reason: "invalid_amount",
          balance: currentBalance,
          event,
        };
      }

      if (currentBalance < input.amount) {
        const event = createEvent(input, "debit", currentBalance, "rejected");
        return {
          status: "rejected",
          reason: "insufficient_balance",
          balance: currentBalance,
          event,
        };
      }

      const nextBalance = currentBalance - input.amount;
      const event = createEvent(input, "debit", nextBalance);
      writeBalance(input.playerId, input.unit, nextBalance);
      idempotencyEvents.set(input.idempotencyKey, event);
      events.push(event);

      return {
        status: "applied",
        event,
        balance: nextBalance,
      };
    },

    getBalance(playerId, unit) {
      return readBalance(playerId, unit);
    },

    getBalances(playerId): BalanceSnapshot {
      const playerBalances = balances.get(playerId) ?? new Map<EntitlementUnit, number>();

      return {
        playerId,
        balances: Object.fromEntries(playerBalances.entries()),
      };
    },

    listEvents(playerId) {
      if (!playerId) {
        return [...events];
      }

      return events.filter((event) => event.playerId === playerId);
    },
  };
}
