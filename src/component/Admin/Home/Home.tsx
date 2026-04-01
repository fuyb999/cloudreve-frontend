import {
  Alert,
  Avatar,
  Box,
  Container,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  styled,
  Typography,
} from "@mui/material";
import { blue, green, red, yellow } from "@mui/material/colors";
import Grid from "@mui/material/Grid";
import dayjs from "dayjs";
import React from "react";
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDashboardSummary, getNodeList, getQueueMetrics } from "../../../api/api.ts";
import { HomepageSummary, Node, QueueMetric, QueueType } from "../../../api/dashboard.ts";
import { useAppDispatch } from "../../../redux/hooks.ts";
import FacebookCircularProgress from "../../Common/CircularProgress.tsx";
import { SecondaryButton } from "../../Common/StyledComponents.tsx";
import TimeBadge from "../../Common/TimeBadge.tsx";
import BoxMultipleFilled from "../../Icons/BoxMultipleFilled.tsx";
import DocumentCopyFilled from "../../Icons/DocumentCopyFilled.tsx";
import PeopleFilled from "../../Icons/PeopleFilled.tsx";
import ShareFilled from "../../Icons/ShareFilled.tsx";
import PageContainer from "../../Pages/PageContainer.tsx";
import PageHeader from "../../Pages/PageHeader.tsx";
import ContentProcessingActionBar from "../Common/ContentProcessingActionBar.tsx";
import { getContentProcessingHealthSummary } from "../Common/contentProcessingHealth.ts";
import SiteUrlWarning from "./SiteUrlWarning.tsx";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  boxShadow: "initial",
  border: "1px solid " + theme.palette.divider,
}));

const UploadedUserAxisTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value?: string } }) => {
  const value = payload?.value ?? "";
  const label = value.length > 14 ? `${value.slice(0, 14)}...` : value;

  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <text x={-8} y={4} textAnchor="end" fill="currentColor" fontSize={12}>
        <title>{value}</title>
        {label}
      </text>
    </g>
  );
};

const Home = () => {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [summary, setSummary] = useState<HomepageSummary | undefined>();
  const [chartLoading, setChartLoading] = useState(false);
  const [uploadRangeDays, setUploadRangeDays] = useState(0);
  const [siteUrlWarning, setSiteUrlWarning] = useState(false);
  const [contentProcessingLoading, setContentProcessingLoading] = useState(false);
  const [contentProcessingNodes, setContentProcessingNodes] = useState<Node[]>([]);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetric[]>([]);
  useEffect(() => {
    loadSummary(false, uploadRangeDays);
    loadContentProcessingSummary();
  }, []);

  const loadSummary = useCallback(
    (loadChart?: boolean, rangeDays: number = uploadRangeDays) => {
      if (loadChart) {
        setChartLoading(true);
      }
      dispatch(getDashboardSummary(loadChart, rangeDays))
        .then((r) => {
          setSummary(r);
          if (!loadChart) {
            const target = r.site_urls.find((site) => site == window.location.origin);
            if (!target) {
              setSiteUrlWarning(true);
            }
          }
        })
        .finally(() => {
          setChartLoading(false);
        });
    },
    [dispatch, uploadRangeDays],
  );

  const loadContentProcessingSummary = useCallback(() => {
    setContentProcessingLoading(true);
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
      .then(([metrics, nodeList]) => {
        setQueueMetrics(metrics);
        setContentProcessingNodes(nodeList.nodes);
      })
      .finally(() => {
        setContentProcessingLoading(false);
      });
  }, [dispatch]);

  const contentProcessingOverview = (() => {
    const queueMetric = queueMetrics.find((metric) => metric.name === QueueType.CONTENT_PROCESSING);
    const health = getContentProcessingHealthSummary({
      nodes: contentProcessingNodes,
      queueMetric,
      t,
    });

    return {
      total: health.eligibleNodes.length,
      active: health.activeNodes.length,
      suspended: health.suspendedNodes.length,
      submitted: queueMetric?.submitted_tasks ?? 0,
      busy: queueMetric?.busy_workers ?? 0,
      failed: queueMetric?.failure_tasks ?? 0,
      suspending: queueMetric?.suspending_tasks ?? 0,
      warnings: health.warnings,
    };
  })();
  const uploadRanking = (summary?.metrics_summary?.top_upload_users ?? []).map((item) => ({
    user_id: item.user_id,
    name: item.display_name,
    count: item.file_count,
  }));
  const openUserFromRanking = useCallback(
    (userID?: number) => {
      if (!userID) {
        return;
      }

      const params = new URLSearchParams({
        page: "1",
        id: userID.toString(),
        dialog_user_id: userID.toString(),
      });
      navigate(`/admin/user?${params.toString()}`);
    },
    [navigate],
  );
  const handleUploadRangeChange = useCallback(
    (nextRangeDays: number) => {
      if (nextRangeDays === uploadRangeDays) {
        return;
      }

      setUploadRangeDays(nextRangeDays);
      loadSummary(true, nextRangeDays);
    },
    [loadSummary, uploadRangeDays],
  );
  const uploadRangeOptions = [
    { value: 7, label: t("summary.last7Days") },
    { value: 30, label: t("summary.last30Days") },
    { value: 0, label: t("summary.allTime") },
  ];

  return (
    <PageContainer>
      <SiteUrlWarning
        open={siteUrlWarning}
        onClose={() => setSiteUrlWarning(false)}
        existingUrls={summary?.site_urls ?? []}
      />
      <Container maxWidth="xl">
        <PageHeader title={t("nav.summary")} />
        <Grid container spacing={3}>
          <Grid alignContent={"stretch"} item xs={12} md={8} lg={9}>
            <Stack spacing={3}>
              <StyledPaper>
                <Typography
                  variant={"subtitle1"}
                  fontWeight={500}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {t("summary.trend")}
                  <Typography variant={"body2"} color={"text.secondary"}>
                    {summary?.metrics_summary?.generated_at && (
                      <Trans
                        i18nKey={"summary.generatedAt"}
                        ns={"dashboard"}
                        components={[
                          <TimeBadge
                            key="generated-at"
                            datetime={summary?.metrics_summary?.generated_at}
                            variant={"inherit"}
                          />,
                        ]}
                      />
                    )}
                  </Typography>
                </Typography>
                <Divider sx={{ mb: 2, mt: 1 }} />
                <SwitchTransition>
                  <CSSTransition
                    addEndListener={(node, done) => node.addEventListener("transitionend", done, false)}
                    classNames="fade"
                    key={`${!!summary?.metrics_summary}-${!!chartLoading}`}
                  >
                    <Box>
                      {summary?.metrics_summary && (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart
                            height={350}
                            data={summary?.metrics_summary.dates.map((i, d) => ({
                              name: dayjs(i).format("MM-DD"),
                              user: summary?.metrics_summary?.users[d] ?? 0,
                              file: summary?.metrics_summary?.files[d] ?? 0,
                              share: summary?.metrics_summary?.shares[d] ?? 0,
                            }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis
                              allowDecimals={false}
                              width={(() => {
                                const yAxisValue = [
                                  ...(summary?.metrics_summary?.users ?? []),
                                  ...(summary?.metrics_summary?.files ?? []),
                                  ...(summary?.metrics_summary?.shares ?? []),
                                ];
                                const yAxisUpperLimit = yAxisValue.length ? Math.max(...yAxisValue) / 0.8 - 1 : 0;
                                const yAxisDigits =
                                  yAxisUpperLimit > 1 ? Math.floor(Math.log10(yAxisUpperLimit)) + 1 : 1;
                                return 3 + yAxisDigits * 9;
                              })()}
                            />
                            <RechartsTooltip />
                            <Legend />
                            <Line name={t("nav.users")} type="monotone" dataKey="user" stroke={blue[600]} />
                            <Line name={t("nav.files")} type="monotone" dataKey="file" stroke={yellow[800]} />
                            <Line name={t("nav.shares")} type="monotone" dataKey="share" stroke={green[800]} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                      {chartLoading && (
                        <Box
                          sx={{
                            height: "300px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FacebookCircularProgress />
                        </Box>
                      )}
                      {!summary?.metrics_summary?.generated_at && !chartLoading && (
                        <Box
                          sx={{
                            height: "300px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <SecondaryButton onClick={() => loadSummary(true)}>
                            {t("application:fileManager.calculate")}
                          </SecondaryButton>
                        </Box>
                      )}
                    </Box>
                  </CSSTransition>
                </SwitchTransition>
              </StyledPaper>

              <StyledPaper>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography variant={"subtitle1"} fontWeight={500}>
                    {t("summary.topUploadUsers")}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {uploadRangeOptions.map((option) => (
                      <SecondaryButton
                        key={option.value}
                        size="small"
                        disabled={chartLoading}
                        onClick={() => handleUploadRangeChange(option.value)}
                        sx={
                          uploadRangeDays === option.value
                            ? {
                                backgroundColor: "primary.main",
                                color: "primary.contrastText",
                                "&:hover": {
                                  backgroundColor: "primary.dark",
                                },
                              }
                            : undefined
                        }
                      >
                        {option.label}
                      </SecondaryButton>
                    ))}
                  </Stack>
                </Box>
                <Divider sx={{ mb: 2, mt: 1 }} />
                <SwitchTransition>
                  <CSSTransition
                    addEndListener={(node, done) => node.addEventListener("transitionend", done, false)}
                    classNames="fade"
                    key={`upload-ranking-${!!summary?.metrics_summary}-${!!chartLoading}-${uploadRanking.length}`}
                  >
                    <Box>
                      {summary?.metrics_summary && uploadRanking.length > 0 && (
                        <ResponsiveContainer width="100%" height={Math.max(300, uploadRanking.length * 44)}>
                          <BarChart
                            data={uploadRanking}
                            layout="vertical"
                            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={140}
                              tickLine={false}
                              axisLine={false}
                              tick={<UploadedUserAxisTick />}
                            />
                            <RechartsTooltip
                              formatter={(value: number, _name, item) => [
                                value.toLocaleString(),
                                item?.payload?.name ?? t("summary.uploadedFiles"),
                              ]}
                              labelFormatter={() => t("summary.uploadRankingTooltip")}
                            />
                            <Bar
                              name={t("summary.uploadedFiles")}
                              dataKey="count"
                              fill={blue[600]}
                              radius={[0, 4, 4, 0]}
                              maxBarSize={28}
                              cursor="pointer"
                              onClick={(item) => openUserFromRanking(item?.payload?.user_id)}
                            >
                              <LabelList
                                dataKey="count"
                                position="right"
                                formatter={(value: number) => value.toLocaleString()}
                                style={{ fill: "currentColor", fontSize: 12 }}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                      {summary?.metrics_summary && uploadRanking.length === 0 && !chartLoading && (
                        <Box
                          sx={{
                            height: "300px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {t("summary.noUploadUsers")}
                          </Typography>
                        </Box>
                      )}
                      {chartLoading && (
                        <Box
                          sx={{
                            height: "300px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FacebookCircularProgress />
                        </Box>
                      )}
                      {!summary?.metrics_summary?.generated_at && !chartLoading && (
                        <Box
                          sx={{
                            height: "300px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <SecondaryButton onClick={() => loadSummary(true)}>
                            {t("application:fileManager.calculate")}
                          </SecondaryButton>
                        </Box>
                      )}
                    </Box>
                  </CSSTransition>
                </SwitchTransition>
              </StyledPaper>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4} lg={3}>
            <Stack spacing={3}>
              <StyledPaper>
                <Typography variant={"subtitle1"} fontWeight={500}>
                  {t("summary.summary")}
                </Typography>
                <Divider sx={{ mb: 2, mt: 1 }} />
                <SwitchTransition>
                  <CSSTransition
                    addEndListener={(node, done) => node.addEventListener("transitionend", done, false)}
                    classNames="fade"
                    key={`${!!summary?.metrics_summary}-${chartLoading}`}
                  >
                    <Box>
                      {summary?.metrics_summary && (
                        <List disablePadding sx={{ minHeight: "300px" }}>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  backgroundColor: blue[100],
                                  color: blue[600],
                                }}
                              >
                                <PeopleFilled />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              secondary={t("summary.totalUsers")}
                              primary={summary.metrics_summary.user_total.toLocaleString()}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  backgroundColor: yellow[100],
                                  color: yellow[800],
                                }}
                              >
                                <DocumentCopyFilled />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              secondary={t("summary.totalFilesAndFolders")}
                              primary={summary.metrics_summary.file_total.toLocaleString()}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  backgroundColor: green[100],
                                  color: green[800],
                                }}
                              >
                                <ShareFilled />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              secondary={t("summary.shareLinks")}
                              primary={summary.metrics_summary.share_total.toLocaleString()}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  backgroundColor: red[100],
                                  color: red[800],
                                }}
                              >
                                <BoxMultipleFilled />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              secondary={t("summary.totalBlobs")}
                              primary={summary.metrics_summary.entities_total.toLocaleString()}
                            />
                          </ListItem>
                        </List>
                      )}
                      {chartLoading && (
                        <Box
                          sx={{
                            height: "300px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FacebookCircularProgress />
                        </Box>
                      )}
                      {!summary?.metrics_summary?.generated_at && !chartLoading && (
                        <Box
                          sx={{
                            height: "300px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <SecondaryButton onClick={() => loadSummary(true)}>
                            {t("application:fileManager.calculate")}
                          </SecondaryButton>
                        </Box>
                      )}
                    </Box>
                  </CSSTransition>
                </SwitchTransition>
              </StyledPaper>

              <StyledPaper>
                <Typography variant={"subtitle1"} fontWeight={500}>
                  {t("summary.contentProcessingOverview")}
                </Typography>
                <Divider sx={{ mb: 2, mt: 1 }} />
                {contentProcessingLoading ? (
                  <Box sx={{ minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FacebookCircularProgress />
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    <Typography variant="body2">
                      {t("summary.contentProcessingNodeState", {
                        total: contentProcessingOverview.total,
                        active: contentProcessingOverview.active,
                        suspended: contentProcessingOverview.suspended,
                      })}
                    </Typography>
                    <Typography variant="body2">
                      {t("summary.contentProcessingQueueState", {
                        submitted: contentProcessingOverview.submitted,
                        busy: contentProcessingOverview.busy,
                        suspending: contentProcessingOverview.suspending,
                        failed: contentProcessingOverview.failed,
                      })}
                    </Typography>
                    <Alert severity={contentProcessingOverview.warnings.length > 0 ? "warning" : "info"}>
                      {contentProcessingOverview.warnings.length === 0
                        ? t("summary.contentProcessingHealthy")
                        : t("summary.contentProcessingWarning")}
                    </Alert>
                    {contentProcessingOverview.warnings.length > 0 &&
                      contentProcessingOverview.warnings.map((warning, index) => (
                        <Typography key={index} variant="body2">
                          {t("summary.contentProcessingRiskPrefix", { message: warning })}
                        </Typography>
                      ))}
                    <ContentProcessingActionBar
                      showQueueNavigation
                      showNodeNavigation
                      queueLabel={t("summary.openContentProcessingQueue")}
                      nodeLabel={t("summary.openContentProcessingNodes")}
                      allStatusLabel={t("summary.openContentProcessingTasks")}
                      failedStatusLabel={t("summary.openFailedContentProcessingTasks")}
                      suspendingStatusLabel={t("summary.openSuspendingContentProcessingTasks")}
                      showFailedStatus={contentProcessingOverview.failed > 0}
                      showSuspendingStatus={contentProcessingOverview.suspending > 0}
                    />
                    <Box>
                      <SecondaryButton onClick={loadContentProcessingSummary} size="small">
                        {t("node.refresh")}
                      </SecondaryButton>
                    </Box>
                  </Stack>
                )}
              </StyledPaper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </PageContainer>
  );
};

export default Home;
