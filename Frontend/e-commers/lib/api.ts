// Thin fetch wrapper around the Express/MongoDB API (see backend/). Kept
// deliberately small — resource-specific calls live next to the code that
// uses them (lib/data/products.ts, lib/store/*.ts) rather than piling
// every endpoint into this one file.

// A function, not a module-level constant: reading it fresh on every call
// avoids capturing `process.env.NEXT_PUBLIC_API_URL` before a given build
// worker has actually finished injecting it (a real race — some Next.js
// build workers hit this file before .env.local is loaded for them,
// silently pinning every request in that worker to the fallback below).
export function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5000";
}

function isNextInternalSignal(err: unknown): boolean {
  const digest = (err as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && (digest === "DYNAMIC_SERVER_USAGE" || digest.startsWith("NEXT_"));
}

export class ApiError extends Error {
  status: number;
  errors?: unknown;
  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

// The API's two auth schemes ("bearer <userToken>" / "admin <adminToken>")
// are attached by the caller — see withUserAuth/withAdminAuth in
// lib/store/auth.ts, which know which token to read. This file stays
// agnostic of *where* a token comes from.
export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  authHeader?: string;
}

/**
 * Runs a request against the API and returns the parsed JSON body. Throws
 * ApiError (with the backend's own message) on any non-2xx response, and
 * on the fetch failing outright (e.g. the backend isn't running) — every
 * caller already has to handle "the request failed" one way or another,
 * so this never returns a partial/undefined result silently.
 */
export async function apiFetch<T = unknown>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, authHeader, headers, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const finalHeaders: Record<string, string> = { ...(headers as Record<string, string>) };
  if (authHeader) finalHeaders.authorization = authHeader;
  if (body !== undefined && !isFormData) finalHeaders["content-type"] = "application/json";

  const doFetch = () =>
    fetch(`${getApiUrl()}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      cache: rest.cache ?? "no-store"
    });

  let res: Response;
  try {
    res = await doFetch();
  } catch (err) {
    // Next.js's own patched `fetch` throws internal control-flow signals
    // (DYNAMIC_SERVER_USAGE when a `no-store` fetch runs inside a
    // statically-generated route, redirects, etc. — recognizable by a
    // `.digest` starting with an uppercase code). Those MUST propagate
    // unchanged so Next's render pipeline can handle them (e.g. quietly
    // fall back to rendering this route dynamically instead of statically)
    // — swallowing one here turns a normal build-time fallback into a
    // crashed build.
    if (isNextInternalSignal(err)) throw err;
    throw new ApiError("Could not reach the server. Is the API running?", 0);
  }

  const contentType = res.headers.get("content-type") ?? "";
  const json = contentType.includes("application/json") ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(json?.message ?? `Request failed (${res.status})`, res.status, json?.errors);
  }
  return json as T;
}
