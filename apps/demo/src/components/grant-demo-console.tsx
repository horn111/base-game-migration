"use client";

import { BasePayButton } from "@base-org/account-ui/react";
import { pay } from "@base-org/account";
import { CheckCircle2, ExternalLink, Play, RotateCcw, ShieldCheck, Ticket } from "lucide-react";
import { useMemo, useState } from "react";

import type { DemoSnapshot } from "../lib/demo-store";

interface GrantDemoConsoleProps {
  initialSnapshot: DemoSnapshot;
}

interface DemoActionResult {
  snapshot: DemoSnapshot;
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error ?? `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function GrantDemoConsole({ initialSnapshot }: GrantDemoConsoleProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [playerId, setPlayerId] = useState(initialSnapshot.selectedPlayerId);
  const [catalogItemId, setCatalogItemId] = useState(initialSnapshot.catalog[0]?.id ?? "");
  const [statusText, setStatusText] = useState("Ready for grant demo");
  const [basePayError, setBasePayError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const latestOrder = snapshot.latestOrder;
  const proof = snapshot.latestBasePayProof;
  const ticketBalance = snapshot.balances.balances.ticket ?? 0;
  const selectedPack = useMemo(
    () => snapshot.catalog.find((item) => item.id === catalogItemId),
    [catalogItemId, snapshot.catalog],
  );
  const progress = [
    { label: "Ads today", status: "done" },
    { label: "Ticket pack", status: latestOrder ? "done" : "active" },
    { label: "Base Pay", status: proof ? "done" : latestOrder ? "active" : "pending" },
    {
      label: "Server verify",
      status: proof?.status === "completed" ? "done" : proof ? "active" : "pending",
    },
    {
      label: "Ledger credit",
      status: latestOrder?.status === "fulfilled" ? "done" : proof ? "active" : "pending",
    },
    { label: "Spend ticket", status: ticketBalance < 10 && ticketBalance > 0 ? "done" : "pending" },
  ];

  async function runAction<T extends { snapshot: DemoSnapshot }>(
    label: string,
    action: () => Promise<T>,
  ) {
    setIsBusy(true);
    setStatusText(label);

    try {
      const result = await action();
      setSnapshot(result.snapshot);
      setStatusText("Ready for grant demo");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Unknown demo error");
    } finally {
      setIsBusy(false);
    }
  }

  async function runBasePay() {
    if (!latestOrder || !snapshot.grant.receiverAddress) {
      return;
    }

    setBasePayError(null);
    await runAction("Opening Base Pay", async () => {
      let payment: Awaited<ReturnType<typeof pay>>;

      try {
        payment = await pay({
          amount: snapshot.grant.amount,
          telemetry: false,
          testnet: false,
          to: snapshot.grant.receiverAddress,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Wallet flow closed before payment.";
        setBasePayError(message);
        throw error;
      }

      return postJson<DemoActionResult>("/api/grant/base-pay/verify", {
        orderId: latestOrder.id,
        paymentId: payment.id,
      });
    });
  }

  return (
    <main className="app-container grant-container">
      <header className="topbar">
        <a className="brand" href="/">
          <img
            alt=""
            aria-hidden="true"
            className="brand-logo"
            height="36"
            src="/bgm-gamepad-logo.svg"
            width="72"
          />
          <span>Base Game Migration</span>
        </a>
        <nav className="nav-links" aria-label="Grant demo links">
          <a href="https://github.com/horn111/base-game-migration">Repo</a>
          <a href="https://x.com/debythm">Builder X</a>
        </nav>
      </header>

      <section className="grant-hero">
        <div className="grant-hero-copy">
          <p className="eyebrow">Grant demo / Base mainnet proof</p>
          <h1>Replace ad monetization with verified Base ticket packs.</h1>
          <p>
            Most web games already monetize with ads. The hard migration is moving that ready-made
            economy to Base without rewriting the backend: payment proof, replay safety, ticket
            balances, spend rules, and Builder Code attribution.
          </p>
        </div>
        <div className="grant-status-card" aria-live="polite">
          <span>{statusText}</span>
          <strong>{ticketBalance} tickets</strong>
          <small>
            {snapshot.grant.basePayReady
              ? `${snapshot.grant.amount} USDC receiver configured`
              : "Receiver env missing: real Base Pay disabled"}
          </small>
        </div>
      </section>

      <section className="progress-rail" aria-label="Grant demo progress">
        {progress.map((step) => (
          <div data-state={step.status} key={step.label}>
            <span />
            <strong>{step.label}</strong>
          </div>
        ))}
      </section>

      <section className="grant-grid" aria-label="Grant demo workspace">
        <aside className="bento-card grant-panel">
          <div className="card-header">
            <p className="card-kicker">Before</p>
            <Ticket aria-hidden="true" />
            <h2>Ad-native web game</h2>
          </div>
          <div className="pain-list">
            <div>
              <strong>Ads monetize impressions</strong>
              <span>
                Rewarded ads, interstitials, and ad SDK events do not become Base activity.
              </span>
            </div>
            <div>
              <strong>Migration becomes plumbing</strong>
              <span>
                Checkout, verification, duplicate retries, balances, and attribution pile up.
              </span>
            </div>
            <div>
              <strong>Backend must stay authoritative</strong>
              <span>The game server still owns tickets, spend rules, and audit events.</span>
            </div>
          </div>
        </aside>

        <section className="bento-card grant-panel">
          <div className="card-header">
            <p className="card-kicker">Migrate</p>
            <ShieldCheck aria-hidden="true" />
            <h2>Ticket-pack order</h2>
          </div>
          <div className="pack-list">
            {snapshot.catalog.map((item) => (
              <button
                className={item.id === catalogItemId ? "pack is-selected" : "pack"}
                key={item.id}
                onClick={() => setCatalogItemId(item.id)}
                type="button"
              >
                <span>
                  <strong className="option-item-name">{item.title}</strong>
                  <small className="option-item-meta">{item.description}</small>
                </span>
                <b>
                  {item.price.amount} {item.price.currency}
                </b>
              </button>
            ))}
          </div>
          <label className="field">
            <span>Player</span>
            <select onChange={(event) => setPlayerId(event.target.value)} value={playerId}>
              {snapshot.players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.handle} / {player.role}
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary-button"
            disabled={!selectedPack || isBusy}
            onClick={() =>
              runAction("Creating grant order", () =>
                postJson<DemoActionResult>("/api/orders", {
                  catalogItemId,
                  playerId,
                }),
              )
            }
            type="button"
          >
            <Ticket aria-hidden="true" />
            Create ticket-pack order
          </button>
        </section>

        <section className="bento-card grant-panel">
          <div className="card-header">
            <p className="card-kicker">Base Pay</p>
            <CheckCircle2 aria-hidden="true" />
            <h2>Mainnet proof</h2>
          </div>
          <div className="base-pay-box">
            {snapshot.grant.basePayReady && latestOrder ? (
              <BasePayButton colorScheme="light" onClick={runBasePay} />
            ) : (
              <button disabled type="button">
                Run real Base Pay
              </button>
            )}
            <button
              disabled={!latestOrder || isBusy}
              onClick={() =>
                latestOrder &&
                runAction("Replaying recorded proof", () =>
                  postJson<DemoActionResult>("/api/grant/base-pay/replay", {
                    orderId: latestOrder.id,
                  }),
                )
              }
              type="button"
            >
              Replay recorded proof
            </button>
          </div>
          {basePayError ? (
            <div className="inline-error" role="alert">
              <strong>Base Pay did not complete</strong>
              <span>{basePayError}</span>
            </div>
          ) : null}
          <dl className="proof-list">
            <div>
              <dt>Payment</dt>
              <dd>{proof?.paymentId ?? "not verified"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{proof?.status ?? "waiting"}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{proof?.source ?? "live or recorded"}</dd>
            </div>
          </dl>
        </section>

        <section className="bento-card grant-panel grant-wide">
          <div className="card-header">
            <p className="card-kicker">Server runtime</p>
            <RotateCcw aria-hidden="true" />
            <h2>Verify, fulfill, spend</h2>
          </div>
          <div className="button-row">
            <button
              disabled={!latestOrder || !proof || isBusy}
              onClick={() =>
                latestOrder &&
                runAction("Fulfilling Base Pay order", () =>
                  postJson<DemoActionResult>("/api/grant/fulfill", {
                    orderId: latestOrder.id,
                  }),
                )
              }
              type="button"
            >
              <ShieldCheck aria-hidden="true" />
              Fulfill / retry
            </button>
            <button
              disabled={isBusy}
              onClick={() =>
                runAction("Spending ticket", () =>
                  postJson<DemoActionResult>(`/api/players/${playerId}/spend`),
                )
              }
              type="button"
            >
              <Play aria-hidden="true" />
              Spend ticket
            </button>
            <button
              disabled={isBusy}
              onClick={() =>
                runAction("Resetting grant demo", () =>
                  postJson<DemoActionResult>("/api/grant/reset"),
                )
              }
              type="button"
            >
              <RotateCcw aria-hidden="true" />
              Reset
            </button>
          </div>
          <ol className="log-list">
            {snapshot.log.length === 0 ? (
              <li className="empty">No grant demo events yet.</li>
            ) : (
              snapshot.log.map((entry) => (
                <li data-status={entry.status} key={entry.id}>
                  <strong>{entry.label}</strong>
                  <span>{entry.detail}</span>
                </li>
              ))
            )}
          </ol>
        </section>

        <section className="bento-card grant-panel grant-wide">
          <div className="output-header compact-output-header">
            <div className="editor-header-title">
              <p className="card-kicker">Grant proof</p>
              <h2>Builder attribution and receipt</h2>
            </div>
            {proof ? (
              <a href={proof.explorerUrl} rel="noreferrer" target="_blank">
                <ExternalLink aria-hidden="true" />
              </a>
            ) : null}
          </div>
          <pre className="code-block">
            {JSON.stringify(
              {
                attribution: latestOrder?.attribution ?? {
                  builderCode: snapshot.grant.builderCode,
                  note: "Create an order to preview attribution payload.",
                },
                attributionMode:
                  "preview-only during grant smoke; live Base Pay uses the official minimal payment payload.",
                basePay: proof
                  ? {
                      amount: proof.amount,
                      explorerUrl: proof.explorerUrl,
                      paymentId: proof.paymentId,
                      recipient: proof.recipient,
                      sender: proof.sender,
                      source: proof.source,
                      status: proof.status,
                    }
                  : "Waiting for Base Pay proof.",
                grantSocials: {
                  fallbackHandles: snapshot.grant.fallbackHandles,
                  projectHandle: snapshot.grant.projectHandle,
                },
              },
              null,
              2,
            )}
          </pre>
        </section>
      </section>
    </main>
  );
}
