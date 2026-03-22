import { Add } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
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
import { Link as RouterLink } from "react-router-dom";
import { getNodeList } from "../../../api/api";
import { Node, NodeStatus, NodeType } from "../../../api/dashboard";
import { contentProcessingTaskTypes, NodeCapability } from "../../../api/workflow";
import { useAppDispatch } from "../../../redux/hooks";
import Boolset from "../../../util/boolset";
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
    const eligibleNodes = nodes.filter((node) => {
      if (node.type !== NodeType.slave || !node.capabilities) {
        return false;
      }

      return new Boolset(node.capabilities).enabled(NodeCapability.content_processing);
    });

    return {
      total: eligibleNodes.length,
      active: eligibleNodes.filter((node) => node.status === NodeStatus.active).length,
      suspended: eligibleNodes.filter((node) => node.status === NodeStatus.suspended).length,
    };
  }, [nodes]);

  useEffect(() => {
    fetchNodes();
  }, [capabilityFilterValue, page, pageSize, orderBy, orderDirection]);

  const fetchNodes = () => {
    setLoading(true);
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
    )
      .then((res) => {
        setNodes(res.nodes);
        setPage((res.pagination.page + 1).toString());
        setPageSize(res.pagination.page_size.toString());
        setCount(res.pagination.total_items ?? 0);
        setLoading(false);
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
          <Alert severity={contentProcessingSummary.active > 0 ? "info" : "warning"} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={600}>
              {t("node.contentProcessingSummaryTitle")}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5, mb: 0.5 }}>
              <Button
                component={RouterLink}
                to="/admin/task?type=content_processing"
                size="small"
                sx={{ px: 0, minWidth: "auto" }}
              >
                {t("node.openContentProcessingTasks")}
              </Button>
            </Stack>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 0.5 }}>
              {contentProcessingTaskTypes.map((taskType) => (
                <Button
                  key={taskType}
                  component={RouterLink}
                  to={`/admin/task?type=${taskType}`}
                  size="small"
                  sx={{ px: 0.5, minWidth: "auto" }}
                >
                  {t(`task.${taskType}`)}
                </Button>
              ))}
            </Box>
            <Typography variant="body2">
              {t("node.contentProcessingSummary", {
                total: contentProcessingSummary.total,
                active: contentProcessingSummary.active,
                suspended: contentProcessingSummary.suspended,
              })}
            </Typography>
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
