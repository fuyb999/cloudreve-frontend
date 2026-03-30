import { Action, configureStore } from "@reduxjs/toolkit";
import { ThunkAction } from "redux-thunk";
import { updateSiteConfig } from "./thunks/site.ts";
import siteConfigSliceReducer from "./siteConfigSlice";
import globalStateSliceReducer from "./globalStateSlice";
import fileManagerSliceReducer from "./fileManagerSlice.ts";

export const store = configureStore({
  reducer: {
    siteConfig: siteConfigSliceReducer,
    globalState: globalStateSliceReducer,
    fileManager: fileManagerSliceReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

function shouldBootstrapAuthenticatedSiteConfig(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const path = window.location.pathname;
  // 登录/回调页必须先完成本地会话建立，再决定是否携带旧 token 请求基础配置，
  // 否则 stale refresh token 会在 OIDC callback 前抢跑并把刚准备登录的流程打断。
  if (path.startsWith("/session") || path.startsWith("/callback")) {
    return false;
  }

  return true;
}

if (shouldBootstrapAuthenticatedSiteConfig()) {
  store.dispatch(updateSiteConfig());
}

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
