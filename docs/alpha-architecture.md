# Alpha Architecture

Base Game Migration alpha is a game-only toolkit for one migration loop:

```txt
ticket pack catalog
  -> mock or Base Pay order
  -> server-side verification
  -> replay-safe fulfillment
  -> in-game ledger credit
  -> spend ticket
  -> Builder Code attribution intent
```

## Packages

- `@base-game-migration/payments-core`: catalog, order creation, mock/Base Pay
  verification, fulfillment, and Builder Code attribution intent.
- `@base-game-migration/entitlements-core`: in-game ledger, balances,
  idempotent credits, ticket spending, and audit events.
- `@base-game-migration/nakama-adapter`: maps fulfillment and spend events to
  Nakama wallet updates and stable RPC names.

## Demo app

`apps/demo` is a Vercel-deployable Next.js app. It uses deterministic session
storage for the alpha demo and keeps storage behind package interfaces so a real
database or Nakama storage layer can replace it later.

The default demo uses mock payments. The `/grant` route can use real Base Pay
mainnet payments when a dedicated receiver address is configured, and also
includes a recorded-proof fallback for rehearsing the grant video.

## BAO boundary

Every order stores a Builder Code attribution intent. In alpha, the payload is a
data-suffix-shaped hex payload that can be passed into Base Pay `dataSuffix`.
The next hardening step is replacing the local payload construction with Base
Attribution OS helpers such as `createDataSuffix` or `appendDataSuffix`.
