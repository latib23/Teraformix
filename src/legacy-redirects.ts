import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { Request, Response, NextFunction } from "express";

const redirects = new Map<string, string>();

function safeDecode(input: string) {
  try {
    return decodeURIComponent(input || "");
  } catch {
    return input || "";
  }
}

function stripQueryHash(p: string) {
  return (p || "").split("?")[0].split("#")[0].trim();
}

function ensureLeadingSlash(p: string) {
  if (!p) return "";
  return p.startsWith("/") ? p : `/${p}`;
}

function stripTrailingSlash(p: string) {
  return (p || "").replace(/\/+$/, "");
}

// key for lookups (lowercase)
function normalizeKeyPath(p: string) {
  const decoded = safeDecode(p);
  const clean = stripQueryHash(decoded);
  if (!clean) return "";
  const withSlash = ensureLeadingSlash(clean);
  return stripTrailingSlash(withSlash).toLowerCase();
}

// target we redirect to (keep case)
function normalizeTargetPath(p: string) {
  const decoded = safeDecode(p);
  const clean = stripQueryHash(decoded);
  if (!clean) return "";
  const withSlash = ensureLeadingSlash(clean);
  return stripTrailingSlash(withSlash);
}

/**
 * Resolve chains safely + detect loops
 * Returns:
 *  - string finalTarget (safe)
 *  - null if cycle/too long
 */
function resolveFinalTarget(startKeyLower: string, maxHops = 15): string | null {
  const seen = new Set<string>();
  let key = startKeyLower;

  for (let i = 0; i < maxHops; i++) {
    if (seen.has(key)) return null; // cycle
    seen.add(key);

    const next = redirects.get(key);
    if (!next) return null;

    const nextKeyLower = normalizeKeyPath(next);
    if (!redirects.has(nextKeyLower)) return next; // next is final (no further mapping)

    key = nextKeyLower;
  }

  return null; // too many hops = unsafe
}

export async function loadRedirects(): Promise<void> {
  const filePath = path.join(process.cwd(), "redirects.csv");

  if (!fs.existsSync(filePath)) {
    console.log("[legacy-redirects] CSV not found at:", filePath);
    return;
  }

  return new Promise((resolve, reject) => {
    let count = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: any) => {
        const oldUrlRaw = (row["old url"] || row["oldUrl"] || "").toString().trim();
        const redirectToRaw = (row["redirectTo"] || row["redirect_to"] || "").toString().trim();
        if (!oldUrlRaw || !redirectToRaw) return;

        const fromKey = normalizeKeyPath(oldUrlRaw);
        const toPath = normalizeTargetPath(redirectToRaw);
        if (!fromKey || !toPath.startsWith("/")) return;

        // ✅ HARD BLOCK: skip self-redirects even if case differs
        if (fromKey === normalizeKeyPath(toPath)) return;

        redirects.set(fromKey, toPath);
        count++;
      })
      .on("end", () => {
        console.log(`[legacy-redirects] Loaded ${count} redirects from ${filePath}`);
        resolve();
      })
      .on("error", (err) => {
        console.error("[legacy-redirects] Failed to load CSV", err);
        reject(err);
      });
  });
}

export function legacyRedirectMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.ENABLE_LEGACY_REDIRECTS !== "true") return next();

  const raw = String(req.originalUrl || req.url || req.path || "");
  const incomingPath = stripTrailingSlash(ensureLeadingSlash(stripQueryHash(raw))); // keep case
  const incomingKey = normalizeKeyPath(raw); // lowercase

  const directTarget = redirects.get(incomingKey);
  if (!directTarget) return next();

  const directTargetPathOnly = stripTrailingSlash(stripQueryHash(directTarget));
  const directTargetKey = normalizeKeyPath(directTargetPathOnly);

  // ✅ preserve query
  const qIndex = raw.indexOf("?");
  const query = qIndex !== -1 ? raw.slice(qIndex) : "";

  // ✅ GUARD 1: self redirect (case-insensitive)
  if (incomingPath.toLowerCase() === directTargetPathOnly.toLowerCase()) return next();

  // ✅ GUARD 2: direct 2-way loop (A->B and B->A)
  const back = redirects.get(directTargetKey);
  if (back) {
    const backPathOnly = stripTrailingSlash(stripQueryHash(back));
    if (backPathOnly.toLowerCase() === incomingPath.toLowerCase()) {
      // console.log("[legacy-redirects] BLOCKED 2-way loop:", incomingPath, "<->", directTargetPathOnly);
      return next();
    }
  }

  // ✅ GUARD 3: resolve long chains + block cycles
  const finalTarget = resolveFinalTarget(incomingKey) || directTarget;
  const finalPathOnly = stripTrailingSlash(stripQueryHash(finalTarget));

  if (incomingPath.toLowerCase() === finalPathOnly.toLowerCase()) return next();

  // ✅ DEBUG (uncomment temporarily)
  // console.log("[legacy-redirects] FROM:", raw, "KEY:", incomingKey, "TO:", finalTarget);

  return res.redirect(301, finalTarget + query);
}
