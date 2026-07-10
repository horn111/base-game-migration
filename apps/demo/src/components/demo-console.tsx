"use client";

import {
  CheckCircle2,
  Copy,
  Play,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Ticket,
} from "lucide-react";
import { useMemo, useState } from "react";

import { demoBuilderCode } from "../lib/demo-config";
import type { DemoSnapshot } from "../lib/demo-store";

interface DemoConsoleProps {
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

export function DemoConsole({ initialSnapshot }: DemoConsoleProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [playerId, setPlayerId] = useState(initialSnapshot.selectedPlayerId);
  const [catalogItemId, setCatalogItemId] = useState(initialSnapshot.catalog[0]?.id ?? "");
  const [statusText, setStatusText] = useState("Ready");
  const [isBusy, setIsBusy] = useState(false);
  const latestOrder = snapshot.latestOrder;
  const latestPayment = snapshot.latestPayment;
  const ticketBalance = snapshot.balances.balances.ticket ?? 0;
  const selectedPack = useMemo(
    () => snapshot.catalog.find((item) => item.id === catalogItemId),
    [catalogItemId, snapshot.catalog],
  );

  async function runAction<T extends { snapshot: DemoSnapshot }>(
    label: string,
    action: () => Promise<T>,
  ) {
    setIsBusy(true);
    setStatusText(label);

    try {
      const result = await action();
      setSnapshot(result.snapshot);
      setStatusText("Ready");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Unknown demo error");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="app-container">
      <header className="topbar">
        <a className="brand" href="https://github.com/horn111/base-game-migration">
          <img
            alt=""
            aria-hidden="true"
            className="brand-logo"
            height="48"
            src="/bgm-gamepad-logo.svg"
            width="96"
          />
          <span>Base Game Migration</span>
        </a>
        <nav className="nav-links" aria-label="Project links">
          <a href="/grant">Grant demo</a>
          <a href="https://github.com/horn111/base-attribution-os">Base Attribution OS</a>
          <a className="star-button" href="https://github.com/horn111/base-game-migration">
            <Star aria-hidden="true" />
            <span>Star repo</span>
          </a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-meta">
          <p className="eyebrow">Nakama alpha demo</p>
          <h1>Nakama ticket-pack migration flow</h1>
        </div>
        <div className="hero-controls">
          <p className="lede">
            A player buys a ticket pack, the game server verifies the payment once, credits tickets
            to an internal ledger, then spends one ticket to enter gameplay. Tickets are game-only
            credits, not withdrawable money or transferable tokens.
          </p>
          <div className="status-strip" aria-live="polite">
            <span>{statusText}</span>
            <strong>{ticketBalance} tickets</strong>
          </div>
        </div>
      </section>

      <section className="explainer-band" aria-label="What ticket packs mean">
        <div className="explainer-copy">
          <p className="eyebrow">Plain English</p>
          <h2>What are tickets here?</h2>
          <p>
            Think of tickets as arcade entries, event attempts, tournament lives, or a small in-game
            consumable. The player buys a pack, but the game only grants access after the server has
            checked the order and written a ledger event.
          </p>
        </div>
        <div className="explainer-points">
          <div>
            <strong>For players</strong>
            <span>Clear balance: buy tickets, spend tickets, keep playing.</span>
          </div>
          <div>
            <strong>For studios</strong>
            <span>Replay-safe fulfillment prevents the same payment from crediting twice.</span>
          </div>
          <div>
            <strong>For builders</strong>
            <span>
              Every order keeps a BAO Builder Code attribution intent for future onchain pay.
            </span>
          </div>
        </div>
      </section>

      <section className="bento-grid" aria-label="Ticket pack demo workspace">
        <aside className="bento-card input-card">
          <div className="card-header">
            <p className="card-kicker">Catalog</p>
            <Ticket aria-hidden="true" />
            <h2>Ticket packs</h2>
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
              runAction("Creating order", () =>
                postJson<DemoActionResult>("/api/orders", {
                  catalogItemId,
                  playerId,
                }),
              )
            }
            type="button"
          >
            <ShoppingCart aria-hidden="true" />
            Create order
          </button>
        </aside>

        <section className="bento-card flow-card">
          <div className="card-header">
            <p className="card-kicker">Runtime</p>
            <ShieldCheck aria-hidden="true" />
            <h2>Payment and fulfillment</h2>
          </div>
          <dl className="metrics-row">
            <div className="metric-item">
              <dt className="metric-label">Order</dt>
              <dd className="metric-value">{latestOrder?.id ?? "none"}</dd>
            </div>
            <div className="metric-item">
              <dt className="metric-label">Payment</dt>
              <dd className="metric-value">{latestPayment?.status ?? "not created"}</dd>
            </div>
            <div className="metric-item">
              <dt className="metric-label">Ledger</dt>
              <dd className="metric-value">{latestOrder?.status ?? "idle"}</dd>
            </div>
          </dl>
          <div className="button-row">
            <button
              disabled={!latestOrder || latestPayment?.status === "completed" || isBusy}
              onClick={() =>
                latestOrder &&
                runAction("Completing mock payment", () =>
                  postJson<DemoActionResult>("/api/payments/mock-complete", {
                    orderId: latestOrder.id,
                  }),
                )
              }
              type="button"
            >
              <CheckCircle2 aria-hidden="true" />
              Complete mock payment
            </button>
            <button
              disabled={!latestOrder || isBusy}
              onClick={() =>
                latestOrder &&
                runAction("Fulfilling order", () =>
                  postJson<DemoActionResult>("/api/fulfill", {
                    orderId: latestOrder.id,
                  }),
                )
              }
              type="button"
            >
              <RotateCcw aria-hidden="true" />
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
          </div>
        </section>

        <section className="bento-card output-card">
          <div className="output-header">
            <div className="editor-header-title">
              <p className="card-kicker">Attribution</p>
              <h2>BAO payload preview</h2>
            </div>
            <Copy aria-hidden="true" />
          </div>
          <pre className="code-block">
            {JSON.stringify(
              latestOrder?.attribution ?? {
                builderCode: demoBuilderCode,
                note: "Create an order to preview attribution payload.",
              },
              null,
              2,
            )}
          </pre>
        </section>

        <section className="bento-card result-panel">
          <div className="card-header">
            <p className="card-kicker">Ledger</p>
            <Ticket aria-hidden="true" />
            <h2>Run events</h2>
          </div>
          <ol className="log-list">
            {snapshot.log.length === 0 ? (
              <li className="empty">No events yet.</li>
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
      </section>
    </main>
  );
}
