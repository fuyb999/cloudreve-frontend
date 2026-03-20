export interface OAuthConsentProps {
  clientId: string;
  responseType: string;
  redirectUri: string;
  state: string;
  scope: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

interface PersistedOAuthConsent extends OAuthConsentProps {
  createdAt: number;
}

const OAUTH_PENDING_CONSENT_KEY = "cloudreve_oauth_pending_consent";
const OAUTH_PENDING_CONSENT_TTL_MS = 10 * 60 * 1000;

function storage(): Storage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.sessionStorage;
}

function normalizeOAuthConsent(raw?: Partial<OAuthConsentProps> | null): OAuthConsentProps | undefined {
  if (!raw) {
    return undefined;
  }

  const clientId = raw.clientId?.trim() ?? "";
  const redirectUri = raw.redirectUri?.trim() ?? "";
  if (!clientId || !redirectUri) {
    return undefined;
  }

  const responseType = raw.responseType?.trim() || "code";
  const state = raw.state?.trim() ?? "";
  const scope = raw.scope?.trim() ?? "";
  const codeChallenge = raw.codeChallenge?.trim() || undefined;
  const codeChallengeMethod = raw.codeChallengeMethod?.trim() || undefined;

  return {
    clientId,
    responseType,
    redirectUri,
    state,
    scope,
    codeChallenge,
    codeChallengeMethod,
  };
}

function isExpired(consent: PersistedOAuthConsent): boolean {
  return Date.now() - (consent.createdAt ?? 0) > OAUTH_PENDING_CONSENT_TTL_MS;
}

function isOIDCCallbackRedirect(redirectUri: string): boolean {
  try {
    const parsed = new URL(redirectUri, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    return parsed.pathname.endsWith("/session/oidc/callback");
  } catch {
    return redirectUri.includes("/session/oidc/callback");
  }
}

export function readOAuthConsentFromQuery(query: URLSearchParams): OAuthConsentProps | undefined {
  return normalizeOAuthConsent({
    clientId: query.get("client_id") || "",
    responseType: query.get("response_type") || "code",
    redirectUri: query.get("redirect_uri") || "",
    state: query.get("state") || "",
    scope: query.get("scope") || "",
    codeChallenge: query.get("code_challenge") || undefined,
    codeChallengeMethod: query.get("code_challenge_method") || undefined,
  });
}

export function persistOAuthConsent(consent?: OAuthConsentProps) {
  const normalized = normalizeOAuthConsent(consent);
  if (!normalized) {
    return;
  }

  storage()?.setItem(
    OAUTH_PENDING_CONSENT_KEY,
    JSON.stringify({
      ...normalized,
      createdAt: Date.now(),
    } satisfies PersistedOAuthConsent),
  );
}

export function clearPersistedOAuthConsent() {
  storage()?.removeItem(OAUTH_PENDING_CONSENT_KEY);
}

export function readPersistedOAuthConsent(): OAuthConsentProps | undefined {
  const raw = storage()?.getItem(OAUTH_PENDING_CONSENT_KEY);
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as PersistedOAuthConsent;
    if (isExpired(parsed)) {
      clearPersistedOAuthConsent();
      return undefined;
    }

    return normalizeOAuthConsent(parsed);
  } catch {
    clearPersistedOAuthConsent();
    return undefined;
  }
}

export function resolveOAuthConsent(query: URLSearchParams): OAuthConsentProps | undefined {
  const queryConsent = readOAuthConsentFromQuery(query);
  const persistedConsent = readPersistedOAuthConsent();

  if (queryConsent && !isOIDCCallbackRedirect(queryConsent.redirectUri)) {
    persistOAuthConsent(queryConsent);
    return queryConsent;
  }

  if (persistedConsent) {
    return persistedConsent;
  }

  return queryConsent;
}

export function buildOAuthAuthorizePath(consent: OAuthConsentProps): string {
  const query = new URLSearchParams();
  query.set("client_id", consent.clientId);
  query.set("response_type", consent.responseType);
  query.set("redirect_uri", consent.redirectUri);
  if (consent.state) {
    query.set("state", consent.state);
  }
  if (consent.scope) {
    query.set("scope", consent.scope);
  }
  if (consent.codeChallenge) {
    query.set("code_challenge", consent.codeChallenge);
  }
  if (consent.codeChallengeMethod) {
    query.set("code_challenge_method", consent.codeChallengeMethod);
  }

  return `/session/authorize?${query.toString()}`;
}
