import {
  Alert,
  Box,
  Divider,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { QueueMetric, QueueType } from "../../../../api/dashboard.ts";
import Setting from "../../../Icons/Setting.tsx";
import { StorageBar, StorageBlock, StoragePart } from "../../../Pages/Setting/StorageSetting.tsx";
import { BorderedCard } from "../../Common/AdminCard.tsx";
import QueueSettingDialog from "./QueueSettingDialog.tsx";

export interface QueueCardProps {
  queue?: QueueType;
  settings: {
    [key: string]: string;
  };
  setSettings: (settings: { [key: string]: string }) => void;
  metrics?: QueueMetric;
  loading: boolean;
  contentProcessingHealth?: {
    activeNodes: number;
    totalNodes: number;
    configuredWorkers: number;
  };
}

export const QueueCard = ({
  queue,
  settings,
  metrics,
  setSettings,
  loading,
  contentProcessingHealth,
}: QueueCardProps) => {
  const { t } = useTranslation("dashboard");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [settingDialogOpen, setSettingDialogOpen] = useState(false);
  const progressWidth = (value: number, total: number) => {
    if (total <= 0 || value <= 0) {
      return "0%";
    }

    return `${Math.min((value / total) * 100, 100)}%`;
  };

  if (loading) {
    return (
      <Grid item xs={12} md={6} lg={4}>
        <BorderedCard>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Skeleton variant="text" width={150} height={28} />
            <Skeleton variant="circular" width={24} height={24} />
          </Box>
          <Skeleton variant="text" width="80%" height={20} sx={{ mt: 1 }} />
          <Divider sx={{ my: 2 }} />
          <Skeleton variant="rectangular" height={8} width="100%" sx={{ borderRadius: 1 }} />
          <Stack spacing={isMobile ? 1 : 2} direction={isMobile ? "column" : "row"} sx={{ mt: 1 }}>
            {Array.from(Array(5)).map((_, index) => (
              <Skeleton key={index} variant="text" width={isMobile ? "100%" : 80} height={20} />
            ))}
          </Stack>
        </BorderedCard>
      </Grid>
    );
  }

  return (
    <Grid item xs={12} md={6} lg={4}>
      <BorderedCard>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {t(`queue.queueName_${queue}`)}
          </Typography>
          <IconButton size="small" onClick={() => setSettingDialogOpen(true)}>
            <Setting fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {t(`queue.queueName_${queue}Des`)}
        </Typography>
        {queue === QueueType.CONTENT_PROCESSING && contentProcessingHealth && (
          <Alert
            severity={
              contentProcessingHealth.activeNodes > 0 && contentProcessingHealth.configuredWorkers > 0
                ? "info"
                : "warning"
            }
            sx={{ mt: 1.5, py: 0 }}
          >
            <Typography variant="caption" display="block">
              {t("queue.contentProcessingCardHealth", {
                active: contentProcessingHealth.activeNodes,
                total: contentProcessingHealth.totalNodes,
                workers: contentProcessingHealth.configuredWorkers,
              })}
            </Typography>
            {(contentProcessingHealth.activeNodes <= 0 || contentProcessingHealth.configuredWorkers <= 0) && (
              <Typography variant="caption" display="block">
                {t("queue.contentProcessingCardHealthWarning")}
              </Typography>
            )}
          </Alert>
        )}
        <Divider sx={{ my: 2 }} />
        {metrics && (
          <>
            <StorageBar>
              <StoragePart
                sx={{
                  backgroundColor: (theme) => theme.palette.success.light,
                  width: progressWidth(metrics.success_tasks, metrics.submitted_tasks),
                }}
              />
              <StoragePart
                sx={{
                  backgroundColor: (theme) => theme.palette.error.light,
                  width: progressWidth(metrics.failure_tasks, metrics.submitted_tasks),
                }}
              />
              <StoragePart
                sx={{
                  backgroundColor: (theme) => theme.palette.action.active,
                  width: progressWidth(metrics.suspending_tasks, metrics.submitted_tasks),
                }}
              />
              <StoragePart
                sx={{
                  backgroundColor: (theme) => theme.palette.info.light,
                  width: progressWidth(metrics.busy_workers, metrics.submitted_tasks),
                }}
              />
            </StorageBar>
            <Stack spacing={isMobile ? 1 : 2} direction={isMobile ? "column" : "row"} sx={{ mt: 1 }}>
              <Typography variant={"caption"}>
                <StorageBlock
                  sx={{
                    backgroundColor: (theme) => theme.palette.success.light,
                  }}
                />
                {t("queue.success", {
                  count: metrics.success_tasks,
                })}
              </Typography>
              <Typography variant={"caption"}>
                <StorageBlock
                  sx={{
                    backgroundColor: (theme) => theme.palette.error.light,
                  }}
                />
                {t("queue.failed", {
                  count: metrics.failure_tasks,
                })}
              </Typography>
              <Typography variant={"caption"}>
                <StorageBlock
                  sx={{
                    backgroundColor: (theme) => theme.palette.info.light,
                  }}
                />
                {t("queue.busyWorker", {
                  count: metrics.busy_workers,
                })}
              </Typography>
              <Typography variant={"caption"}>
                <StorageBlock
                  sx={{
                    backgroundColor: (theme) => theme.palette.action.active,
                  }}
                />
                {t("queue.suspending", {
                  count: metrics.suspending_tasks,
                })}
              </Typography>
              <Typography variant={"caption"}>
                <StorageBlock
                  sx={{
                    backgroundColor: (theme) => theme.palette.grey[theme.palette.mode === "light" ? 200 : 800],
                  }}
                />
                {t("queue.submited", {
                  count: metrics.submitted_tasks,
                })}
              </Typography>
            </Stack>
          </>
        )}

        {queue && (
          <QueueSettingDialog
            open={settingDialogOpen}
            onClose={() => setSettingDialogOpen(false)}
            queue={queue}
            settings={settings}
            setSettings={setSettings}
          />
        )}
      </BorderedCard>
    </Grid>
  );
};

export default QueueCard;
