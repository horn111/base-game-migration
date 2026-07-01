# Roadmap

## MVP scaffold

- Product README.
- Game migration RFC.
- Launch copy for the extracted product.
- Clear dependency on Base Attribution OS for Builder Code attribution and CI
  validation.

## v0.1 runtime primitives

- `payments-core` for order creation, payment status verification, replay-safe
  fulfillment, and Builder Code attribution handoff.
- `entitlements-core` for credits, tickets, unlocks, balance reads, and
  consumption events.
- Example package catalog format.
- Server verification checklist and fixture tests.

## v0.2 adapters

- Nakama adapter for game ticket packs and internal wallet ledger fulfillment.
- Custom authoritative game server recipe.
- Colyseus room and player-state integration notes.
- Unity Gaming Services and PlayFab-style economy handoff notes.

## v0.3 public pilots

- Migrate one self-owned game or playable prototype.
- Publish a before/after integration report.
- Show how BAO validates the Builder Code attribution layer.
- Turn the migration into repeatable demo content.

## v1

- Stable runtime APIs.
- Adapter compatibility policy.
- Production security checklist.
- Public migration case studies.
