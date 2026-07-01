# Alpha Security Model

Alpha is a developer proof, not a production payment processor.

## Guarantees in alpha

- Fulfillment happens server-side.
- Fulfillment requires a completed mock payment status.
- Duplicate fulfillment is ignored through an idempotency key.
- Ledger events record player, unit, amount, direction, reason, source id, and
  balance after mutation.
- Internal tickets and soft currency are non-withdrawable and non-transferable.
- Builder Code attribution intent is stored on each order.

## Not guaranteed in alpha

- No real Base Pay settlement.
- No custody.
- No wallet authentication.
- No production database durability.
- No reward eligibility decisions.

## Production upgrade path

Before production use, replace mock payment verification with real Base Pay
status checks, persist payment ids with a unique database constraint, persist
ledger events durably, and wire the attribution intent to Base Attribution OS at
the onchain payment boundary.
