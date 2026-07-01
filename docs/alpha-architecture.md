# Alpha Architecture

Base Game Migration alpha is a game-only toolkit for one migration loop:

```txt
ticket pack catalog
  -> mock Base Pay order
  -> server-side verification
  -> replay-safe fulfillment
  -> in-game ledger credit
  -> spend ticket
  -> Builder Code attribution intent
```

## Packages

- `@base-game-migration/payments-core`: catalog, order creation, mock payment
  verification, fulfillment, and Builder Code attribution intent.
- `@base-game-migration/entitlements-core`: in-game ledger, balances,
  idempotent credits, ticket spending, and audit events.
- `@base-game-migration/nakama-adapter`: maps fulfillment and spend events to
  Nakama wallet updates and stable RPC names.

## Demo app

`apps/demo` is a Vercel-deployable Next.js app. It uses deterministic in-memory
storage for the alpha demo and keeps storage behind package interfaces so a real
database or Nakama storage layer can replace it later.

The demo intentionally uses mock payments. There is no real money movement in
alpha.

## BAO boundary

Every order stores a Builder Code attribution intent. In alpha, the payload is a
mock preview showing the builder code, registry, source, and data-suffix-shaped
hex payload. The real payment boundary should wire this to Base Attribution OS
helpers such as `createDataSuffix` or `appendDataSuffix`.
