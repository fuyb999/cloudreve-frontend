import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { sendOIDCExchange } from "../../../../api/api.ts";
import { AppError } from "../../../../api/request.ts";
import { useAppDispatch } from "../../../../redux/hooks.ts";
import { refreshUserSession } from "../../../../redux/thunks/session.ts";
import { useQuery } from "../../../../util";

const OIDCCallback = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const query = useQuery();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = query.get("code");
    const state = query.get("state");

    if (!code || !state) {
      setError(t("login.oidcInvalidCallback"));
      return;
    }

    // 前端回调页不直接信任第三方返回结果，只把 code/state 交回后端换取统一认证 token。
    dispatch(sendOIDCExchange({ code, state }))
      .then((response) => {
        dispatch(
          refreshUserSession(
            {
              user: response.user,
              token: response.token,
            },
            response.redirect_to ?? "/home",
          ),
        );
      })
      .catch((e) => {
        setError(e instanceof AppError ? e.message : String(e));
      });
  }, [dispatch, query, t]);

  return (
    <Box sx={{ py: 8 }}>
      <Typography variant={"h6"}>{t("login.oidcSigningIn")}</Typography>
      <Typography variant={"body2"} color={"text.secondary"} sx={{ mt: 1 }}>
        {error ?? t("login.oidcRedirecting")}
      </Typography>
    </Box>
  );
};

export default OIDCCallback;
