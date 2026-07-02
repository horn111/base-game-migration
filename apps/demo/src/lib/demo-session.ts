import { NextResponse } from "next/server";

import {
  createDemoStoreFromState,
  serializeDemoStore,
  type DemoStore,
  type SerializedDemoStore,
} from "./demo-store";

export const demoStateCookieName = "bgm_demo_state";

const maxAgeSeconds = 60 * 60 * 6;

export function encodeDemoState(store: DemoStore) {
  return Buffer.from(JSON.stringify(serializeDemoStore(store)), "utf8").toString("base64url");
}

export function decodeDemoState(value?: string): SerializedDemoStore | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SerializedDemoStore;
  } catch {
    return undefined;
  }
}

export function readCookieValue(cookieHeader: string | null, name = demoStateCookieName) {
  if (!cookieHeader) {
    return undefined;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=");

    if (rawName === name) {
      return rawValue.join("=");
    }
  }

  return undefined;
}

export function createDemoStoreFromCookieValue(value?: string) {
  return createDemoStoreFromState(decodeDemoState(value));
}

export function createDemoStoreFromRequest(request: Request) {
  return createDemoStoreFromCookieValue(readCookieValue(request.headers.get("cookie")));
}

export function jsonWithDemoState(payload: unknown, store: DemoStore) {
  const response = NextResponse.json(payload);

  response.cookies.set(demoStateCookieName, encodeDemoState(store), {
    maxAge: maxAgeSeconds,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
