// Cloudflare Worker: the Instagram downloader web FE.
//
// Serves the page, proxies /resolve to the private backend (forwarding the
// Turnstile token and the real client IP, which the backend validates), and
// streams the media bytes from Instagram's CDN at the edge (/dl, /dl/zip) so
// our origin never touches them and there is no CORS. Only URLs the backend
// signed are ever streamed.

import { renderPage } from "./page";
import { verifyToken } from "./token";
import { buildStoredZip, type ZipEntry } from "./zip";

export interface Env {
  RESOLVE_SERVICE_URL: string; // private backend base URL
  DOWNLOAD_SIGNING_SECRET: string; // shared with the backend signer
  TURNSTILE_SITE_KEY: string; // public, injected into the page
  INTERNAL_WORKER_TOKEN?: string; // optional Worker->backend shared token
}

const IG_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15",
  Referer: "https://www.instagram.com/",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(renderPage(env.TURNSTILE_SITE_KEY), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    if (request.method === "POST" && url.pathname === "/resolve") {
      return proxyResolve(request, env);
    }
    if (request.method === "GET" && url.pathname === "/dl") {
      return streamOne(url, env);
    }
    if (request.method === "GET" && url.pathname === "/view") {
      return streamView(url, request, env);
    }
    if (request.method === "GET" && url.pathname === "/dl/zip") {
      return streamZip(url, env);
    }
    return new Response("Not found", { status: 404 });
  },
};

async function proxyResolve(request: Request, env: Env): Promise<Response> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) headers["CF-Connecting-IP"] = ip;
  if (env.INTERNAL_WORKER_TOKEN) {
    headers["X-Worker-Token"] = env.INTERNAL_WORKER_TOKEN;
  }
  const body = await request.text();
  const target = new URL("/resolve", env.RESOLVE_SERVICE_URL).toString();
  const resp = await fetch(target, { method: "POST", headers, body });
  return new Response(resp.body, {
    status: resp.status,
    headers: { "content-type": "application/json" },
  });
}

async function streamOne(url: URL, env: Env): Promise<Response> {
  const claim = await verifyToken(
    url.searchParams.get("t") ?? "",
    env.DOWNLOAD_SIGNING_SECRET,
  );
  if (!claim) return new Response("Invalid or expired link", { status: 403 });
  const upstream = await fetch(claim.u, { headers: IG_HEADERS });
  if (!upstream.ok || !upstream.body) {
    return new Response("Media is no longer available", { status: 502 });
  }
  const headers = new Headers();
  headers.set(
    "Content-Disposition",
    `attachment; filename="${sanitize(claim.f)}"`,
  );
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("content-length", contentLength);
  return new Response(upstream.body, { status: 200, headers });
}

// Inline view (no Content-Disposition) so images open full-size and videos
// play in-page. Forwards Range so the browser can seek video. Same signed
// token as /dl — only backend-signed CDN URLs are ever streamed.
async function streamView(
  url: URL,
  request: Request,
  env: Env,
): Promise<Response> {
  const claim = await verifyToken(
    url.searchParams.get("t") ?? "",
    env.DOWNLOAD_SIGNING_SECRET,
  );
  if (!claim) return new Response("Invalid or expired link", { status: 403 });
  const headers: Record<string, string> = { ...IG_HEADERS };
  const range = request.headers.get("Range");
  if (range) headers["Range"] = range;
  const upstream = await fetch(claim.u, { headers });
  if (!upstream.ok || !upstream.body) {
    return new Response("Media is no longer available", { status: 502 });
  }
  const out = new Headers();
  for (const h of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
  ]) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  if (!out.has("accept-ranges")) out.set("accept-ranges", "bytes");
  out.set("cache-control", "private, max-age=3600");
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

async function streamZip(url: URL, env: Env): Promise<Response> {
  const tokens = (url.searchParams.get("t") ?? "").split(",").filter(Boolean);
  if (tokens.length === 0) {
    return new Response("Nothing to download", { status: 400 });
  }
  const entries: ZipEntry[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const claim = await verifyToken(
      decodeURIComponent(tokens[i]),
      env.DOWNLOAD_SIGNING_SECRET,
    );
    if (!claim) return new Response("Invalid or expired link", { status: 403 });
    const upstream = await fetch(claim.u, { headers: IG_HEADERS });
    if (!upstream.ok) {
      return new Response("Media is no longer available", { status: 502 });
    }
    entries.push({
      name: sanitize(claim.f || `media-${i}`),
      data: new Uint8Array(await upstream.arrayBuffer()),
    });
  }
  const zip = buildStoredZip(entries);
  return new Response(zip, {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-disposition": 'attachment; filename="instagram.zip"',
      "content-length": String(zip.length),
    },
  });
}

function sanitize(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120) || "download";
}
