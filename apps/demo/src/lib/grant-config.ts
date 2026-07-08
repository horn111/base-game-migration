export const grantBuilderCode = "bc_vwmzy653";
export const grantProjectHandle = "BaseGameMigration";
export const grantFallbackHandles = ["BaseGameMigration", "BGMigration", "BaseGameMig"] as const;

export const recordedBasePayProof = {
  amount: "1.00",
  payerAddress: "0x2222222222222222222222222222222222222222",
  paymentId: "0x10000000000000000000000000000000000000000000000000000000000b6d01",
  recipientAddress: "0x1111111111111111111111111111111111111111",
};

export function getGrantDemoConfig() {
  const receiverAddress =
    process.env.BGM_RECEIVER_ADDRESS ?? process.env.NEXT_PUBLIC_BGM_RECEIVER_ADDRESS ?? "";
  const amount = process.env.NEXT_PUBLIC_BGM_BASE_PAY_AMOUNT ?? "1.00";
  const samplePaymentId =
    process.env.NEXT_PUBLIC_BGM_SAMPLE_PAYMENT_ID ?? recordedBasePayProof.paymentId;
  const demoVideoUrl = process.env.NEXT_PUBLIC_BGM_DEMO_VIDEO_URL ?? "";

  return {
    amount,
    builderCode: grantBuilderCode,
    demoVideoUrl,
    explorerBaseUrl: "https://basescan.org/tx/",
    fallbackHandles: grantFallbackHandles,
    projectHandle: grantProjectHandle,
    receiverAddress,
    samplePaymentId,
  };
}

export function getBaseScanTxUrl(paymentId: string) {
  return `${getGrantDemoConfig().explorerBaseUrl}${paymentId}`;
}
