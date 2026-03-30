import i18next from "i18next";
import { enqueueSnackbar } from "notistack";
import { getUserInfo, sendSignout } from "../../api/api.ts";
import { LoginResponse, User } from "../../api/user.ts";
import { DefaultCloseAction } from "../../component/Common/Snackbar/snackbar.tsx";
import { router } from "../../router";
import SessionManager, { UserSettings } from "../../session";
import { refreshTimeZone } from "../../util/datetime.ts";
import { clearSessionCache } from "../fileManagerSlice.ts";
import {
  closeDesktopMountSetupDialog,
  closeMusicPlayer,
  setDarkMode,
  setDrawerWidth,
  setPolicyOptionCache,
  setPreferredTheme,
  setUserInfoCache,
} from "../globalStateSlice.ts";
import { AppThunk } from "../store.ts";
import { clearOIDCAuthFlowState } from "../../session/oidcAuthFlow.ts";
import { markOIDCAuthFailure } from "../../session/oidcAuthFlow.ts";
import { longRunningTaskWithSnackbar } from "./file.ts";
import { updateSiteConfig } from "./site.ts";

export function refreshUserSession(session: LoginResponse, redirect: string | null): AppThunk {
  return async (dispatch, _getState) => {
    dispatch(setTargetSession(session));
    dispatch(updateSiteConfig());

    if (redirect) {
      router.navigate(redirect);
    } else {
      router.navigate("/home");
    }
  };
}

export function setTargetSession(session: LoginResponse): AppThunk {
  return async (dispatch, _getState) => {
    SessionManager.upsert(session);
    clearOIDCAuthFlowState();
    dispatch(setPreferredTheme(session.user.preferred_theme ?? ""));
    if (session.user.language) {
      i18next.changeLanguage(session.user.language);
    }
    dispatch(setDrawerWidth(SessionManager.getWithFallback(UserSettings.DrawerWidth)));
    dispatch(setDarkMode(SessionManager.get(UserSettings.PreferredDarkMode)));
    // TODO: clear fm cache
    dispatch(setPolicyOptionCache());
    dispatch(clearSessionCache({ index: 0, value: undefined }));
    refreshTimeZone();
  };
}

export function loadUserInfo(uid: string): AppThunk<Promise<User>> {
  return async (dispatch, getState) => {
    const userInfoCache = getState().globalState.userInfoCache;
    if (userInfoCache[uid]) {
      return userInfoCache[uid];
    }

    const user = await dispatch(getUserInfo(uid));
    dispatch(setUserInfoCache([uid, user]));
    return user;
  };
}

export function signout(): AppThunk<void> {
  return async (dispatch, _getState) => {
    const current = SessionManager.currentLoginOrNull();
    if (!current) {
      return;
    }

    const redirectURL = await longRunningTaskWithSnackbar(
      dispatch(
        sendSignout({
          refresh_token: current.token.refresh_token,
          access_token: current.token.access_token,
          id_token: current.token.id_token,
        }),
      ),
      "application:login.signingOut",
    );

    dispatch(closeMusicPlayer());
    SessionManager.signOutCurrent();
    // 主动退出后只阻断自动 OIDC 跳转，不再把成功后的回跳目标钉死到 /session。
    markOIDCAuthFailure("你已退出当前登录状态，如需继续使用请手动重新登录。");
    if (redirectURL) {
      window.location.assign(redirectURL);
      return;
    }
    router.navigate("/session");
  };
}

export function openDesktopCallback(code: string, state: string, displayName?: string, path?: string): AppThunk<void> {
  return async (dispatch, _getState) => {
    // Only add params if they are defined, to avoid undefined values in URLSearchParams
    const params: Record<string, string> = {
      state,
      code,
      user_id: SessionManager.currentLoginOrNull()?.user.id ?? "",
    };
    if (path !== undefined) {
      params["path"] = path;
    }
    if (displayName !== undefined) {
      params["name"] = displayName;
    }

    const search = new URLSearchParams(params);
    window.location.href = `cloudreve://mount?${search.toString()}`;
    dispatch(closeDesktopMountSetupDialog());
    enqueueSnackbar({
      message: i18next.t("fileManager.continueInDesktop"),
      variant: "default",
      action: DefaultCloseAction,
    });
  };
}
