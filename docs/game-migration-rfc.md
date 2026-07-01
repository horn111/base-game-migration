# Game Migration Layer RFC

Status: draft for Base Game Migration.

Base Game Migration is a companion product to Base Attribution OS. BAO should
stay attribution-first: Builder Codes, ERC-8021, x402 scanner support, SDK
helpers, CLI, and CI enforcement. Base Game Migration owns the migration and
monetization workflow for existing games moving to Base.

## Target workflow

```txt
existing game
  -> Base Pay purchase
  -> server-side verification
  -> internal tickets, soft currency, or entitlements
  -> Builder Code attribution through BAO
  -> measurable Base activity
```

## Audience

- Game developers who want to replace ad placements or platform payments with
  tickets, boosts, chests, lives, or cosmetic unlocks.
- Live-ops teams that want soft currency packs, seasonal passes, or limited
  entitlement drops paid with USDC on Base.
- Existing game backend teams that want Base-native purchases without replacing
  their authoritative server, player accounts, or inventory system.
- Base ecosystem teams that want more games shipping measurable onchain
  activity.
- Growth teams that need a repeatable migration checklist, not a blank docs tab.

## Game use cases

- Tickets that replace rewarded-ad moments.
- Continues, extra lives, chests, boosts, skips, and cosmetic unlocks.
- Soft currency packs bought with Base Pay.
- Non-withdrawable balances that only work inside the game.
- Nakama-backed wallet ledger entries for multiplayer and live-ops flows.

## Proposed layers

1. `payments-core`: create orders, attach Builder Code attribution through BAO,
   verify payment status, and produce replay-safe fulfillment events.
2. `entitlements-core`: define internal units such as credits, tickets, and
   unlocks, then track balances and consumption events.
3. Adapters: connect the shared core to real game backends. The first adapter
   should target Nakama. Additional recipes can follow for authoritative custom
   servers, Colyseus, Unity Gaming Services, and PlayFab-style ledger systems.

## Server-side rules

Payment fulfillment must happen on the server. A valid implementation should:

- call `getPaymentStatus` for the payment id;
- require a completed status before fulfillment;
- verify sender, recipient, amount, currency, and order id;
- enforce a unique payment id with a persistent database constraint;
- mark the payment as processed before issuing credits or entitlements;
- make fulfillment idempotent so retries do not double-credit users;
- store an internal ledger entry for every credit, ticket, or entitlement change;
- keep internal balances non-transferable and non-withdrawable unless a future
  product explicitly opts into a different model;
- attach Builder Code attribution to the onchain payment, not to every internal
  offchain spend.

## Adapter strategy

Nakama is the first recommended game backend adapter because it already solves
users, sessions, storage, realtime features, wallet ledgers, and server runtime.
Base Game Migration should not rebuild those primitives.

The Nakama adapter should focus on the missing Base-specific layer:

- create an order for a pack;
- verify the payment;
- protect against replay;
- credit an internal wallet or ledger;
- expose `get_balance` and `spend` RPCs;
- preserve Builder Code attribution for the onchain purchase through BAO.

Future adapters should stay game-backend focused:

- authoritative Node, Go, or Rust game servers;
- Colyseus room and player-state workflows;
- Unity Gaming Services inventory and economy handoff;
- PlayFab-style virtual currency and inventory ledgers.

## Non-goals

- Do not build a hosted payment processor.
- Do not custody user funds.
- Do not replace Base Pay, Base Account, Base.dev, x402, or Builder Codes.
- Do not compete with Nakama as a game backend.
- Do not decide Base rewards eligibility.
- Do not imply internal credits are tokens unless a project explicitly builds
  that separate token model.

## Demo direction

The first demo should preview this workflow without processing real payments. It
should generate a migration plan, a sample package catalog, a server
verification checklist, and the Builder Code attribution step for a game.
