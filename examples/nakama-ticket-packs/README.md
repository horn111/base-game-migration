# Nakama Ticket Packs Example

This example sketches the alpha RPC contract for a Nakama-backed game.

The production runtime should replace the in-memory demo store with Nakama
storage and wallet APIs. The same package boundaries remain:

- create an order with `@base-game-migration/payments-core`
- verify payment server-side
- fulfill through `@base-game-migration/entitlements-core`
- map ledger events to Nakama wallet updates with
  `@base-game-migration/nakama-adapter`

## RPC names

- `bgm_create_order`
- `bgm_fulfill_payment`
- `bgm_get_balance`
- `bgm_spend_ticket`

## Fixtures

The `fixtures` directory contains the expected order, fulfillment, and wallet
payload shapes used by adapter tests and docs.
