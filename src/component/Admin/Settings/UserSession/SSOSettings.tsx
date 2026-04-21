import { ExpandMoreRounded } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  Alert,
  Collapse,
  FormControl,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  Typography,
  styled,
} from "@mui/material";
import MuiAccordionSummary, { AccordionSummaryProps } from "@mui/material/AccordionSummary";
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getOIDCRuntimeState } from "../../../../api/api.ts";
import { OIDCRuntimeState } from "../../../../api/dashboard.ts";
import { useAppDispatch } from "../../../../redux/hooks.ts";
import { isTrueVal } from "../../../../session/utils.ts";
import { DenseFilledTextField } from "../../../Common/StyledComponents.tsx";
import { NoMarginHelperText } from "../Settings.tsx";
import { SettingContext } from "../SettingWrapper.tsx";

export const AccordionSummary = styled((props: AccordionSummaryProps) => <MuiAccordionSummary {...props} />)(
  ({ theme }) => ({
    fontSize: theme.typography.body2.fontSize,
    paddingLeft: theme.spacing(4),
    "& .MuiFormControlLabel-label": {
      fontSize: theme.typography.body2.fontSize,
    },
  }),
);

export const StyledAccordion = styled(Accordion)(({ theme }) => ({
  boxShadow: "none",
  border: `1px solid ${theme.palette.divider}`,
  "&::before": {
    display: "none",
  },
}));

const SSOSettings = () => {
  const { t } = useTranslation("dashboard");
  const dispatch = useAppDispatch();
  const { values, setSettings } = useContext(SettingContext);
  const oidcEnabled = isTrueVal(values.oidc_enabled);
  const oidcAutoRedirect = isTrueVal(values.oidc_auto_redirect);
  const oidcConfigMode = values.oidc_config_mode ?? "remote";
  const remoteConfigMode = oidcConfigMode === "remote";
  const [runtimeState, setRuntimeState] = useState<OIDCRuntimeState>();
  // 回调地址固定落回当前站点前端路由，便于不同部署环境直接复用。
  const callbackURL = useMemo(() => `${window.location.origin}/session/oidc/callback`, []);

  useEffect(() => {
    if (!oidcEnabled || !remoteConfigMode) {
      return;
    }

    dispatch(getOIDCRuntimeState()).then((res) => {
      setRuntimeState(res);
    });
  }, [dispatch, oidcEnabled, remoteConfigMode]);

  const runtimeSeverity = useMemo(() => {
    switch (runtimeState?.status) {
      case "remote_ready":
      case "remote_cached":
        return "success";
      case "local_fallback":
      case "remote_error":
        return "warning";
      default:
        return "info";
    }
  }, [runtimeState?.status]);

  return (
    <StyledAccordion defaultExpanded disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreRounded />}>
        <FormControlLabel
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
          control={
            <Switch
              checked={oidcEnabled}
              onChange={(e) =>
                setSettings({
                  oidc_enabled: e.target.checked ? "1" : "0",
                })
              }
            />
          }
          label={t("settings.oidc")}
        />
      </AccordionSummary>
      <AccordionDetails sx={{ display: "block" }}>
        {/* 统一认证支持两种模式：标准 OIDC 本地配置，或通过授权中心远程拉取运行时配置。 */}
        <Stack spacing={2.5}>
          <FormControl fullWidth>
            <DenseFilledTextField
              value={values.oidc_display_name ?? ""}
              onChange={(e) =>
                setSettings({
                  oidc_display_name: e.target.value,
                })
              }
              label={t("settings.unifiedAuthDisplayName")}
              required={oidcEnabled}
            />
            <NoMarginHelperText>{t("settings.unifiedAuthDisplayNameDes")}</NoMarginHelperText>
          </FormControl>

          <FormControl fullWidth>
            <FormControlLabel
              control={
                <Switch
                  checked={oidcAutoRedirect}
                  onChange={(e) =>
                    setSettings({
                      oidc_auto_redirect: e.target.checked ? "1" : "0",
                    })
                  }
                />
              }
              label={t("settings.unifiedAuthAutoRedirect")}
            />
            <NoMarginHelperText>{t("settings.unifiedAuthAutoRedirectDes")}</NoMarginHelperText>
          </FormControl>

          <FormControl fullWidth>
            <DenseFilledTextField
              select
              value={oidcConfigMode}
              onChange={(e) =>
                setSettings({
                  oidc_config_mode: e.target.value,
                })
              }
              label={t("settings.oidcConfigMode")}
              required={oidcEnabled}
              fullWidth
            >
              <MenuItem value="standard">{t("settings.oidcConfigModeStandard")}</MenuItem>
              <MenuItem value="remote">{t("settings.oidcConfigModeRemote")}</MenuItem>
            </DenseFilledTextField>
            <NoMarginHelperText>{t("settings.oidcConfigModeDes")}</NoMarginHelperText>
          </FormControl>

          <Collapse in={!remoteConfigMode} unmountOnExit>
            <Stack spacing={2.5}>
              <FormControl fullWidth>
                <DenseFilledTextField
                  value={values.oidc_sso_url ?? ""}
                  onChange={(e) =>
                    setSettings({
                      oidc_sso_url: e.target.value,
                    })
                  }
                  label={t("settings.oidcSsoUrl")}
                  placeholder={"https://auth.example.com/sso"}
                />
                <NoMarginHelperText>{t("settings.oidcSsoUrlDes")}</NoMarginHelperText>
              </FormControl>

              <FormControl fullWidth>
                <DenseFilledTextField
                  value={values.oidc_wellknown_url ?? ""}
                  onChange={(e) =>
                    setSettings({
                      oidc_wellknown_url: e.target.value,
                    })
                  }
                  label={t("settings.oidcWellknownUrl")}
                  placeholder={"https://auth.example.com/.well-known/openid-configuration"}
                  required={oidcEnabled}
                />
                <NoMarginHelperText>{t("settings.oidcWellknownUrlDes")}</NoMarginHelperText>
              </FormControl>

              <FormControl fullWidth>
                <DenseFilledTextField
                  value={values.oidc_client_id ?? ""}
                  onChange={(e) =>
                    setSettings({
                      oidc_client_id: e.target.value,
                    })
                  }
                  label={t("settings.clientID")}
                  required={oidcEnabled}
                />
                <NoMarginHelperText>{t("settings.clientIDDes")}</NoMarginHelperText>
              </FormControl>

              <FormControl fullWidth>
                <DenseFilledTextField
                  value={values.oidc_client_secret ?? ""}
                  onChange={(e) =>
                    setSettings({
                      oidc_client_secret: e.target.value,
                    })
                  }
                  label={t("settings.clientSecret")}
                  type={"password"}
                  required={oidcEnabled}
                />
                <NoMarginHelperText>{t("settings.clientSecretDes")}</NoMarginHelperText>
              </FormControl>

              <FormControl fullWidth>
                <DenseFilledTextField
                  value={values.oidc_scope ?? ""}
                  onChange={(e) =>
                    setSettings({
                      oidc_scope: e.target.value,
                    })
                  }
                  label={t("settings.scope")}
                  required={oidcEnabled}
                />
                <NoMarginHelperText>{t("settings.unifiedAuthScopeDes")}</NoMarginHelperText>
              </FormControl>
            </Stack>
          </Collapse>

          <Collapse in={remoteConfigMode} unmountOnExit>
            <Stack spacing={2.5}>
              {oidcEnabled && runtimeState && (
                <Alert severity={runtimeSeverity} variant="outlined">
                  <Typography variant="body2" fontWeight={600}>
                    {t("settings.oidcRuntimeStateTitle")}
                  </Typography>
                  <Typography variant="body2">
                    {t("settings.oidcRuntimeStateSummary", {
                      status: runtimeState.status ?? "-",
                      source: runtimeState.source ?? "-",
                    })}
                  </Typography>
                  {runtimeState.client_id && (
                    <Typography variant="body2">
                      {t("settings.clientID")}: {runtimeState.client_id}
                    </Typography>
                  )}
                  {runtimeState.sso_url && (
                    <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                      {t("settings.oidcSsoUrl")}: {runtimeState.sso_url}
                    </Typography>
                  )}
                  {runtimeState.wellknown_url && (
                    <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                      {t("settings.oidcWellknownUrl")}: {runtimeState.wellknown_url}
                    </Typography>
                  )}
                  {runtimeState.scope && (
                    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                      {t("settings.scope")}: {runtimeState.scope}
                    </Typography>
                  )}
                  {runtimeState.last_success_at && (
                    <Typography variant="body2">
                      {t("settings.oidcRuntimeLastSuccessAt")}: {runtimeState.last_success_at}
                    </Typography>
                  )}
                  {runtimeState.cache_expires_at && (
                    <Typography variant="body2">
                      {t("settings.oidcRuntimeCacheExpiresAt")}: {runtimeState.cache_expires_at}
                    </Typography>
                  )}
                  {runtimeState.last_error && (
                    <Typography variant="body2" color="warning.main" sx={{ wordBreak: "break-word" }}>
                      {t("settings.oidcRuntimeLastError")}: {runtimeState.last_error}
                    </Typography>
                  )}
                </Alert>
              )}

              <FormControl fullWidth>
                <DenseFilledTextField
                  value={values.oidc_binding_code ?? ""}
                  onChange={(e) =>
                    setSettings({
                      oidc_binding_code: e.target.value,
                    })
                  }
                  label={t("settings.oidcBindingCode")}
                  required={oidcEnabled}
                />
                <NoMarginHelperText>{t("settings.oidcBindingCodeDes")}</NoMarginHelperText>
              </FormControl>

              <FormControl fullWidth>
                <DenseFilledTextField
                  value={values.oidc_wellknown_url ?? ""}
                  onChange={(e) =>
                    setSettings({
                      oidc_wellknown_url: e.target.value,
                    })
                  }
                  label={t("settings.oidcWellknownUrl")}
                  placeholder={"https://auth.example.com/.well-known/openid-configuration"}
                  required={oidcEnabled}
                />
                <NoMarginHelperText>{t("settings.oidcRemoteDiscoveryUrlDes")}</NoMarginHelperText>
              </FormControl>

              <FormControl fullWidth>
                <DenseFilledTextField
                  value={values.oidc_client_secret ?? ""}
                  onChange={(e) =>
                    setSettings({
                      oidc_client_secret: e.target.value,
                    })
                  }
                  label={t("settings.clientSecret")}
                  type={"password"}
                  required={oidcEnabled}
                />
                <NoMarginHelperText>{t("settings.oidcRemoteClientSecretDes")}</NoMarginHelperText>
              </FormControl>
            </Stack>
          </Collapse>

          <FormControl fullWidth>
            <Typography variant="body2">{t("settings.oidcCallbackUrl")}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, wordBreak: "break-all" }}>
              {callbackURL}
            </Typography>
            <NoMarginHelperText>{t("settings.oidcCallbackUrlDes")}</NoMarginHelperText>
          </FormControl>
        </Stack>
      </AccordionDetails>
    </StyledAccordion>
  );
};

export default SSOSettings;
