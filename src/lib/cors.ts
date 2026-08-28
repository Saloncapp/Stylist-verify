import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CORS helpers for mobile / Expo clients calling the API with Bearer tokens.
 * Native Expo Go does not enforce CORS; these headers help Expo web and browsers.
 */
export function corsHeaders(request?: NextRequest): HeadersInit {
  const origin = request?.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin === "null" ? "*" : origin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, Accept, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function withCors(
  response: NextResponse,
  request?: NextRequest
): NextResponse {
  const headers = corsHeaders(request);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export function corsPreflight(request: NextRequest): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}
