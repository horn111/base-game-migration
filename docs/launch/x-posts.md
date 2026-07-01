# X Post Drafts

## Extraction post

Splitting migration work into its own product:

Base Game Migration.

BAO stays focused on Builder Code attribution, ERC-8021, x402 scanning, SDK
helpers, CLI, and CI.

BGM will focus on moving existing games to Base:

- payments
- verification
- credits/tickets
- entitlements
- Builder Code attribution through BAO

## First build teaser

Next build:

`payments-core` + `entitlements-core`.

The goal is simple: let existing games add Base-native purchases,
server-side verification, and in-game value without rewriting their backend
from scratch.

Builder Code attribution comes from BAO.

## Demo angle

Existing game -> Base purchase -> server verification -> internal value ->
Builder Code attribution.

That is the Base Game Migration thesis.

The first demo will be a planner, not a payment processor:

- game economy mode
- backend target
- package catalog
- verification checklist
- BAO attribution step

## Alpha announcement

Base Game Migration alpha is becoming a working ticket-pack demo:

- Nakama-first backend shape
- mock Base Pay order and completion
- replay-safe fulfillment
- in-game ticket ledger
- spend ticket flow
- Builder Code attribution preview through BAO
