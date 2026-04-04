import {
  Badge,
  Box,
  Chip,
  Container,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import { bindPopover, bindTrigger, usePopupState } from "material-ui-popup-state/hooks";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFTSExternalJobList } from "../../../api/api";
import { AdminListService, FTSExternalJobListItem } from "../../../api/dashboard";
import { useAppDispatch } from "../../../redux/hooks";
import { NoWrapTableCell, SecondaryButton, StyledTableContainerPaper } from "../../Common/StyledComponents";
import TimeBadge from "../../Common/TimeBadge";
import ArrowSync from "../../Icons/ArrowSync";
import Filter from "../../Icons/Filter";
import PageContainer from "../../Pages/PageContainer";
import PageHeader from "../../Pages/PageHeader";
import TablePagination from "../Common/TablePagination";
import FileDialog from "../File/FileDialog/FileDialog";
import { OrderByQuery, OrderDirectionQuery, PageQuery, PageSizeQuery } from "../StoragePolicy/StoragePolicySetting";
import FTSExternalJobDialog from "./FTSExternalJobDialog";
import FTSExternalJobFilterPopover from "./FTSExternalJobFilterPopover";

const RequestIDQuery = "request_id";
const FileIDQuery = "file_id";
const OwnerIDQuery = "owner_id";
const EntityIDQuery = "entity_id";
const StatusQuery = "status";
const ModeQuery = "mode";
const TriggerReasonQuery = "trigger_reason";

const FTSExternalJobList = () => {
  const { t } = useTranslation("dashboard");
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<FTSExternalJobListItem[]>([]);
  const [page, setPage] = useQueryState(PageQuery, { defaultValue: "1" });
  const [pageSize, setPageSize] = useQueryState(PageSizeQuery, { defaultValue: "10" });
  const [orderBy, setOrderBy] = useQueryState(OrderByQuery, { defaultValue: "requested_at" });
  const [orderDirection, setOrderDirection] = useQueryState(OrderDirectionQuery, { defaultValue: "desc" });
  const [requestID, setRequestID] = useQueryState(RequestIDQuery, { defaultValue: "" });
  const [fileID, setFileID] = useQueryState(FileIDQuery, { defaultValue: "" });
  const [ownerID, setOwnerID] = useQueryState(OwnerIDQuery, { defaultValue: "" });
  const [entityID, setEntityID] = useQueryState(EntityIDQuery, { defaultValue: "" });
  const [status, setStatus] = useQueryState(StatusQuery, { defaultValue: "" });
  const [mode, setMode] = useQueryState(ModeQuery, { defaultValue: "" });
  const [triggerReason, setTriggerReason] = useQueryState(TriggerReasonQuery, { defaultValue: "" });
  const [count, setCount] = useState(0);
  const filterPopupState = usePopupState({
    variant: "popover",
    popupId: "ftsExternalJobFilterPopover",
  });
  const [openFileID, setOpenFileID] = useState<number | undefined>(undefined);
  const [openFileDialogOpen, setOpenFileDialogOpen] = useState(false);
  const [openJobID, setOpenJobID] = useState<number | undefined>(undefined);
  const [openJobDialogOpen, setOpenJobDialogOpen] = useState(false);

  const pageInt = Number.parseInt(page, 10) || 1;
  const pageSizeInt = Number.parseInt(pageSize, 10) || 10;

  const clearFilters = useCallback(() => {
    setRequestID("");
    setFileID("");
    setOwnerID("");
    setEntityID("");
    setStatus("");
    setMode("");
    setTriggerReason("");
  }, [setEntityID, setFileID, setMode, setOwnerID, setRequestID, setStatus, setTriggerReason]);

  const fetchJobs = useCallback(() => {
    setLoading(true);
    const params: AdminListService = {
      page: pageInt,
      page_size: pageSizeInt,
      order_by: orderBy ?? "",
      order_direction: orderDirection ?? "desc",
      conditions: {
        fts_external_job_request_id: requestID,
        fts_external_job_file_id: fileID,
        fts_external_job_owner_id: ownerID,
        fts_external_job_entity_id: entityID,
        fts_external_job_status: status,
        fts_external_job_mode: mode,
        fts_external_job_trigger_reason: triggerReason,
      },
    };

    dispatch(getFTSExternalJobList(params))
      .then((res) => {
        setJobs(res.jobs);
        setPageSize(res.pagination.page_size.toString());
        setCount(res.pagination.total_items ?? 0);
      })
      .finally(() => setLoading(false));
  }, [
    dispatch,
    entityID,
    fileID,
    mode,
    orderBy,
    orderDirection,
    ownerID,
    pageInt,
    pageSizeInt,
    requestID,
    setPageSize,
    status,
    triggerReason,
  ]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const hasActiveFilters = useMemo(() => {
    return !!(requestID || fileID || ownerID || entityID || status || mode || triggerReason);
  }, [requestID, fileID, ownerID, entityID, status, mode, triggerReason]);

  const orderById = orderBy === "id" || orderBy === "";
  const direction = orderDirection as "asc" | "desc";
  const onSortClick = (field: string) => () => {
    const alreadySorted = orderBy === field || (field === "id" && orderById);
    setOrderBy(field);
    setOrderDirection(alreadySorted ? (direction === "asc" ? "desc" : "asc") : "asc");
  };

  return (
    <PageContainer>
      <FileDialog open={openFileDialogOpen} onClose={() => setOpenFileDialogOpen(false)} fileID={openFileID} />
      <FTSExternalJobDialog open={openJobDialogOpen} onClose={() => setOpenJobDialogOpen(false)} jobID={openJobID} />
      <Container maxWidth="xl">
        <PageHeader title={t("dashboard:nav.ftsExternalJobs")} />
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <FTSExternalJobFilterPopover
            {...bindPopover(filterPopupState)}
            requestID={requestID}
            setRequestID={setRequestID}
            fileID={fileID}
            setFileID={setFileID}
            ownerID={ownerID}
            setOwnerID={setOwnerID}
            entityID={entityID}
            setEntityID={setEntityID}
            status={status}
            setStatus={setStatus}
            mode={mode}
            setMode={setMode}
            triggerReason={triggerReason}
            setTriggerReason={setTriggerReason}
            clearFilters={clearFilters}
          />

          <SecondaryButton onClick={fetchJobs} disabled={loading} variant="contained" startIcon={<ArrowSync />}>
            {t("node.refresh")}
          </SecondaryButton>

          <Badge color="primary" variant="dot" invisible={!hasActiveFilters}>
            <SecondaryButton startIcon={<Filter />} variant="contained" {...bindTrigger(filterPopupState)}>
              {t("user.filter")}
            </SecondaryButton>
          </Badge>
        </Stack>

        <TableContainer component={StyledTableContainerPaper}>
          <Table size="small" stickyHeader sx={{ width: "100%", tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                <NoWrapTableCell width={80}>
                  <TableSortLabel
                    active={orderById}
                    direction={orderById ? direction : "asc"}
                    onClick={onSortClick("id")}
                  >
                    {t("group.#")}
                  </TableSortLabel>
                </NoWrapTableCell>
                <NoWrapTableCell width={280}>{t("ftsExternalJob.requestId")}</NoWrapTableCell>
                <NoWrapTableCell width={110}>
                  <TableSortLabel
                    active={orderBy === "status"}
                    direction={orderBy === "status" ? direction : "asc"}
                    onClick={onSortClick("status")}
                  >
                    {t("task.status")}
                  </TableSortLabel>
                </NoWrapTableCell>
                <NoWrapTableCell width={90}>
                  <TableSortLabel
                    active={orderBy === "file_id"}
                    direction={orderBy === "file_id" ? direction : "asc"}
                    onClick={onSortClick("file_id")}
                  >
                    {t("ftsExternalJob.fileId")}
                  </TableSortLabel>
                </NoWrapTableCell>
                <NoWrapTableCell width={150}>{t("ftsExternalJob.mode")}</NoWrapTableCell>
                <NoWrapTableCell width={180}>{t("ftsExternalJob.triggerReason")}</NoWrapTableCell>
                <NoWrapTableCell width={90}>
                  <TableSortLabel
                    active={orderBy === "attempt"}
                    direction={orderBy === "attempt" ? direction : "asc"}
                    onClick={onSortClick("attempt")}
                  >
                    {t("ftsExternalJob.attempt")}
                  </TableSortLabel>
                </NoWrapTableCell>
                <NoWrapTableCell width={180}>
                  <TableSortLabel
                    active={orderBy === "requested_at"}
                    direction={orderBy === "requested_at" ? direction : "asc"}
                    onClick={onSortClick("requested_at")}
                  >
                    {t("ftsExternalJob.requestedAt")}
                  </TableSortLabel>
                </NoWrapTableCell>
                <NoWrapTableCell width={180}>
                  <TableSortLabel
                    active={orderBy === "completed_at"}
                    direction={orderBy === "completed_at" ? direction : "asc"}
                    onClick={onSortClick("completed_at")}
                  >
                    {t("ftsExternalJob.completedAt")}
                  </TableSortLabel>
                </NoWrapTableCell>
                <NoWrapTableCell width={140}>{t("ftsExternalJob.sidecar")}</NoWrapTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map((job) => (
                <TableRow
                  hover
                  key={job.id}
                  sx={{ cursor: "pointer" }}
                  onClick={() => {
                    setOpenJobID(job.id);
                    setOpenJobDialogOpen(true);
                  }}
                >
                  <TableCell>{job.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Box sx={{ overflowWrap: "anywhere" }}>{job.request_id}</Box>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {job.has_quality_report && (
                          <Chip size="small" variant="outlined" label={t("ftsExternalJob.quality")} />
                        )}
                        {job.has_result_payload && (
                          <Chip size="small" variant="outlined" label={t("ftsExternalJob.result")} />
                        )}
                        {job.has_error_payload && (
                          <Chip size="small" variant="outlined" label={t("ftsExternalJob.error")} />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={t(`ftsExternalJob.status.${job.status || "unknown"}`)} />
                  </TableCell>
                  <TableCell>
                    {job.file_id ? (
                      <Link
                        href="#/"
                        underline="hover"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenFileID(job.file_id);
                          setOpenFileDialogOpen(true);
                        }}
                      >
                        #{job.file_id}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{job.mode ? t(`ftsExternalJob.modeValue.${job.mode}`) : "-"}</TableCell>
                  <TableCell sx={{ overflowWrap: "anywhere" }}>{job.trigger_reason || "-"}</TableCell>
                  <TableCell>{job.attempt ?? 0}</TableCell>
                  <TableCell>
                    {job.requested_at ? (
                      <TimeBadge datetime={job.requested_at} variant="inherit" timeAgoThreshold={0} />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {job.completed_at ? (
                      <TimeBadge datetime={job.completed_at} variant="inherit" timeAgoThreshold={0} />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{job.manifest_path ? t("common:yes") : t("common:no")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {count > 0 && (
          <Box sx={{ mt: 1 }}>
            <TablePagination
              page={pageInt}
              totalItems={count}
              rowsPerPage={pageSizeInt}
              rowsPerPageOptions={[10, 25, 50, 100, 200]}
              onRowsPerPageChange={(value) => setPageSize(value.toString())}
              onChange={(_, value) => setPage(value.toString())}
            />
          </Box>
        )}
      </Container>
    </PageContainer>
  );
};

export default FTSExternalJobList;
