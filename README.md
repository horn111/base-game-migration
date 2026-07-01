# Base Game Migration

Move existing games to Base with payment verification, in-game balances,
entitlements, and Builder Code attribution.

Status: product scaffold for a separate game migration product. This repo is
docs-first until the first installable runtime primitives are implemented.

## Positioning

Base Game Migration is a companion product for teams that already have a
working game or game backend and want a practical path to Base-native
monetization without rebuilding their server stack.

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
+-- README.md
`-- docs/
    +-- game-migration-rfc.md
    +-- roadmap.md
    `-- launch/
        `-- x-posts.md
```

## Next step

The first runtime update should introduce small installable primitives before
full adapters:

- `payments-core`: order creation, payment status verification, idempotent
  fulfillment events.
- `entitlements-core`: internal credits, tickets, unlocks, balance reads, and
  consumption events.
- `nakama-adapter`: first game backend adapter.
- Future game backend recipes: custom authoritative servers, Colyseus, Unity
  Gaming Services, and PlayFab-style ledger integrations.
