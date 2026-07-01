import type {
  CreateMockPaymentInput,
  MockPayment,
  PaymentVerificationInput,
  PaymentVerificationResult,
} from "./types";

export function createMockPayment(input: CreateMockPaymentInput): MockPayment {
  const now = input.now ?? new Date();

  return {
    id: input.id ?? `pay_${now.getTime().toString(36)}`,
    orderId: input.order.id,
    playerId: input.order.playerId,
    amount: input.order.price.amount,
    currency: input.order.price.currency,
    status: "pending",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function completeMockPayment(payment: MockPayment, now = new Date()): MockPayment {
  return {
    ...payment,
    status: "completed",
    updatedAt: now.toISOString(),
  };
}

export function failMockPayment(payment: MockPayment, now = new Date()): MockPayment {
  return {
    ...payment,
    status: "failed",
    updatedAt: now.toISOString(),
  };
}

export function verifyPayment(input: PaymentVerificationInput): PaymentVerificationResult {
  const checkedAt = (input.now ?? new Date()).toISOString();
  const { order, payment } = input;

  if (
    payment.orderId !== order.id ||
    payment.amount !== order.price.amount ||
    payment.currency !== order.price.currency
  ) {
    return {
      status: "mismatched_order",
      orderId: order.id,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      checkedAt,
    };
  }

  return {
    status: payment.status === "completed" ? "completed" : payment.status,
    orderId: order.id,
    paymentId: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    checkedAt,
  };
}
