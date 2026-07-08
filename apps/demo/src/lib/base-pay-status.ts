import { getPaymentStatus } from "@base-org/account";
import type { BasePayStatusReader } from "@base-game-migration/payments-core";

export const readLiveBasePayStatus: BasePayStatusReader = async ({ id, testnet }) =>
  getPaymentStatus({
    id,
    telemetry: false,
    testnet,
  });
