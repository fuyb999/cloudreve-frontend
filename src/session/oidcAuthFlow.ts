export type OIDCAuthFlowMode = "reauth_required" | "failed";

export interface OIDCAuthFlowState {
  mode: OIDCAuthFlowMode;
  message?: string;
  redirect?: string;
  createdAt: number;
  blockAutoRedirectUntil?: number;
}

const OIDC_AUTH_FLOW_KEY = "cloudreve_oidc_auth_flow";
const OIDC_AUTH_FLOW_TTL_MS = 10 * 60 * 1000;
const OIDC_AUTH_FAILURE_BLOCK_MS = 60 * 1000;

function readStorage(): Storage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.sessionStorage;
}

function writeState(state: OIDCAuthFlowState) {
  const storage = readStorage();
  if (!storage) {
    return;
  }

  storage.setItem(OIDC_AUTH_FLOW_KEY, JSON.stringify(state));
}

export function getOIDCAuthFlowState(): OIDCAuthFlowState | undefined {
  const storage = readStorage();
  if (!storage) {
    return undefined;
  }

  const raw = storage.getItem(OIDC_AUTH_FLOW_KEY);
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as OIDCAuthFlowState;
    if (!parsed?.mode || !parsed.createdAt) {
      storage.removeItem(OIDC_AUTH_FLOW_KEY);
      return undefined;
    }

    if (Date.now() - parsed.createdAt > OIDC_AUTH_FLOW_TTL_MS) {
      storage.removeItem(OIDC_AUTH_FLOW_KEY);
      return undefined;
    }

    return parsed;
  } catch {
    storage.removeItem(OIDC_AUTH_FLOW_KEY);
    return undefined;
  }
}

export function clearOIDCAuthFlowState() {
  const storage = readStorage();
  storage?.removeItem(OIDC_AUTH_FLOW_KEY);
}

// 统一认证会话在业务页失效时，先记录一个“待重新认证”的状态，
// 登录页读取后会给用户一个短暂缓冲，再决定是否自动跳去统一认证中心。
export function markOIDCReauthRequired(redirect?: string, message?: string) {
  writeState({
    mode: "reauth_required",
    redirect,
    message,
    createdAt: Date.now(),
  });
}

// 一旦统一认证准备/换票失败，就转成失败态并短时间禁止再次自动跳转，
// 避免在 Cloudreve 与认证中心之间发生无休止的来回跳转。
export function markOIDCAuthFailure(message: string, redirect?: string) {
  writeState({
    mode: "failed",
    redirect,
    message,
    createdAt: Date.now(),
    blockAutoRedirectUntil: Date.now() + OIDC_AUTH_FAILURE_BLOCK_MS,
  });
}

export function isOIDCAutoRedirectBlocked(state?: OIDCAuthFlowState) {
  if (!state || state.mode !== "failed") {
    return false;
  }

  return (state.blockAutoRedirectUntil ?? 0) > Date.now();
}
