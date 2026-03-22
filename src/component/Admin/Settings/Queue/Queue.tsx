import { Alert, Box, Grid, Stack, Typography } from "@mui/material";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getNodeList, getQueueMetrics } from "../../../../api/api.ts";
import { Node, QueueMetric, QueueType } from "../../../../api/dashboard.ts";
import { useAppDispatch } from "../../../../redux/hooks.ts";
import ContentProcessingActionBar from "../../Common/ContentProcessingActionBar.tsx";
import { getContentProcessingHealthSummary } from "../../Common/contentProcessingHealth.ts";
import { SecondaryButton } from "../../../Common/StyledComponents.tsx";
import ArrowSync from "../../../Icons/ArrowSync.tsx";
import { SettingContext } from "../SettingWrapper.tsx";
import QueueCard from "./QueueCard.tsx";

const getNodeLabel = (node: Node) => node.name?.trim() || `#${node.id}`;

const Queue = () => {
  const { t } = useTranslation("dashboard");
  const dispatch = useAppDispatch();
  const { formRef, setSettings, values } = useContext(SettingContext);
  const [metrics, setMetrics] = useState<QueueMetric[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueueMetrics = () => {
    setLoading(true);
    Promise.all([
      dispatch(getQueueMetrics()),
      dispatch(
        getNodeList({
          page: 1,
          page_size: 1000,
          order_by: "",
          order_direction: "desc",
          conditions: {},
        }),
      ),
    ])
      .then(([queueMetrics, nodeList]) => {
        setMetrics(queueMetrics);
        setNodes(nodeList.nodes);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQueueMetrics();
  }, []);

  const contentProcessingSummary = useMemo(() => {
    const queueMetric = metrics.find((metric) => metric.name === QueueType.CONTENT_PROCESSING);
    const configuredWorkers = Math.max(parseInt(values.queue_content_processing_worker_num ?? "0") || 0, 0);
    return getContentProcessingHealthSummary({ nodes, queueMetric, configuredWorkers, t });
  }, [metrics, nodes, t, values.queue_content_processing_worker_num]);

  return (
    <Box component={"form"} ref={formRef} sx={{ p: 2, pt: 0 }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <SecondaryButton onClick={fetchQueueMetrics} disabled={loading} variant={"contained"} startIcon={<ArrowSync />}>
          {t("node.refresh")}
        </SecondaryButton>
      </Stack>
      {!loading && (
        <Alert
          severity={contentProcessingSummary.activeNodes.length > 0 ? "info" : "warning"}
          sx={{ mb: 2, alignItems: "center" }}
        >
          <Typography variant="body2" fontWeight={600}>
            {t("queue.contentProcessingNodeHealthTitle")}
          </Typography>
          <Typography variant="body2">
            {t("queue.contentProcessingNodeHealth", {
              total: contentProcessingSummary.eligibleNodes.length,
              active: contentProcessingSummary.activeNodes.length,
              suspended: contentProcessingSummary.suspendedNodes.length,
              submitted: contentProcessingSummary.queueMetric?.submitted_tasks ?? 0,
              busy: contentProcessingSummary.queueMetric?.busy_workers ?? 0,
            })}
          </Typography>
          {contentProcessingSummary.activeNodes.length === 0 && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {t("queue.contentProcessingNodeHealthWarning")}
            </Typography>
          )}
        </Alert>
      )}
      {!loading && (
        <Alert
          severity={contentProcessingSummary.warnings.length > 0 ? "warning" : "info"}
          sx={{ mb: 2, alignItems: "flex-start" }}
        >
          <Typography variant="body2" fontWeight={600}>
            {t("queue.contentProcessingInspectionTitle")}
          </Typography>
          <Box sx={{ mt: 0.5, mb: 0.5 }}>
            <ContentProcessingActionBar
              showNodeNavigation
              nodeLabel={t("queue.contentProcessingInspectionOpenNodes")}
              allStatusLabel={t("queue.contentProcessingInspectionOpenTasks")}
              failedStatusLabel={t("queue.contentProcessingInspectionOpenFailedTasks")}
              suspendingStatusLabel={t("queue.contentProcessingInspectionOpenSuspendingTasks")}
              showFailedStatus={(contentProcessingSummary.queueMetric?.failure_tasks ?? 0) > 0}
              showSuspendingStatus={(contentProcessingSummary.queueMetric?.suspending_tasks ?? 0) > 0}
            />
          </Box>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {t("queue.contentProcessingInspectionActiveNodes", {
              names:
                contentProcessingSummary.activeNodes.map((node) => getNodeLabel(node)).join(", ") ||
                t("queue.contentProcessingInspectionNone"),
            })}
          </Typography>
          <Typography variant="body2">
            {t("queue.contentProcessingInspectionSuspendedNodes", {
              names:
                contentProcessingSummary.suspendedNodes.map((node) => getNodeLabel(node)).join(", ") ||
                t("queue.contentProcessingInspectionNone"),
            })}
          </Typography>
          <Typography variant="body2">
            {t("queue.contentProcessingInspectionQueueState", {
              workers: contentProcessingSummary.configuredWorkers,
              submitted: contentProcessingSummary.queueMetric?.submitted_tasks ?? 0,
              busy: contentProcessingSummary.queueMetric?.busy_workers ?? 0,
              suspending: contentProcessingSummary.queueMetric?.suspending_tasks ?? 0,
              failed: contentProcessingSummary.queueMetric?.failure_tasks ?? 0,
            })}
          </Typography>
          {contentProcessingSummary.warnings.length > 0 ? (
            contentProcessingSummary.warnings.map((warning, index) => (
              <Typography key={index} variant="body2" sx={{ mt: 0.5 }}>
                {t("queue.contentProcessingInspectionRiskPrefix", { message: warning })}
              </Typography>
            ))
          ) : (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {t("queue.contentProcessingInspectionHealthy")}
            </Typography>
          )}
        </Alert>
      )}
      <Grid container spacing={2}>
        {!loading &&
          metrics.map((metric) => (
            <QueueCard
              key={metric.name}
              metrics={metric}
              queue={metric.name}
              settings={values}
              setSettings={setSettings}
              loading={loading}
              contentProcessingHealth={
                metric.name === QueueType.CONTENT_PROCESSING
                  ? {
                      activeNodes: contentProcessingSummary.activeNodes.length,
                      totalNodes: contentProcessingSummary.eligibleNodes.length,
                      configuredWorkers: contentProcessingSummary.configuredWorkers ?? 0,
                    }
                  : undefined
              }
            />
          ))}
        {loading &&
          Array.from(Array(6)).map((_, index) => (
            <QueueCard key={`loading-${index}`} settings={values} setSettings={setSettings} loading={true} />
          ))}
      </Grid>
    </Box>
  );
};

export default Queue;
