import { NextResponse } from "next/server";

export function jsonError(error: unknown, status = 400) {
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : "Unknown demo API error.",
    },
    {
      status,
    },
  );
}
