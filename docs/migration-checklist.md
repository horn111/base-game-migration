# Game Migration Checklist

- Identify the first in-game value to sell: tickets, soft currency, continues,
  extra lives, chests, or cosmetic unlocks.
- Keep the internal value non-withdrawable and non-transferable for alpha.
- Define a catalog item with USDC price and in-game grant.
- Create the order on the server.
- Attach Builder Code attribution intent to the order.
- Verify payment status on the server.
- Enforce a unique payment id before fulfillment.
- Credit the in-game ledger through an idempotent mutation.
- Record every credit and spend as a ledger event.
- Retry fulfillment and confirm duplicate attempts do not double-credit.
- Spend the in-game value through the authoritative game backend.
