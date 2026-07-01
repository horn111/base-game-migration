# Game and App Migration Layer RFC

Status: draft for Base Game Migration.

Base Game Migration is a companion product to Base Attribution OS. BAO should
stay attribution-first: Builder Codes, ERC-8021, x402 scanner support, SDK
helpers, CLI, and CI enforcement. Base Game Migration owns the migration and
monetization workflow for existing games and game-like products moving to Base.

## Target workflow

```txt
existing app or game
  -> Base Pay purchase
  -> server-side verification
  -> internal credits, tickets, or entitlements
  -> Builder Code attribution through BAO
  -> measurable Base activity
```

## Audience

- Game developers who want to replace ad placements or platform payments with
  tickets, boosts, chests, lives, or cosmetic unlocks.
- Existing app developers who want paid features, usage credits, premium
  exports, or community access on Base.
- AI and tool builders who want users to buy credit packs with USDC.
- Base ecosystem teams that want more apps shipping measurable onchain activity.
- Growth teams that need a repeatable migration checklist, not a blank docs tab.

## App use cases

- AI credits for generations, analysis, or agent runs.
- Paid exports for documents, videos, images, reports, or datasets.
- Premium features that unlock once per account.
- Usage packs for API calls or workspace actions.
- Community passes or creator tools gated by an internal entitlement.

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
3. Adapters: connect the shared core to real backends. The first game adapter
   should target Nakama. App adapters can follow for Next.js, Hono, Express, and
   Supabase.

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

For apps, the same core can support lighter adapters:

- Next.js route handlers for small web apps.
- Hono or Express middleware for custom APIs.
- Supabase SQL and edge function recipes for fast product teams.

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
verification checklist, and the Builder Code attribution step for both apps and
games.
