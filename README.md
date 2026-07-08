# Base Game Migration

Move existing games to Base with payment verification, in-game balances,
entitlements, and Builder Code attribution.

Status: grant-ready alpha in progress. The repo includes runtime packages, a
Nakama-first adapter, a Vercel-deployable ticket-pack demo, and a grant route
for Base Pay mainnet proof.

## Positioning

Base Game Migration is a companion product for teams that already have a
working game or game backend and want a practical path to Base-native
monetization without rebuilding their server stack.

The first use case is the painful middle of web game monetization migration:
many games already have ad SDKs wired in, but ad monetization does not map
cleanly to Base Pay, server-side verification, in-game ledgers, or Builder Code
attribution.

```txt
existing game
  -> Base Pay purchase
  -> server-side verification
  -> internal tickets, soft currency, or entitlements
  -> Builder Code attribution
  -> measurable Base activity
```

It uses Base Attribution OS for Builder Code attribution and CI validation:
https://github.com/horn111/base-attribution-os

## Who it is for

- Game developers adding tickets, continues, boosts, chests, lives, or cosmetic
  unlocks.
- Live-ops teams adding soft currency packs or non-withdrawable game balances.
- Existing game backend teams that want Base payments without replacing their
  server.
- Base ecosystem teams that want more migration paths from Web2 games into
  measurable onchain activity.

## Non-goals

- Not a hosted payment processor.
- Not a custodial wallet.
- Not a replacement for Base Pay, Base Account, Base.dev, or x402.
- Not a competitor to Nakama or other backend platforms.
- Not a reward eligibility oracle.

## Initial repo shape

```txt
base-game-migration/
+-- apps/
|   `-- demo/
+-- packages/
|   +-- payments-core/
|   +-- entitlements-core/
|   `-- nakama-adapter/
+-- examples/
|   `-- nakama-ticket-packs/
+-- docs/
`-- README.md
```

## Alpha flow

```txt
ticket pack catalog
  -> mock Base Pay order
  -> mock payment completion
  -> server-side verification
  -> idempotent fulfillment
  -> in-game ticket ledger credit
  -> ticket spend
  -> Builder Code attribution preview
```

## Packages

- `@base-game-migration/payments-core`: catalog, order creation, mock payment
  verification, fulfillment, and Builder Code attribution intent.
- `@base-game-migration/entitlements-core`: in-game ledger, ticket balances,
  idempotent credits, debits, and audit events.
- `@base-game-migration/nakama-adapter`: maps BGM ledger events to Nakama wallet
  updates and stable RPC names.

## Quickstart

```bash
pnpm install
pnpm check
pnpm --filter @base-game-migration/demo dev
```

The demo starts with the working ticket-pack flow. Create an order, complete the
mock payment, fulfill it, retry fulfillment to prove duplicate protection, then
spend a ticket.

## Vercel demo

Create the Vercel project with `apps/demo` as the project root directory. Mock
mode does not require secrets.

Grant demo:

```txt
https://base-game-migration.vercel.app/grant
```

For real Base Pay mainnet proof, configure:

```txt
NEXT_PUBLIC_BGM_RECEIVER_ADDRESS=<dedicated project receiver>
NEXT_PUBLIC_BGM_BASE_PAY_AMOUNT=1.00
```

The `/grant` route also has a recorded-proof replay path so the 1-minute demo can
be rehearsed before the mainnet smoke test.

## Grant packet

- Grant answers and 1-minute script: `docs/grant-submission.md`
- Roadmap: `docs/roadmap.md`
- Security model: `docs/security-model.md`

## Next step

The next runtime update should make the grant path production-harder while
preserving the current core interfaces:

- durable database-backed payment-id uniqueness;
- durable ledger storage;
- real BAO `createDataSuffix` / `appendDataSuffix` package integration;
- Nakama runtime module packaging.
