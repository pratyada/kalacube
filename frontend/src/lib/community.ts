/**
 * Community markets (school / neighbourhood sub-sites like jlps.kalacube.com).
 *
 * A visitor is "in" a community when they're on its subdomain, or when they
 * started its join flow on the main domain (remembered for the tab session so
 * it survives the Google sign-in redirect).
 */
export type Community = "jlps";

const KEY = "kc-community";

export const COMMUNITY_INFO: Record<
  Community,
  { name: string; short: string; home: string }
> = {
  jlps: {
    name: "JLPS Winter Craft Market",
    short: "JLPS",
    home: "/jlps",
  },
};

export function detectCommunity(): Community | null {
  if (typeof window === "undefined") return null;
  if (window.location.hostname.startsWith("jlps.")) return "jlps";
  try {
    if (window.sessionStorage.getItem(KEY) === "jlps") return "jlps";
  } catch {
    /* storage blocked — host check above still works */
  }
  return null;
}

export function rememberCommunity(c: Community) {
  try {
    window.sessionStorage.setItem(KEY, c);
  } catch {
    /* ignore */
  }
}

/** Where a brand-new (no profile yet) signed-in user should go. */
export function newUserPath(): string {
  return detectCommunity() === "jlps" ? "/jlps/join" : "/onboarding";
}
