import type { WhitelistEntry } from "./types";

const INTERNAL_SCHEMES = ["chrome:", "chrome-extension:", "moz-extension:", "about:", "edge:"];

export function isInternalPage(url: string): boolean {
  return INTERNAL_SCHEMES.some((scheme) => url.startsWith(scheme));
}

export function isWhitelisted(url: string, whitelist: WhitelistEntry[]): boolean {
  try {
    const { hostname } = new URL(url);
    return whitelist.some(
      (entry) =>
        hostname === entry.pattern || hostname.endsWith("." + entry.pattern),
    );
  } catch {
    return false;
  }
}

export function shouldBlock(url: string, whitelist: WhitelistEntry[]): boolean {
  if (!url || url === "" || url === "about:blank") return false;
  if (isInternalPage(url)) return false;
  if (isWhitelisted(url, whitelist)) return false;
  return true;
}

export function addToWhitelist(
  whitelist: WhitelistEntry[],
  pattern: string,
): WhitelistEntry[] {
  const normalized = normalizePattern(pattern);
  if (whitelist.some((e) => e.pattern === normalized)) return whitelist;
  return [...whitelist, { pattern: normalized }];
}

export function removeFromWhitelist(
  whitelist: WhitelistEntry[],
  pattern: string,
): WhitelistEntry[] {
  return whitelist.filter((e) => e.pattern !== pattern);
}

function normalizePattern(pattern: string): string {
  let p = pattern.trim().toLowerCase();
  // Remove protocol if present
  p = p.replace(/^https?:\/\//, "");
  // Remove trailing slash/path
  p = p.replace(/\/.*$/, "");
  // Remove leading www.
  p = p.replace(/^www\./, "");
  return p;
}
