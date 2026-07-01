import type { BuilderAttributionInput, BuilderAttributionIntent } from "./types";

function stringToHex(value: string): `0x${string}` {
  return `0x${Buffer.from(value, "utf8").toString("hex")}`;
}

export function createAttributionIntent(input: BuilderAttributionInput): BuilderAttributionIntent {
  const builderCode = input.builderCode.trim();

  if (!builderCode) {
    throw new Error("Builder Code is required for Base Game Migration orders.");
  }

  const registry = input.registry ?? "canonical";
  const source = input.source ?? "base-game-migration-alpha";
  const payload = {
    builderCodes: [builderCode],
    registry,
    source,
  };

  return {
    builderCode,
    registry,
    source,
    builderCodes: [builderCode],
    mockDataSuffix: stringToHex(JSON.stringify(payload)),
    note: "Mock alpha payload. Wire this boundary to @base-attribution-os/core createDataSuffix/appendDataSuffix for real onchain payments.",
  };
}
