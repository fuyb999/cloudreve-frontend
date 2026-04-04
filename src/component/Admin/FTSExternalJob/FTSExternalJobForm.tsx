import { Box, Chip, Grid2 as Grid, Typography, useTheme } from "@mui/material";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { FTSExternalJob } from "../../../api/dashboard";
import FacebookCircularProgress from "../../Common/CircularProgress";
import TimeBadge from "../../Common/TimeBadge";
import SettingForm from "../../Pages/Setting/SettingForm";

const MonacoEditor = lazy(() => import("../../Viewers/CodeViewer/MonacoEditor"));

const formatJSONLike = (raw?: string) => {
  if (!raw) {
    return "";
  }

  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
};

const FTSExternalJobForm = ({ values }: { values: FTSExternalJob }) => {
  const theme = useTheme();
  const { t } = useTranslation("dashboard");

  return (
    <Box>
      <Grid container spacing={3}>
        <SettingForm title={t("file.id")} noContainer lgWidth={2}>
          <Typography variant="body2" color="textSecondary">
            {values.id}
          </Typography>
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.requestId")} noContainer lgWidth={5}>
          <Typography variant="body2" color="textSecondary" sx={{ overflowWrap: "anywhere" }}>
            {values.request_id || "-"}
          </Typography>
        </SettingForm>

        <SettingForm title={t("task.status")} noContainer lgWidth={2}>
          <Chip size="small" label={t(`ftsExternalJob.status.${values.status || "unknown"}`)} />
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.attempt")} noContainer lgWidth={3}>
          <Typography variant="body2" color="textSecondary">
            {values.attempt ?? 0}
          </Typography>
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.fileId")} noContainer lgWidth={2}>
          <Typography variant="body2" color="textSecondary">
            {values.file_id ?? "-"}
          </Typography>
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.ownerId")} noContainer lgWidth={2}>
          <Typography variant="body2" color="textSecondary">
            {values.owner_id ?? "-"}
          </Typography>
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.entityId")} noContainer lgWidth={2}>
          <Typography variant="body2" color="textSecondary">
            {values.entity_id ?? "-"}
          </Typography>
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.mode")} noContainer lgWidth={3}>
          <Typography variant="body2" color="textSecondary">
            {values.mode ? t(`ftsExternalJob.modeValue.${values.mode}`) : "-"}
          </Typography>
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.triggerReason")} noContainer lgWidth={3}>
          <Typography variant="body2" color="textSecondary" sx={{ overflowWrap: "anywhere" }}>
            {values.trigger_reason || "-"}
          </Typography>
        </SettingForm>

        <SettingForm title={t("file.createdAt")} noContainer lgWidth={4}>
          <Typography variant="body2" color="textSecondary">
            <TimeBadge datetime={values.created_at ?? ""} variant="inherit" timeAgoThreshold={0} />
          </Typography>
        </SettingForm>

        <SettingForm title={t("task.updatedAt")} noContainer lgWidth={4}>
          <Typography variant="body2" color="textSecondary">
            <TimeBadge datetime={values.updated_at ?? ""} variant="inherit" timeAgoThreshold={0} />
          </Typography>
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.requestedAt")} noContainer lgWidth={4}>
          <Typography variant="body2" color="textSecondary">
            <TimeBadge datetime={values.requested_at ?? ""} variant="inherit" timeAgoThreshold={0} />
          </Typography>
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.deadlineAt")} noContainer lgWidth={4}>
          <Typography variant="body2" color="textSecondary">
            {values.deadline_at ? (
              <TimeBadge datetime={values.deadline_at} variant="inherit" timeAgoThreshold={0} />
            ) : (
              "-"
            )}
          </Typography>
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.completedAt")} noContainer lgWidth={4}>
          <Typography variant="body2" color="textSecondary">
            {values.completed_at ? (
              <TimeBadge datetime={values.completed_at} variant="inherit" timeAgoThreshold={0} />
            ) : (
              "-"
            )}
          </Typography>
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.manifestPath")} noContainer lgWidth={12}>
          <Typography variant="body2" color="textSecondary" sx={{ overflowWrap: "anywhere" }}>
            {values.manifest_path || "-"}
          </Typography>
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.snapshotToken")} noContainer lgWidth={12}>
          <Typography variant="body2" color="textSecondary" sx={{ overflowWrap: "anywhere" }}>
            {values.snapshot_token || "-"}
          </Typography>
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.qualityReport")} noContainer lgWidth={12}>
          <Suspense fallback={<FacebookCircularProgress />}>
            <MonacoEditor
              theme={theme.palette.mode === "dark" ? "vs-dark" : "vs"}
              language="json"
              value={formatJSONLike(values.quality_report)}
              height="180px"
              minHeight="180px"
              options={{
                wordWrap: "on",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                readOnly: true,
              }}
            />
          </Suspense>
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.resultPayload")} noContainer lgWidth={12}>
          <Suspense fallback={<FacebookCircularProgress />}>
            <MonacoEditor
              theme={theme.palette.mode === "dark" ? "vs-dark" : "vs"}
              language="json"
              value={formatJSONLike(values.result_payload)}
              height="260px"
              minHeight="260px"
              options={{
                wordWrap: "on",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                readOnly: true,
              }}
            />
          </Suspense>
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.errorPayload")} noContainer lgWidth={12}>
          <Suspense fallback={<FacebookCircularProgress />}>
            <MonacoEditor
              theme={theme.palette.mode === "dark" ? "vs-dark" : "vs"}
              language="json"
              value={formatJSONLike(values.error_payload)}
              height="220px"
              minHeight="220px"
              options={{
                wordWrap: "on",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                readOnly: true,
              }}
            />
          </Suspense>
        </SettingForm>
      </Grid>
    </Box>
  );
};

export default FTSExternalJobForm;
