# Grant Submission Packet

This packet keeps the Base Grant Nomination answers consistent with the repo,
demo, and 1-minute recording.

## Form fields

- Email: use the submitter email connected to the grant form.
- Nominator Name: Debythm.
- Project Name: Base Game Migration.
- Project URL: https://base-game-migration.vercel.app/grant
- Project Twitter: https://x.com/BaseGameMigration
- Project Farcaster/Channel: BaseGameMigration or `/basegamemigration`
- Builder Twitter: https://x.com/debythm
- Builder Farcaster: submitter builder Farcaster handle.
- Base status: Yes - live on Base mainnet.
- 1-minute demo: TBD after recording the `/grant` flow.
- Mainnet proof: TBD after the first 1.00 USDC Base Pay smoke test.

If `BaseGameMigration` is unavailable for socials, use this fallback order:
`BGMigration`, then `BaseGameMig`.

## Why this deserves a Base grant

Base Game Migration deserves a Base grant because it targets a practical blocker
for bringing existing web games onchain. Many web games already monetize with
ads, but ad SDKs do not translate cleanly into Base-native purchases,
verification, in-game balances, or Builder Code attribution. The result is a
long tail of small backend tasks that teams postpone even when the game itself
is already playable. BGM turns that migration into a repeatable toolkit:
catalog orders, Base Pay verification, replay-safe fulfillment, ticket ledgers,
spend events, and Nakama-oriented backend integration. The grant would help
move the project from a working alpha into a reliable migration path for game
developers who want Base monetization without rewriting their entire backend.

## 1-minute demo script

1. 0-10s: Open `/grant`. Say that most web games already monetize with ads, but
   ads do not map cleanly to Base/onchain monetization.
2. 10-20s: Show the ticket pack replacing ad-driven access.
3. 20-35s: Run Base Pay or replay the recorded mainnet proof.
4. 35-45s: Verify the payment and credit tickets once.
5. 45-55s: Retry fulfillment to show duplicate protection, then spend a ticket.
6. 55-60s: Show Builder Code attribution, repo, and proof link.

## Required external setup

- Create a dedicated receiver wallet for the project.
- Set `NEXT_PUBLIC_BGM_RECEIVER_ADDRESS` on Vercel.
- Keep the default demo amount at `1.00` USDC unless the recording needs a
  different value.
- Create project socials with the selected handle.
- Record and upload the 1-minute demo video.
