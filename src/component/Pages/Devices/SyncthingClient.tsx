import { Alert, Box, Button, Card, CardContent, Chip, Grid, Skeleton, Stack, Typography } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSyncthingDevices, sendDeleteSyncthingDevice, sendUnbindSyncthingDevice } from "../../../api/api.ts";
import { SyncthingDevice } from "../../../api/setting.ts";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks.ts";
import { confirmOperation } from "../../../redux/thunks/dialog.ts";
import TimeBadge from "../../Common/TimeBadge.tsx";
import ArrowClockwiseFilled from "../../Icons/ArrowClockwiseFilled.tsx";
import DeleteOutlined from "../../Icons/DeleteOutlined.tsx";
import Download from "../../Icons/Download.tsx";

const SyncthingClient = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const title = useAppSelector((state) => state.siteConfig.basic.config.title);
  const appLinuxURL = useAppSelector((state) => state.siteConfig.app.config?.syncthing_download_linux_url);
  const basicLinuxURL = useAppSelector((state) => state.siteConfig.basic.config?.syncthing_download_linux_url);
  const appWindowsURL = useAppSelector((state) => state.siteConfig.app.config?.syncthing_download_windows_url);
  const basicWindowsURL = useAppSelector((state) => state.siteConfig.basic.config?.syncthing_download_windows_url);
  const linuxURL = appLinuxURL ?? basicLinuxURL ?? "";
  const windowsURL = appWindowsURL ?? basicWindowsURL ?? "";
  const [devices, setDevices] = useState<SyncthingDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [unbindingDeviceID, setUnbindingDeviceID] = useState("");
  const [deletingDeviceID, setDeletingDeviceID] = useState("");

  const currentPlatform = useMemo(() => {
    if (typeof navigator === "undefined") {
      return "";
    }

    const source = `${navigator.userAgent} ${navigator.platform}`.toLowerCase();
    if (source.includes("windows")) {
      return "windows";
    }
    if (source.includes("linux")) {
      return "linux";
    }
    return "";
  }, []);

  const loadDevices = useCallback(() => {
    setLoading(true);
    dispatch(getSyncthingDevices())
      .then((res) => {
        setDevices(res.devices ?? []);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dispatch]);

  const unbindDevice = useCallback(
    (device: SyncthingDevice) => {
      dispatch(
        confirmOperation(t("setting.syncthingUnbindConfirm", { device: device.short_id || device.device_id })),
      ).then(() => {
        setUnbindingDeviceID(device.device_id);
        dispatch(sendUnbindSyncthingDevice(device.device_id))
          .then(() => {
            loadDevices();
          })
          .finally(() => {
            setUnbindingDeviceID("");
          });
      });
    },
    [dispatch, loadDevices, t],
  );

  const deleteDevice = useCallback(
    (device: SyncthingDevice) => {
      dispatch(
        confirmOperation(t("setting.syncthingDeleteConfirm", { device: device.short_id || device.device_id })),
      ).then(() => {
        setDeletingDeviceID(device.device_id);
        dispatch(sendDeleteSyncthingDevice(device.device_id))
          .then(() => {
            loadDevices();
          })
          .finally(() => {
            setDeletingDeviceID("");
          });
      });
    },
    [dispatch, loadDevices, t],
  );

  useEffect(() => {
    loadDevices();

    const timer = window.setInterval(() => {
      loadDevices();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [loadDevices]);

  return (
    <Grid
      container
      spacing={3}
      sx={{
        px: 2,
        pt: 4,
        pb: 4,
      }}
    >
      <Grid item xs={12} md={5}>
        <Card
          variant="outlined"
          sx={{
            height: "100%",
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box mb={2}>
              <Typography variant="h4" fontWeight={700}>
                {t("setting.syncthingTitleLead")}
                <Typography color="primary" component="span" variant="inherit">
                  {title}
                </Typography>
                {t("setting.syncthingTitleTrail")}
              </Typography>
            </Box>
            <Typography color="text.secondary" variant="body1" sx={{ mb: 3 }}>
              {t("setting.syncthingDescription")}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 3 }}>
              <Button
                component="a"
                href={windowsURL || undefined}
                target={windowsURL ? "_blank" : undefined}
                rel={windowsURL ? "noreferrer" : undefined}
                variant={currentPlatform === "windows" ? "contained" : "outlined"}
                startIcon={<Download />}
                disabled={!windowsURL}
              >
                {t("setting.syncthingDownloadWindows")}
              </Button>
              <Button
                component="a"
                href={linuxURL || undefined}
                target={linuxURL ? "_blank" : undefined}
                rel={linuxURL ? "noreferrer" : undefined}
                variant={currentPlatform === "linux" ? "contained" : "outlined"}
                startIcon={<Download />}
                disabled={!linuxURL}
              >
                {t("setting.syncthingDownloadLinux")}
              </Button>
            </Stack>
            <Alert severity="info" sx={{ mb: 2 }}>
              {t("setting.syncthingDownloadHint")}
            </Alert>
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t("setting.syncthingBindingHint")}
            </Alert>
            <Box
              color="text.secondary"
              sx={{
                ol: {
                  paddingInlineStart: "20px",
                  margin: 0,
                },
                li: {
                  marginBottom: 1.25,
                },
              }}
            >
              <ol>
                <li>{t("setting.syncthingStepInstall")}</li>
                <li>{t("setting.syncthingStepOAuth")}</li>
                <li>{t("setting.syncthingStepRegister")}</li>
              </ol>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={7}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            {t("setting.syncthingRegisteredDevices")}
          </Typography>
          <Button size="small" startIcon={<ArrowClockwiseFilled />} onClick={loadDevices} disabled={loading}>
            {t("application:fileManager.refresh")}
          </Button>
        </Box>
        <Stack spacing={2}>
          {loading &&
            devices.length === 0 &&
            [...Array(2)].map((_, index) => (
              <Card key={index} variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Skeleton variant="text" width={160} height={36} />
                  <Skeleton variant="text" width={"80%"} />
                  <Skeleton variant="text" width={"60%"} />
                  <Skeleton variant="text" width={"70%"} />
                </CardContent>
              </Card>
            ))}
          {!loading && devices.length === 0 && (
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography color="text.secondary">{t("setting.syncthingEmpty")}</Typography>
              </CardContent>
            </Card>
          )}
          {devices.map((device) => (
            <Card key={device.device_id} variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    mb: 1.5,
                    flexWrap: "wrap",
                  }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {device.short_id || device.device_id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {device.device_id}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip
                      color={device.online ? "success" : "default"}
                      label={device.online ? t("setting.syncthingOnline") : t("setting.syncthingOffline")}
                      size="small"
                    />
                    <Chip
                      color={device.is_bound ? "primary" : "warning"}
                      label={device.is_bound ? t("setting.syncthingBound") : t("setting.syncthingUnbound")}
                      size="small"
                    />
                    <Button
                      size="small"
                      color="warning"
                      variant="outlined"
                      onClick={() => unbindDevice(device)}
                      disabled={
                        !device.is_bound ||
                        unbindingDeviceID === device.device_id ||
                        deletingDeviceID === device.device_id
                      }
                    >
                      {t("setting.syncthingUnbind")}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<DeleteOutlined />}
                      onClick={() => deleteDevice(device)}
                      disabled={deletingDeviceID === device.device_id || unbindingDeviceID === device.device_id}
                    >
                      {t("setting.syncthingDelete")}
                    </Button>
                  </Stack>
                </Box>
                {!device.is_bound && (
                  <Alert severity="info" sx={{ mb: 1.5 }}>
                    {t("setting.syncthingRestoreHint")}
                  </Alert>
                )}
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t("setting.syncthingBindURI")}
                    </Typography>
                    <Typography variant="body2">{device.bind_uri || t("setting.none")}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t("setting.syncthingIP")}
                    </Typography>
                    <Typography variant="body2">{device.last_ip || t("setting.none")}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t("setting.syncthingVersion")}
                    </Typography>
                    <Typography variant="body2">{device.client_version || t("setting.none")}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t("setting.syncthingPlatform")}
                    </Typography>
                    <Typography variant="body2">{device.platform || t("setting.none")}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t("setting.syncthingLastSeen")}
                    </Typography>
                    <Typography variant="body2">
                      {device.last_seen_at ? (
                        <TimeBadge datetime={device.last_seen_at} variant="inherit" />
                      ) : (
                        t("setting.none")
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t("setting.syncthingLastSync")}
                    </Typography>
                    <Typography variant="body2">
                      {device.last_sync_at ? (
                        <TimeBadge datetime={device.last_sync_at} variant="inherit" />
                      ) : (
                        t("setting.none")
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Grid>
    </Grid>
  );
};

export default SyncthingClient;
