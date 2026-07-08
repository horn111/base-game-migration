# Alpha Security Model

Alpha is a developer proof, not a production payment processor.

## Guarantees in alpha

- Fulfillment happens server-side.
- Fulfillment requires a completed mock payment status.
- Grant-mode fulfillment requires a completed Base Pay status.
- Base Pay verification checks expected amount, expected recipient, optional
  expected sender, and payment-id replay protection.
- Duplicate fulfillment is ignored through an idempotency key.
- Ledger events record player, unit, amount, direction, reason, source id, and
  balance after mutation.
- Internal tickets and soft currency are non-withdrawable and non-transferable.
- Builder Code attribution intent is stored on each order.

## Not guaranteed in alpha

- The default demo path still uses mock payments.
- No custody.
- No full wallet authentication beyond optional Base Pay payer address binding.
- No production database durability.
- No reward eligibility decisions.

## Production upgrade path

Before production use, persist payment ids with a unique database constraint,
persist ledger events durably, authenticate the player wallet, and wire the
attribution intent to Base Attribution OS at the onchain payment boundary.
