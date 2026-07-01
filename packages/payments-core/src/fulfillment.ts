import type { FulfillOrderInput, FulfillmentResult } from "./types";

export function fulfillOrder(input: FulfillOrderInput): FulfillmentResult {
  const { order, verification } = input;

  if (verification.status !== "completed") {
    return {
      status: "rejected",
      orderId: order.id,
      paymentId: verification.paymentId,
      playerId: order.playerId,
      grant: order.grant,
      reason: `payment_${verification.status}`,
    };
  }

  const result = input.ledger.creditBalance({
    playerId: order.playerId,
    unit: order.grant.unit,
    amount: order.grant.amount,
    reason: "ticket_pack_fulfillment",
    sourceId: verification.paymentId,
    idempotencyKey: `fulfillment:${verification.paymentId}`,
    now: input.now,
  });

  return {
    status: result.status === "duplicate_ignored" ? "duplicate_ignored" : "fulfilled",
    orderId: order.id,
    paymentId: verification.paymentId,
    playerId: order.playerId,
    grant: order.grant,
    ledgerEvent: result.event,
    balance: result.balance,
  };
}
