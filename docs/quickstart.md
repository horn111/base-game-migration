# Quickstart

## Install

```bash
pnpm install
```

## Run checks

```bash
pnpm format
pnpm typecheck
pnpm test
pnpm build
```

## Run the demo

```bash
pnpm --filter @base-game-migration/demo dev
```

Open the local URL from Next.js and run the ticket-pack flow:

1. Select a player and ticket pack.
2. Create an order.
3. Complete the mock payment.
4. Fulfill or retry fulfillment.
5. Spend a ticket.

Retrying fulfillment for the same mock payment should be ignored and must not
double-credit the player.

## Deploy demo on Vercel

Create the Vercel project with `apps/demo` as the project root directory. The
demo does not require secrets for alpha mock mode.

## Run the grant demo

Open `/grant` to record the 1-minute grant flow:

```txt
ad monetization pain
  -> ticket-pack order
  -> Base Pay or recorded proof
  -> server verification
  -> ledger credit
  -> duplicate retry
  -> ticket spend
```

For real Base Pay mainnet proof, set:

```bash
NEXT_PUBLIC_BGM_RECEIVER_ADDRESS=<dedicated project receiver>
NEXT_PUBLIC_BGM_BASE_PAY_AMOUNT=1.00
```

Without a receiver address, the real Base Pay button is disabled and the route
can still replay the recorded proof path.

For CLI-driven preview deploys:

```bash
vercel link --yes --project base-game-migration
vercel pull --yes --environment=preview
vercel build
vercel deploy --prebuilt
```
