import { Add } from "@mui/icons-material";
import {
  Alert,
  Box,
  Container,
  Grid2 as Grid,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useQueryState } from "nuqs";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getNodeList, getQueueMetrics } from "../../../api/api";
import { Node, QueueMetric, QueueType } from "../../../api/dashboard";
import { useAppDispatch } from "../../../redux/hooks";
import ContentProcessingSubtypeLinks from "../Common/ContentProcessingSubtypeLinks";
import ContentProcessingTaskStatusLinks from "../Common/ContentProcessingTaskStatusLinks";
import { getContentProcessingHealthSummary } from "../Common/contentProcessingHealth";
import { SecondaryButton } from "../../Common/StyledComponents";
import ArrowSync from "../../Icons/ArrowSync";
import QuestionCircle from "../../Icons/QuestionCircle";
import PageContainer from "../../Pages/PageContainer";
import PageHeader from "../../Pages/PageHeader";
import { BorderedCardClickable } from "../Common/AdminCard";
import TablePagination from "../Common/TablePagination";
import { OrderByQuery, OrderDirectionQuery, PageQuery, PageSizeQuery } from "../StoragePolicy/StoragePolicySetting";
import { NewNodeDialog } from "./NewNode/NewNodeDialog";
import NodeCard from "./NodeCard";

const nodeCapabilityCondition = "node_capability";

const NodeSetting = () => {
  const { t } = useTranslation("dashboard");
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetric[]>([]);
  const [page, setPage] = useQueryState(PageQuery, { defaultValue: "1" });
  const [pageSize, setPageSize] = useQueryState(PageSizeQuery, {
    defaultValue: "11",
  });
  const [orderBy] = useQueryState(OrderByQuery, {
    defaultValue: "",
  });
  const [orderDirection] = useQueryState(OrderDirectionQuery, { defaultValue: "desc" });
  const [count, setCount] = useState(0);
  const [createNewOpen, setCreateNewOpen] = useState(false);
  const [capabilityFilter, setCapabilityFilter] = useQueryState("capability", { defaultValue: "all" });
  const capabilityFilterValue = capabilityFilter === "content_processing" ? "content_processing" : "all";

  const pageInt = parseInt(page) ?? 1;
  const pageSizeInt = parseInt(pageSize) ?? 11;
  const contentProcessingSummary = useMemo(() => {
    const queueMetric = queueMetrics.find((metric) => metric.name === QueueType.CONTENT_PROCESSING);
    return getContentProcessingHealthSummary({
      nodes,
      queueMetric,
      t,
    });
  }, [nodes, queueMetrics, t]);

  useEffect(() => {
    fetchNodes();
  }, [capabilityFilterValue, page, pageSize, orderBy, orderDirection]);

  const fetchNodes = () => {
    setLoading(true);
    Promise.all([
      dispatch(
        getNodeList({
          page: pageInt,
          page_size: pageSizeInt,
          order_by: orderBy ?? "",
          order_direction: orderDirection ?? "desc",
          conditions: {
            ...(capabilityFilterValue === "content_processing"
              ? { [nodeCapabilityCondition]: "content_processing" }
              : {}),
          },
        }),
      ),
      dispatch(getQueueMetrics()),
    ])
      .then(([res, metrics]) => {
        setNodes(res.nodes);
        setQueueMetrics(metrics);
        setPage((res.pagination.page + 1).toString());
        setPageSize(res.pagination.page_size.toString());
        setCount(res.pagination.total_items ?? 0);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <PageContainer>
      <NewNodeDialog open={createNewOpen} onClose={() => setCreateNewOpen(false)} />
      <Container maxWidth="xl">
        <PageHeader
          title={t("dashboard:nav.nodes")}
          secondaryAction={
            <IconButton onClick={() => window.open("https://docs.cloudreve.org/usage/slave-node", "_blank")}>
              <QuestionCircle />
            </IconButton>
          }
        />
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <SecondaryButton onClick={fetchNodes} disabled={loading} variant={"contained"} startIcon={<ArrowSync />}>
            {t("node.refresh")}
          </SecondaryButton>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={capabilityFilterValue}
            onChange={(_, nextValue) => {
              if (!nextValue) {
                return;
              }

              setCapabilityFilter(nextValue);
              setPage("1");
            }}
          >
            <ToggleButton value="all">{t("node.filterAll")}</ToggleButton>
            <ToggleButton value="content_processing">{t("node.filterContentProcessing")}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        {!loading && (
          <Alert severity={contentProcessingSummary.warnings.length > 0 ? "warning" : "info"} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={600}>
              {t("node.contentProcessingSummaryTitle")}
            </Typography>
            <ContentProcessingTaskStatusLinks
              allLabel={t("node.openContentProcessingTasks")}
              failedLabel={t("node.openFailedContentProcessingTasks")}
              suspendingLabel={t("node.openSuspendingContentProcessingTasks")}
              showFailed={(contentProcessingSummary.queueMetric?.failure_tasks ?? 0) > 0}
              showSuspending={(contentProcessingSummary.queueMetric?.suspending_tasks ?? 0) > 0}
            />
            <Box sx={{ mb: 0.5 }}>
              <ContentProcessingSubtypeLinks />
            </Box>
            <Typography variant="body2">
              {t("node.contentProcessingSummary", {
                total: contentProcessingSummary.eligibleNodes.length,
                active: contentProcessingSummary.activeNodes.length,
                suspended: contentProcessingSummary.suspendedNodes.length,
              })}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {t("node.contentProcessingQueueState", {
                submitted: contentProcessingSummary.queueMetric?.submitted_tasks ?? 0,
                busy: contentProcessingSummary.queueMetric?.busy_workers ?? 0,
                suspending: contentProcessingSummary.queueMetric?.suspending_tasks ?? 0,
                failed: contentProcessingSummary.queueMetric?.failure_tasks ?? 0,
              })}
            </Typography>
            {contentProcessingSummary.warnings.map((warning, index) => (
              <Typography key={index} variant="body2" sx={{ mt: 0.5 }}>
                {t("node.contentProcessingRiskPrefix", { message: warning })}
              </Typography>
            ))}
            {capabilityFilterValue === "content_processing" && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {t("node.filterContentProcessingHint", {
                  count,
                })}
              </Typography>
            )}
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid
            size={{
              xs: 12,
              md: 6,
              lg: 4,
            }}
          >
            <BorderedCardClickable
              onClick={() => setCreateNewOpen(true)}
              sx={{
                height: "100%",
                borderStyle: "dashed",
                display: "flex",
                alignItems: "center",
                gap: 1,
                justifyContent: "center",
                color: (t) => t.palette.text.secondary,
              }}
            >
              <Add />
              <Typography variant="h6">{t("node.addNewNode")}</Typography>
            </BorderedCardClickable>
          </Grid>
          {!loading && nodes.map((n) => <NodeCard key={n.id} node={n} onRefresh={fetchNodes} />)}
          {loading && nodes.length > 0 && nodes.map((n) => <NodeCard key={`loading-${n.id}`} loading={true} />)}
          {loading &&
            nodes.length === 0 &&
            Array.from(Array(5)).map((_, index) => <NodeCard key={`loading-placeholder-${index}`} loading={true} />)}
        </Grid>
        {count > 0 && (
          <Box sx={{ mt: 1 }}>
            <TablePagination
              page={pageInt}
              totalItems={count}
              rowsPerPage={pageSizeInt}
              rowsPerPageOptions={[11, 25, 50, 100, 200, 500, 1000]}
              onRowsPerPageChange={(value) => setPageSize(value.toString())}
              onChange={(_, value) => setPage(value.toString())}
            />
          </Box>
        )}
      </Container>
    </PageContainer>
  );
};

export default NodeSetting;
