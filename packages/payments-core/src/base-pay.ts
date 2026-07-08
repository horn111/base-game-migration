import type { PaymentVerificationResult, VerifyBasePayPaymentInput } from "./types";

function normalizeAddress(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeUsdcAmount(value: string) {
  const trimmed = value.trim();

  if (!/^\d+(\.\d{1,6})?$/.test(trimmed)) {
    throw new Error(`Invalid USDC amount: ${value}.`);
  }

  const [whole = "0", fraction = ""] = trimmed.split(".");
  const paddedFraction = `${fraction}000000`.slice(0, 6);

  return BigInt(whole) * 1_000_000n + BigInt(paddedFraction);
}

function baseVerification(
  input: VerifyBasePayPaymentInput,
  status: PaymentVerificationResult["status"],
  amount: string,
  extra: Partial<PaymentVerificationResult> = {},
): PaymentVerificationResult {
  return {
    amount,
    checkedAt: (input.now ?? new Date()).toISOString(),
    currency: "USDC",
    orderId: input.order.id,
    paymentId: input.paymentId,
    provider: "base_pay",
    status,
    testnet: input.testnet ?? false,
    ...extra,
  };
}

export async function verifyBasePayPayment(
  input: VerifyBasePayPaymentInput,
): Promise<PaymentVerificationResult> {
  const testnet = input.testnet ?? false;
  const paymentStatus = await input.statusReader({
    id: input.paymentId,
    testnet,
  });
  const amount = paymentStatus.amount ?? input.expectedAmount;
  const common = {
    recipient: paymentStatus.recipient,
    sender: paymentStatus.sender,
  };

  if (paymentStatus.status !== "completed") {
    return baseVerification(input, paymentStatus.status, amount, {
      ...common,
      reason: paymentStatus.reason ?? paymentStatus.message ?? `payment_${paymentStatus.status}`,
    });
  }

  if (paymentStatus.amount === undefined) {
    return baseVerification(input, "amount_mismatch", amount, {
      ...common,
      reason: "Base Pay status did not include a completed amount.",
    });
  }

  if (normalizeUsdcAmount(paymentStatus.amount) !== normalizeUsdcAmount(input.expectedAmount)) {
    return baseVerification(input, "amount_mismatch", paymentStatus.amount, {
      ...common,
      reason: `Expected ${input.expectedAmount} USDC, received ${paymentStatus.amount} USDC.`,
    });
  }

  if (
    !paymentStatus.recipient ||
    normalizeAddress(paymentStatus.recipient) !== normalizeAddress(input.expectedRecipient)
  ) {
    return baseVerification(input, "recipient_mismatch", paymentStatus.amount, {
      ...common,
      reason: "Payment recipient does not match the grant demo receiver.",
    });
  }

  if (
    input.expectedSender &&
    (!paymentStatus.sender ||
      normalizeAddress(paymentStatus.sender) !== normalizeAddress(input.expectedSender))
  ) {
    return baseVerification(input, "sender_mismatch", paymentStatus.amount, {
      ...common,
      reason: "Payment sender does not match the player-bound payer address.",
    });
  }

  return baseVerification(input, "completed", paymentStatus.amount, common);
}
