import { Box, FormControl, Stack, Typography } from "@mui/material";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { DenseFilledTextField } from "../../../Common/StyledComponents.tsx";
import SettingForm from "../../../Pages/Setting/SettingForm.tsx";
import { NoMarginHelperText, SettingSection, SettingSectionContent } from "../Settings.tsx";
import { SettingContext } from "../SettingWrapper.tsx";

const syncthingUpgradeVersionPattern = "^v?\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?$";
const syncthingDownloadURLPattern = "https?://.+";
const syncthingUpgradeVersionRegex = /^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const syncthingDownloadURLRegex = /^https?:\/\/.+/i;

const isOptionalSyncthingUpgradeVersion = (value?: string) => {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" || syncthingUpgradeVersionRegex.test(trimmed);
};

const isOptionalSyncthingDownloadURL = (value?: string) => {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" || syncthingDownloadURLRegex.test(trimmed);
};

const SyncthingSettings = () => {
  const { t } = useTranslation("dashboard");
  const { formRef, setSettings, values } = useContext(SettingContext);
  const syncthingWindowsURL = values.syncthing_download_windows_url ?? "";
  const syncthingLinuxURL = values.syncthing_download_linux_url ?? "";
  const syncthingUpgradeVersion = values.syncthing_upgrade_version ?? "";
  const hasSyncthingDownloadURL = syncthingWindowsURL.trim() !== "" || syncthingLinuxURL.trim() !== "";
  const syncthingWindowsURLValid = isOptionalSyncthingDownloadURL(syncthingWindowsURL);
  const syncthingLinuxURLValid = isOptionalSyncthingDownloadURL(syncthingLinuxURL);
  const syncthingUpgradeVersionValid = isOptionalSyncthingUpgradeVersion(syncthingUpgradeVersion);
  const syncthingUpgradeVersionError =
    (hasSyncthingDownloadURL && syncthingUpgradeVersion.trim() === "") || !syncthingUpgradeVersionValid;

  return (
    <Box component={"form"} ref={formRef} onSubmit={(e) => e.preventDefault()}>
      <Stack spacing={5}>
        <SettingSection>
          <Typography variant="h6" gutterBottom>
            {t("application:setting.syncthingClient")}
          </Typography>
          <SettingSectionContent>
            <SettingForm title={t("settings.syncthingWindowsDownloadURL")} lgWidth={5}>
              <FormControl fullWidth>
                <DenseFilledTextField
                  fullWidth
                  type="url"
                  onChange={(e) => setSettings({ syncthing_download_windows_url: e.target.value })}
                  value={values.syncthing_download_windows_url}
                  placeholder="https://downloads.example/syncthing-windows-amd64-v1.30.0.zip"
                  error={!syncthingWindowsURLValid}
                  inputProps={{ pattern: syncthingDownloadURLPattern }}
                />
                <NoMarginHelperText error={!syncthingWindowsURLValid}>
                  {syncthingWindowsURLValid
                    ? t("settings.syncthingWindowsDownloadURLDes")
                    : t("settings.syncthingDownloadURLInvalid")}
                </NoMarginHelperText>
              </FormControl>
            </SettingForm>
            <SettingForm title={t("settings.syncthingLinuxDownloadURL")} lgWidth={5}>
              <FormControl fullWidth>
                <DenseFilledTextField
                  fullWidth
                  type="url"
                  onChange={(e) => setSettings({ syncthing_download_linux_url: e.target.value })}
                  value={values.syncthing_download_linux_url}
                  placeholder="https://downloads.example/syncthing-linux-amd64-v1.30.0.tar.gz"
                  error={!syncthingLinuxURLValid}
                  inputProps={{ pattern: syncthingDownloadURLPattern }}
                />
                <NoMarginHelperText error={!syncthingLinuxURLValid}>
                  {syncthingLinuxURLValid
                    ? t("settings.syncthingLinuxDownloadURLDes")
                    : t("settings.syncthingDownloadURLInvalid")}
                </NoMarginHelperText>
              </FormControl>
            </SettingForm>
            <SettingForm title={t("settings.syncthingUpgradeVersion")} lgWidth={5}>
              <FormControl fullWidth>
                <DenseFilledTextField
                  fullWidth
                  onChange={(e) => setSettings({ syncthing_upgrade_version: e.target.value })}
                  value={values.syncthing_upgrade_version}
                  placeholder="v1.30.0"
                  required={hasSyncthingDownloadURL}
                  error={syncthingUpgradeVersionError}
                  inputProps={{ pattern: syncthingUpgradeVersionPattern }}
                />
                <NoMarginHelperText error={syncthingUpgradeVersionError}>
                  {syncthingUpgradeVersionError
                    ? t("settings.syncthingUpgradeVersionInvalid")
                    : t("settings.syncthingUpgradeVersionDes")}
                </NoMarginHelperText>
              </FormControl>
            </SettingForm>
          </SettingSectionContent>
        </SettingSection>
      </Stack>
    </Box>
  );
};

export default SyncthingSettings;
