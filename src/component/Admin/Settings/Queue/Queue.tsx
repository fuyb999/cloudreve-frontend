import { Alert, Box, Grid, Stack, Typography } from "@mui/material";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getNodeList, getQueueMetrics } from "../../../../api/api.ts";
import { Node, NodeStatus, NodeType, QueueMetric, QueueType } from "../../../../api/dashboard.ts";
import { NodeCapability } from "../../../../api/workflow.ts";
import { useAppDispatch } from "../../../../redux/hooks.ts";
import Boolset from "../../../../util/boolset.ts";
import { SecondaryButton } from "../../../Common/StyledComponents.tsx";
import ArrowSync from "../../../Icons/ArrowSync.tsx";
import { SettingContext } from "../SettingWrapper.tsx";
import QueueCard from "./QueueCard.tsx";

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
    const eligibleNodes = nodes.filter((node) => {
      if (node.type !== NodeType.slave || !node.capabilities) {
        return false;
      }

      return new Boolset(node.capabilities).enabled(NodeCapability.content_processing);
    });

    const activeNodes = eligibleNodes.filter((node) => node.status === NodeStatus.active);
    const suspendedNodes = eligibleNodes.filter((node) => node.status === NodeStatus.suspended);
    const queueMetric = metrics.find((metric) => metric.name === QueueType.CONTENT_PROCESSING);

    return {
      eligibleNodes,
      activeNodes,
      suspendedNodes,
      queueMetric,
    };
  }, [metrics, nodes]);

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
