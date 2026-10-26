// Verify the /dl tokens the private resolve-service signs. The format matches
// the Python signer exactly: base64url(json).base64url(HMAC-SHA256(body)),
// where json is {"u": cdnUrl, "f": filename, "e": unixExpiry}. Only URLs we
// signed are ever streamed (open-proxy guard).

export interface DownloadClaim {
  u: string; // Instagram CDN url
  f: string; // download filename
  e: number; // unix expiry (seconds)
}

function b64urlToBytes(data: string): Uint8Array {
  const pad = data.length % 4 === 0 ? "" : "=".repeat(4 - (data.length % 4));
  const b64 = (data + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<DownloadClaim | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  let ok: boolean;
  try {
    ok = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlToBytes(sig),
      enc.encode(body),
    );
  } catch {
    return null;
  }
  if (!ok) return null;
  let claim: DownloadClaim;
  try {
    claim = JSON.parse(new TextDecoder().decode(b64urlToBytes(body)));
  } catch {
    return null;
  }
  if (typeof claim.e !== "number" || claim.e < Math.floor(Date.now() / 1000)) {
    return null;
  }
  if (typeof claim.u !== "string" || typeof claim.f !== "string") return null;
  return claim;
}
