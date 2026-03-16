import { ExpandMoreRounded } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  FormControl,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
  styled,
} from "@mui/material";
import MuiAccordionSummary, { AccordionSummaryProps } from "@mui/material/AccordionSummary";
import { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  const { values, setSettings } = useContext(SettingContext);
  const oidcEnabled = isTrueVal(values.oidc_enabled);
  const oidcAutoRedirect = isTrueVal(values.oidc_auto_redirect);
  // 回调地址固定落回当前站点前端路由，便于不同部署环境直接复用。
  const callbackURL = useMemo(() => `${window.location.origin}/session/oidc/callback`, []);

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
        {/* 这里展示的是统一认证最小闭环配置：开关、显示名称、入口地址、发现文档、客户端凭证与 scope。 */}
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
