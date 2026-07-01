# Nakama Ticket-Pack Recipe

Nakama is the first backend target for Base Game Migration because it already
provides player accounts, sessions, storage, realtime features, wallet ledgers,
and server runtime.

## Alpha RPC names

- `bgm_create_order`
- `bgm_fulfill_payment`
- `bgm_get_balance`
- `bgm_spend_ticket`

## Wallet mapping

The alpha adapter maps BGM ledger events to Nakama wallet changes:

```txt
ticket credit -> { bgm_ticket: +amount }
ticket spend  -> { bgm_ticket: -amount }
```

Metadata includes the BGM event id, source id, reason, unit, status, and balance
after mutation.

## Local integration shape

Use `examples/nakama-ticket-packs/rpc-handlers.ts` as the contract sketch for a
Nakama runtime module. The example keeps payment verification mocked, but the
handler boundaries are the same ones needed for real Base Pay verification.
