import dayjs from "dayjs";
import { ArrowBackIos } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Box, Button, Typography } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import {
  getOauthAppRegistration,
  send2FALogin,
  sendConsentOauthApp,
  sendLogin,
  sendPrepareOIDCLogin,
  sendPrepareLogin,
  sendResetEmail,
} from "../../../../api/api.ts";
import { AppError, Code } from "../../../../api/request.ts";
import { AppRegistration, GrantService, LoginResponse, PrepareLoginResponse } from "../../../../api/user.ts";
import { clearOAuthApp, setOAuthApp, setOAuthAppLoading } from "../../../../redux/globalStateSlice.ts";
import { useAppDispatch, useAppSelector } from "../../../../redux/hooks.ts";
import { refreshUserSession, setTargetSession } from "../../../../redux/thunks/session.ts";
import PageTitle from "../../../../router/PageTitle.tsx";
import SessionManager, { Session } from "../../../../session/index.ts";
import { useQuery } from "../../../../util";
import { CaptchaParams } from "../../../Common/Captcha/Captcha.tsx";
import { DefaultCloseAction } from "../../../Common/Snackbar/snackbar.tsx";
import DismissCircleFilled from "../../../Icons/DismissCircleFilled.tsx";
import Phase2FA from "../Phases/Phase2FA.tsx";
import PhaseCollectEmail from "../Phases/PhaseCollectEmail.tsx";
import PhaseCollectPassword from "../Phases/PhaseCollectPassword.tsx";
import PhaseConsent from "../Phases/PhaseConsent.tsx";
import PhaseForgetPassword from "../Phases/PhaseForgetPassword.tsx";
import PhaseSignupNeeded from "../Phases/PhaseSignupNeeded.tsx";
import "../SideTransition.css";

// Local storage key for OAuth redirect
export const OAUTH_REDIRECT_KEY = "oauth_redirect_url";

enum EmailLoginPhase {
  CollectEmail,
  CollectPassword,
  SignupNeeded,
  Collect2FA,
  ForgetPassword,
  Consent,
}

export interface Control {
  submit: JSX.Element;
  back: JSX.Element;
}

interface phaseSetting {
  title: string;
  nextButtonText: string;
  showBackButton: boolean;
  previous?: EmailLoginPhase;
  control?: Control;
}

export interface OAuthConsentProps {
  clientId: string;
  responseType: string;
  redirectUri: string;
  state: string;
  scope: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

export interface SignInProps {
  oauthConsent?: OAuthConsentProps;
}

function isReusableOAuthSession(session: Session | null): boolean {
  if (!session || session.signedOut) {
    return false;
  }

  // OAuth 授权页只在本地 refresh token 仍可用时复用 Cloudreve 会话，
  // 避免拿着一个已经失效的缓存会话继续走 consent，导致页面再次进入异常跳转。
  const refreshExpires = session.token.refresh_expires;
  if (!refreshExpires) {
    return false;
  }

  return dayjs(refreshExpires).isAfter(dayjs().add(10, "minute"));
}

const EmailLogin = ({ oauthConsent }: SignInProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const query = useQuery();

  const isOAuthFlow = !!oauthConsent;
  const requestedScopes = useMemo(
    () => (oauthConsent?.scope ? oauthConsent.scope.split(" ").filter(Boolean) : []),
    [oauthConsent?.scope],
  );

  // Get OAuth app from Redux
  const app = useAppSelector((state) => state.globalState.oauthApp);

  const [phase, setPhase] = useState<EmailLoginPhase>(EmailLoginPhase.CollectEmail);
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [otp, setOTP] = useState("");
  const [captchaGen, setCaptchaGen] = useState(0);
  const [loading, setLoading] = useState(false);
  const captchaState = useRef<CaptchaParams>();
  const twoFaSession = useRef<string>("");
  const [loginOptions, setLoginOptions] = useState<PrepareLoginResponse>();

  // OAuth-specific state
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  // Load OAuth app registration
  const loadAppRegistration = useCallback(async () => {
    if (!oauthConsent?.clientId) {
      setOauthError(t("oauth.invalidClientId"));
      dispatch(setOAuthAppLoading(false));
      return null;
    }

    try {
      dispatch(setOAuthAppLoading(true));
      const registration = await dispatch(getOauthAppRegistration(oauthConsent.clientId));
      dispatch(setOAuthApp(registration));
      return registration;
    } catch (e) {
      // 授权页上的本地会话如果刚好失效，请求层会自动清理会话并跳回登录页，
      // 这里不再把它误提示成“应用不存在”。
      if (!(e instanceof AppError) || (e.code !== Code.CodeLoginRequired && e.code !== Code.CredentialInvalid)) {
        setOauthError(e instanceof AppError ? e.message : t("oauth.appNotFound"));
      }
      dispatch(setOAuthAppLoading(false));
      return null;
    }
  }, [oauthConsent?.clientId, dispatch, t]);

  // Send consent and redirect
  const sendConsent = useCallback(async () => {
    if (!oauthConsent) return;

    try {
      setLoading(true);
      const grantService: GrantService = {
        client_id: oauthConsent.clientId,
        response_type: oauthConsent.responseType,
        redirect_uri: oauthConsent.redirectUri,
        state: oauthConsent.state,
        scope: oauthConsent.scope,
        code_challenge: oauthConsent.codeChallenge,
        code_challenge_method: oauthConsent.codeChallengeMethod,
      };
      const response = await dispatch(sendConsentOauthApp(grantService));

      // Clear OAuth state before redirecting
      dispatch(clearOAuthApp());
      localStorage.removeItem(OAUTH_REDIRECT_KEY);

      // Redirect to the app with the authorization code
      // Handle both absolute URLs and relative paths
      const redirectUrl =
        oauthConsent.redirectUri.startsWith("http://") || oauthConsent.redirectUri.startsWith("https://")
          ? new URL(oauthConsent.redirectUri)
          : new URL(oauthConsent.redirectUri, window.location.origin);
      redirectUrl.searchParams.set("code", response.code);
      if (response.state) {
        redirectUrl.searchParams.set("state", response.state);
      }
      window.location.assign(redirectUrl.toString());
    } catch (e: unknown) {
      setOauthError(e instanceof AppError ? e.message : String(e));
      setLoading(false);
    }
  }, [oauthConsent, dispatch, t]);

  // Check if all requested scopes are already consented
  const checkAndProceed = useCallback(
    async (registration: AppRegistration) => {
      const consentedScopes = registration.consented_scopes || [];
      const allConsented = requestedScopes.every((s) => consentedScopes.includes(s));

      if (allConsented && requestedScopes.length > 0) {
        // All scopes already consented, send consent directly
        await sendConsent();
      } else {
        // Need user to consent to new scopes
        setSelectedScopes(requestedScopes.filter((s) => !consentedScopes.includes(s)));
        setPhase(EmailLoginPhase.Consent);
      }
    },
    [requestedScopes, sendConsent],
  );

  // Handle OAuth session switch (different from normal login - don't redirect)
  const handleOAuthSessionSwitch = useCallback(
    async (session: Session | LoginResponse) => {
      const loginResponse: LoginResponse = { user: session.user, token: session.token };
      dispatch(setTargetSession(loginResponse));

      // Reload app registration to get updated consented scopes
      const registration = await loadAppRegistration();
      if (registration) {
        await checkAndProceed(registration);
      }
    },
    [dispatch, loadAppRegistration, checkAndProceed],
  );

  const prepareLogin = useCallback(async () => {
    try {
      setLoading(true);
      const opts = await dispatch(sendPrepareLogin(email));
      setLoginOptions(opts);
      setPhase(EmailLoginPhase.CollectPassword);
    } catch (e) {
      if (e instanceof AppError && e.code === Code.NodeFound) {
        // User not registered yet, guided to register
        setPhase(EmailLoginPhase.SignupNeeded);
      }
    } finally {
      setLoading(false);
    }
  }, [dispatch, email, setPhase]);

  const passwordLogin = useCallback(
    async (email: string, password: string, captcha?: CaptchaParams) => {
      try {
        setLoading(true);
        const loginRes = await dispatch(sendLogin({ email, password, ...captcha }));
        if (isOAuthFlow) {
          await handleOAuthSessionSwitch(loginRes);
        } else {
          dispatch(refreshUserSession(loginRes, query.get("redirect")));
        }
      } catch (e) {
        if (e instanceof AppError && e.code === Code.Continue) {
          twoFaSession.current = e.response.data;
          // User needs 2FA
          setPhase(EmailLoginPhase.Collect2FA);
        } else {
          setCaptchaGen((g) => g + 1);
        }
      } finally {
        setLoading(false);
      }
    },
    [dispatch, setPhase, setCaptchaGen, setLoading, t],
  );

  const finish2FA = useCallback(
    async (otp: string, ticket: string) => {
      try {
        setLoading(true);
        const loginRes = await dispatch(send2FALogin({ otp, session_id: ticket }));
        if (isOAuthFlow) {
          await handleOAuthSessionSwitch(loginRes);
        } else {
          dispatch(refreshUserSession(loginRes, query.get("redirect")));
        }
      } finally {
        setOTP("");
        setLoading(false);
      }
    },
    [dispatch, isOAuthFlow, handleOAuthSessionSwitch, query],
  );

  const submitSendResetEmail = useCallback(
    async (email: string, captcha?: CaptchaParams) => {
      try {
        setLoading(true);
        await dispatch(sendResetEmail({ email, ...captcha }));
        setPhase(EmailLoginPhase.CollectEmail);
        enqueueSnackbar({
          message: t("login.resetEmailSent"),
          variant: "success",
          action: DefaultCloseAction,
        });
      } catch (e) {
        setCaptchaGen((g) => g + 1);
      } finally {
        setLoading(false);
      }
    },
    [dispatch, setPhase, setCaptchaGen, setLoading, isOAuthFlow, handleOAuthSessionSwitch, query],
  );

  const submit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    switch (phase) {
      case EmailLoginPhase.CollectEmail:
        prepareLogin();
        break;
      case EmailLoginPhase.SignupNeeded:
        navigate(`/session/signup?email=${email}`);
        break;
      case EmailLoginPhase.CollectPassword:
        passwordLogin(email, pwd, captchaState.current);
        break;
      case EmailLoginPhase.Collect2FA:
        finish2FA(otp, twoFaSession.current);
        break;
      case EmailLoginPhase.ForgetPassword:
        submitSendResetEmail(email, captchaState.current);
        break;
      case EmailLoginPhase.Consent:
        sendConsent();
        break;
    }
  };

  useEffect(() => {
    if (otp.length === 6) {
      submit();
    }
  }, [otp]);

  // Initial load for OAuth or regular login
  useEffect(() => {
    const init = async () => {
      if (isOAuthFlow) {
        const registration = await loadAppRegistration();
        if (!registration) return;
        if (SessionManager.currentLoginOrNull()) {
          await checkAndProceed(registration);
        }
      }
    };
    init();

    // Cleanup OAuth state when leaving
    return () => {
      if (isOAuthFlow) {
        dispatch(clearOAuthApp());
      }
    };
  }, []);

  const handleScopeToggle = useCallback((scope: string) => {
    setSelectedScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]));
  }, []);

  const phaseConfig = useMemo((): phaseSetting => {
    var phaseSetting: phaseSetting = {
      title: t("login.siginToYourAccount"),
      nextButtonText: t("login.continue"),
      showBackButton: false,
    };
    switch (phase) {
      case EmailLoginPhase.CollectEmail:
        phaseSetting = {
          title: t("login.siginToYourAccount"),
          nextButtonText: t("login.continue"),
          showBackButton: false,
        };
        break;
      case EmailLoginPhase.SignupNeeded:
        phaseSetting = {
          title: t("login.siginToYourAccount"),
          nextButtonText: t("login.signUpAccount"),
          showBackButton: true,
          previous: EmailLoginPhase.CollectEmail,
        };
        break;
      case EmailLoginPhase.CollectPassword:
        phaseSetting = {
          title: t("login.enterPassword"),
          nextButtonText: t("login.signIn"),
          showBackButton: true,
          previous: EmailLoginPhase.CollectEmail,
        };
        break;
      case EmailLoginPhase.Collect2FA:
        phaseSetting = {
          title: t("login.2FA"),
          nextButtonText: t("login.signIn"),
          showBackButton: true,
          previous: EmailLoginPhase.CollectPassword,
        };
        break;
      case EmailLoginPhase.ForgetPassword:
        phaseSetting = {
          title: t("login.resetPassword"),
          nextButtonText: t("login.sendMeAnEmail"),
          showBackButton: true,
          previous: EmailLoginPhase.CollectPassword,
        };
        break;
      case EmailLoginPhase.Consent:
        phaseSetting = {
          title: t("oauth.reviewPermissions"),
          nextButtonText: t("oauth.authorize"),
          showBackButton: true,
          previous: EmailLoginPhase.CollectEmail,
        };
        break;
      default:
        break;
    }
    phaseSetting.control = {
      submit: (
        <LoadingButton sx={{ mt: 2 }} type="submit" fullWidth variant="contained" color="primary" loading={loading}>
          <span>{phaseSetting.nextButtonText}</span>
        </LoadingButton>
      ),
      back: (
        <>
          {phaseSetting.showBackButton && (
            <Button
              startIcon={<ArrowBackIos />}
              size={"small"}
              sx={{ mt: 2 }}
              variant="text"
              disabled={loading}
              color="primary"
              onClick={() => {
                phaseSetting.previous != undefined && setPhase(phaseSetting.previous);
              }}
            >
              {t("login.back")}
            </Button>
          )}
        </>
      ),
    };
    return phaseSetting;
  }, [phase, t, loading]);

  // Render OAuth error state
  if (oauthError) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: 7,
          pb: 9,
        }}
      >
        <DismissCircleFilled fontSize={"large"} color={"error"} />
        <Typography
          variant={"body2"}
          sx={{
            color: (theme) => theme.palette.error.main,
            mt: 2,
          }}
        >
          {oauthError}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ overflow: "hidden" }}>
      <Typography variant={"h6"}>{phaseConfig.title}</Typography>
      <Box component={"form"} sx={{ mt: 1 }} onSubmit={submit}>
        <SwitchTransition>
          <CSSTransition
            addEndListener={(node, done) => node.addEventListener("transitionend", done, false)}
            classNames="side"
            key={phase}
          >
            <Box>
              {phase === EmailLoginPhase.CollectPassword && (
                <PhaseCollectPassword
                  email={email}
                  pwd={pwd}
                  onForget={() => setPhase(EmailLoginPhase.ForgetPassword)}
                  setPwd={setPwd}
                  control={phaseConfig.control}
                  loginOptions={loginOptions}
                  captchaGen={captchaGen}
                  setCaptchaState={(s) => (captchaState.current = s)}
                  onOAuthPasskeyLogin={isOAuthFlow ? handleOAuthSessionSwitch : undefined}
                />
              )}
              {phase === EmailLoginPhase.SignupNeeded && (
                <PhaseSignupNeeded email={email} control={phaseConfig.control} />
              )}
              {phase === EmailLoginPhase.Collect2FA && (
                <Phase2FA
                  loading={loading}
                  otp={otp}
                  onOtpChange={(t: string) => setOTP(t)}
                  control={phaseConfig.control}
                />
              )}
              {phase === EmailLoginPhase.CollectEmail && (
                <PhaseCollectEmail
                  email={email}
                  setEmail={setEmail}
                  control={phaseConfig.control}
                  onOAuthPasskeyLogin={isOAuthFlow ? handleOAuthSessionSwitch : undefined}
                />
              )}
              {phase === EmailLoginPhase.Consent && app && (
                <PhaseConsent
                  app={app}
                  requestedScopes={requestedScopes}
                  selectedScopes={selectedScopes}
                  onScopeToggle={handleScopeToggle}
                  control={phaseConfig.control!}
                />
              )}
              {phase === EmailLoginPhase.ForgetPassword && (
                <PhaseForgetPassword
                  email={email}
                  captchaGen={captchaGen}
                  setCaptchaState={(s) => (captchaState.current = s)}
                  control={phaseConfig.control}
                />
              )}
            </Box>
          </CSSTransition>
        </SwitchTransition>
      </Box>
    </Box>
  );
};

const OIDCLogin = ({ oauthConsent }: SignInProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const query = useQuery();
  const oidcDisplayName = useAppSelector((state) => state.siteConfig.login.config.oidc_display_name) ?? "OIDC";
  const oidcAutoRedirect = useAppSelector((state) => state.siteConfig.login.config.oidc_auto_redirect);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextTarget = useMemo(() => {
    // OAuth 授权页场景需要完整保留当前 query，避免统一认证回来后丢掉下游应用授权参数。
    if (oauthConsent) {
      return `${window.location.pathname}${window.location.search}`;
    }
    return query.get("redirect") ?? "/home";
  }, [oauthConsent, query]);

  const startOIDCLogin = useCallback(async () => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // 先向后端申请 state 和重定向地址，避免前端自行拼接造成配置分叉。
      const response = await dispatch(
        sendPrepareOIDCLogin({
          next: nextTarget,
        }),
      );
      window.location.assign(response.redirect_url);
    } catch (e) {
      setLoading(false);
      setError(e instanceof AppError ? e.message : String(e));
    }
  }, [dispatch, loading, nextTarget]);

  useEffect(() => {
    // 开启自动跳转后，用户打开登录页就会直达统一认证中心。
    if (oidcAutoRedirect) {
      void startOIDCLogin();
    }
  }, [oidcAutoRedirect, startOIDCLogin]);

  return (
    <Box sx={{ overflow: "hidden" }}>
      <Typography variant={"h6"}>{oauthConsent ? t("oauth.authorize") : t("login.signIn")}</Typography>
      <Typography variant={"body2"} color={"text.secondary"} sx={{ mt: 1, mb: 3 }}>
        {t("login.oidcUnifiedAuthHint", { provider: oidcDisplayName })}
      </Typography>
      <LoadingButton
        type="button"
        fullWidth
        variant="contained"
        color="primary"
        loading={loading}
        onClick={() => void startOIDCLogin()}
      >
        <span>{t("login.continueWithProvider", { provider: oidcDisplayName })}</span>
      </LoadingButton>
      {error && (
        <Typography variant={"body2"} color={"error"} sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

const SignIn = ({ oauthConsent }: SignInProps) => {
  const { t } = useTranslation();
  const isOAuthFlow = !!oauthConsent;
  const oidcEnabled = useAppSelector((state) => state.siteConfig.login.config.oidc_enabled);
  const hasLocalSession = isReusableOAuthSession(SessionManager.currentLoginOrNull());
  // OAuth 授权页要区分两类场景：
  // 1. 已有 Cloudreve 本地会话：直接进入 consent/code 流程，不能再次跳 Yudao，否则会形成 authorize -> OIDC -> authorize 的循环。
  // 2. 没有本地会话：才需要先走统一认证，把外部身份落成 Cloudreve 本地会话。
  const shouldReuseOAuthSession = oidcEnabled && isOAuthFlow && hasLocalSession;

  return (
    <Box>
      <PageTitle title={isOAuthFlow ? t("oauth.authorize") : t("login.signIn")} />
      {/* 开关关闭时继续走原有邮箱/密码/Passkey 流程，保证回退成本最低。 */}
      {!oidcEnabled || shouldReuseOAuthSession ? (
        <EmailLogin oauthConsent={oauthConsent} />
      ) : (
        <OIDCLogin oauthConsent={oauthConsent} />
      )}
    </Box>
  );
};

export default SignIn;
