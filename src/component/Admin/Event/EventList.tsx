import {
  Badge,
  Box,
  Button,
  Container,
  DialogContent,
  MenuItem,
  Popover,
  PopoverProps,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import { TFunction } from "i18next";
import { bindPopover, bindTrigger, usePopupState } from "material-ui-popup-state/hooks";
import { useQueryState } from "nuqs";
import React from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAuditLogList } from "../../../api/api.ts";
import { AdminListService, AuditLog } from "../../../api/dashboard.ts";
import { AuditLogType } from "../../../api/explorer.ts";
import { useAppDispatch } from "../../../redux/hooks.ts";
import {
  DenseFilledTextField,
  DenseSelect,
  NoWrapTableCell,
  SecondaryButton,
  StyledTableContainerPaper,
} from "../../Common/StyledComponents.tsx";
import DraggableDialog from "../../Dialogs/DraggableDialog.tsx";
import ArrowSync from "../../Icons/ArrowSync.tsx";
import Filter from "../../Icons/Filter.tsx";
import PageContainer from "../../Pages/PageContainer.tsx";
import PageHeader from "../../Pages/PageHeader.tsx";
import SettingForm from "../../Pages/Setting/SettingForm.tsx";
import TablePagination from "../Common/TablePagination.tsx";
import { OrderByQuery, OrderDirectionQuery, PageQuery, PageSizeQuery } from "../StoragePolicy/StoragePolicySetting.tsx";
import { getEventName, implementedAuditLogTypes } from "./auditEvents.ts";

const EventTypeQuery = "type";
const UserQuery = "user";
const FileQuery = "file";
const CorrelationIDQuery = "correlation_id";
const IPQuery = "ip";

const getEventLabel = (t: TFunction<"dashboard">, eventType?: number) => {
  if (eventType === undefined) {
    return "";
  }

  const eventName = getEventName(eventType);
  return t(`settings.event.${eventName}`, { defaultValue: eventName });
};

const summarizeLog = (log: AuditLog, t: TFunction<"dashboard">) => {
  switch (log.type) {
    case AuditLogType.email_sent:
      return t("event.emailSend", {
        title: log.content?.email_title ?? "",
        email: log.content?.email_to ?? "",
      });
    case AuditLogType.user_login_failed:
      return t("event.signinFailed", {
        reason: log.content?.reason ?? "",
      });
    case AuditLogType.webdav_account_create:
      return t("event.createDavAccount", {
        account: log.content?.account ?? "",
      });
    case AuditLogType.webdav_account_update:
      return t("event.updateDavAccount", {
        account: log.content?.account ?? "",
      });
    case AuditLogType.webdav_account_delete:
      return t("event.deleteDavAccount", {
        account: log.content?.account ?? "",
      });
    case AuditLogType.change_nick:
      return t("event.nickChange", {
        old: log.content?.old ?? "",
        new: log.content?.new ?? "",
      });
    default:
      return getEventLabel(t, log.type);
  }
};

interface EventFilterPopoverProps extends PopoverProps {
  type: string;
  setType: (value: string) => void;
  user: string;
  setUser: (value: string) => void;
  file: string;
  setFile: (value: string) => void;
  correlationID: string;
  setCorrelationID: (value: string) => void;
  ip: string;
  setIP: (value: string) => void;
  clearFilters: () => void;
}

const EventFilterPopover = ({
  type,
  setType,
  user,
  setUser,
  file,
  setFile,
  correlationID,
  setCorrelationID,
  ip,
  setIP,
  clearFilters,
  onClose,
  open,
  ...rest
}: EventFilterPopoverProps) => {
  const { t } = useTranslation("dashboard");
  const [localType, setLocalType] = useState(type);
  const [localUser, setLocalUser] = useState(user);
  const [localFile, setLocalFile] = useState(file);
  const [localCorrelationID, setLocalCorrelationID] = useState(correlationID);
  const [localIP, setLocalIP] = useState(ip);

  useEffect(() => {
    if (open) {
      setLocalType(type);
      setLocalUser(user);
      setLocalFile(file);
      setLocalCorrelationID(correlationID);
      setLocalIP(ip);
    }
  }, [correlationID, file, ip, open, type, user]);

  const handleApply = () => {
    setType(localType);
    setUser(localUser);
    setFile(localFile);
    setCorrelationID(localCorrelationID);
    setIP(localIP);
    onClose?.({}, "backdropClick");
  };

  const handleReset = () => {
    setLocalType("");
    setLocalUser("");
    setLocalFile("");
    setLocalCorrelationID("");
    setLocalIP("");
    clearFilters();
    onClose?.({}, "backdropClick");
  };

  return (
    <Popover
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          sx: {
            p: 2,
            width: 320,
            maxWidth: "100%",
          },
        },
      }}
      onClose={onClose}
      open={open}
      {...rest}
    >
      <Stack spacing={2}>
        <SettingForm title={t("event.type")} noContainer lgWidth={12}>
          <DenseSelect
            fullWidth
            value={localType}
            size="small"
            onChange={(e) => setLocalType(e.target.value as string)}
          >
            <MenuItem value="">{t("event.allEventTypes", { defaultValue: "全部事件" })}</MenuItem>
            {implementedAuditLogTypes.map((eventType) => (
              <MenuItem key={eventType} value={eventType.toString()}>
                {getEventLabel(t, eventType)}
              </MenuItem>
            ))}
          </DenseSelect>
        </SettingForm>
        <SettingForm title={t("event.userID")} noContainer lgWidth={12}>
          <DenseFilledTextField
            fullWidth
            value={localUser}
            onChange={(e) => setLocalUser(e.target.value)}
            size="small"
          />
        </SettingForm>
        <SettingForm title={t("event.fileID")} noContainer lgWidth={12}>
          <DenseFilledTextField
            fullWidth
            value={localFile}
            onChange={(e) => setLocalFile(e.target.value)}
            size="small"
          />
        </SettingForm>
        <SettingForm title={t("event.ip")} noContainer lgWidth={12}>
          <DenseFilledTextField fullWidth value={localIP} onChange={(e) => setLocalIP(e.target.value)} size="small" />
        </SettingForm>
        <SettingForm title={t("event.correlationId")} noContainer lgWidth={12}>
          <DenseFilledTextField
            fullWidth
            value={localCorrelationID}
            onChange={(e) => setLocalCorrelationID(e.target.value)}
            size="small"
          />
        </SettingForm>
        <Box display="flex" justifyContent="space-between">
          <Button variant="outlined" size="small" onClick={handleReset}>
            {t("user.reset")}
          </Button>
          <Button variant="contained" size="small" onClick={handleApply}>
            {t("user.apply")}
          </Button>
        </Box>
      </Stack>
    </Popover>
  );
};

const EventDetailDialog = ({ log, onClose }: { log?: AuditLog; onClose: () => void }) => {
  const { t } = useTranslation("dashboard");

  return (
    <DraggableDialog
      title={t("event.eventDialogTitle")}
      dialogProps={{
        open: !!log,
        onClose,
        maxWidth: "md",
        fullWidth: true,
      }}
    >
      {log && (
        <DialogContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t("event.datetime")}
              </Typography>
              <Typography variant="body2">{dayjs(log.created_at).format("YYYY-MM-DD HH:mm:ss")}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t("event.type")}
              </Typography>
              <Typography variant="body2">{getEventLabel(t, log.type)}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t("event.event")}
              </Typography>
              <Typography variant="body2">{summarizeLog(log, t)}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t("event.ip")}
              </Typography>
              <Typography variant="body2">{log.ip || "-"}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t("event.correlationId")}
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                {log.correlation_id || "-"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t("event.linkedUser")}
              </Typography>
              <Typography variant="body2">{log.edges?.user?.id ?? "-"}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t("event.linkedFile")}
              </Typography>
              <Typography variant="body2">{log.edges?.file?.id ?? "-"}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t("event.linkedEntity")}
              </Typography>
              <Typography variant="body2">{log.edges?.entity?.id ?? "-"}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t("event.linkedShare")}
              </Typography>
              <Typography variant="body2">{log.edges?.share?.id ?? "-"}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {t("event.rawContent")}
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 2,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  overflow: "auto",
                  fontSize: 13,
                }}
              >
                {JSON.stringify(log.content ?? {}, null, 2)}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
      )}
    </DraggableDialog>
  );
};

const EventList = () => {
  const { t } = useTranslation(["dashboard", "application"]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [count, setCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | undefined>(undefined);
  const [page, setPage] = useQueryState(PageQuery, { defaultValue: "1" });
  const [pageSize, setPageSize] = useQueryState(PageSizeQuery, { defaultValue: "10" });
  const [orderBy, setOrderBy] = useQueryState(OrderByQuery, { defaultValue: "" });
  const [orderDirection, setOrderDirection] = useQueryState(OrderDirectionQuery, { defaultValue: "desc" });
  const [type, setType] = useQueryState(EventTypeQuery, { defaultValue: "" });
  const [user, setUser] = useQueryState(UserQuery, { defaultValue: "" });
  const [file, setFile] = useQueryState(FileQuery, { defaultValue: "" });
  const [correlationID, setCorrelationID] = useQueryState(CorrelationIDQuery, { defaultValue: "" });
  const [ip, setIP] = useQueryState(IPQuery, { defaultValue: "" });
  const filterPopupState = usePopupState({
    variant: "popover",
    popupId: "eventFilterPopover",
  });

  const pageInt = parseInt(page) || 1;
  const pageSizeInt = parseInt(pageSize) || 10;
  const orderById = orderBy === "id" || orderBy === "";
  const direction = orderDirection as "asc" | "desc";

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params: AdminListService = {
      page: pageInt,
      page_size: pageSizeInt,
      order_by: orderBy ?? "",
      order_direction: orderDirection ?? "desc",
      conditions: {
        audit_log_type: type,
        audit_log_user_id: user,
        audit_log_file_id: file,
        audit_log_correlation_id: correlationID,
        audit_log_ip: ip,
      },
    };

    dispatch(getAuditLogList(params))
      .then((res) => {
        setLogs(res.logs);
        setPageSize(res.pagination.page_size.toString());
        setCount(res.pagination.total_items ?? 0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [correlationID, dispatch, file, ip, orderBy, orderDirection, pageInt, pageSizeInt, setPageSize, type, user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const clearFilters = () => {
    setType("");
    setUser("");
    setFile("");
    setCorrelationID("");
    setIP("");
  };

  const onSortClick = (field: string) => () => {
    const alreadySorted = orderBy === field || (field === "id" && orderById);
    setOrderBy(field);
    setOrderDirection(alreadySorted ? (direction === "asc" ? "desc" : "asc") : "asc");
  };

  const hasActiveFilters = !!(type || user || file || correlationID || ip);

  return (
    <PageContainer>
      <EventDetailDialog log={selectedLog} onClose={() => setSelectedLog(undefined)} />
      <Container maxWidth="xl">
        <PageHeader title={t("dashboard:nav.events")} />
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <EventFilterPopover
            {...bindPopover(filterPopupState)}
            type={type}
            setType={setType}
            user={user}
            setUser={setUser}
            file={file}
            setFile={setFile}
            correlationID={correlationID}
            setCorrelationID={setCorrelationID}
            ip={ip}
            setIP={setIP}
            clearFilters={clearFilters}
          />
          <SecondaryButton onClick={fetchLogs} disabled={loading} variant="contained" startIcon={<ArrowSync />}>
            {t("dashboard:node.refresh")}
          </SecondaryButton>
          <Badge color="primary" variant="dot" invisible={!hasActiveFilters}>
            <SecondaryButton startIcon={<Filter />} variant="contained" {...bindTrigger(filterPopupState)}>
              {t("dashboard:user.filter")}
            </SecondaryButton>
          </Badge>
        </Stack>
        <TableContainer component={StyledTableContainerPaper} sx={{ mt: 2 }}>
          <Table size="small" stickyHeader sx={{ width: "100%", tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                <NoWrapTableCell width={80}>
                  <TableSortLabel
                    active={orderById}
                    direction={orderById ? direction : "asc"}
                    onClick={onSortClick("id")}
                  >
                    {t("dashboard:group.#")}
                  </TableSortLabel>
                </NoWrapTableCell>
                <NoWrapTableCell width={180}>
                  <TableSortLabel
                    active={orderBy === "created_at"}
                    direction={orderBy === "created_at" ? direction : "asc"}
                    onClick={onSortClick("created_at")}
                  >
                    {t("dashboard:event.datetime")}
                  </TableSortLabel>
                </NoWrapTableCell>
                {!isMobile && <NoWrapTableCell width={260}>{t("dashboard:event.event")}</NoWrapTableCell>}
                <NoWrapTableCell width={180}>
                  <TableSortLabel
                    active={orderBy === "type"}
                    direction={orderBy === "type" ? direction : "asc"}
                    onClick={onSortClick("type")}
                  >
                    {t("dashboard:event.type")}
                  </TableSortLabel>
                </NoWrapTableCell>
                {!isMobile && <NoWrapTableCell width={100}>{t("dashboard:event.userID")}</NoWrapTableCell>}
                {!isMobile && <NoWrapTableCell width={100}>{t("dashboard:event.fileID")}</NoWrapTableCell>}
                <NoWrapTableCell width={140}>
                  <TableSortLabel
                    active={orderBy === "ip"}
                    direction={orderBy === "ip" ? direction : "asc"}
                    onClick={onSortClick("ip")}
                  >
                    {t("dashboard:event.ip")}
                  </TableSortLabel>
                </NoWrapTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow hover key={log.id} sx={{ cursor: "pointer" }} onClick={() => setSelectedLog(log)}>
                  <TableCell>{log.id}</TableCell>
                  <TableCell>{dayjs(log.created_at).format("YYYY-MM-DD HH:mm:ss")}</TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {summarizeLog(log, t)}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {getEventLabel(t, log.type)}
                    </Typography>
                  </TableCell>
                  {!isMobile && <TableCell>{log.edges?.user?.id ?? "-"}</TableCell>}
                  {!isMobile && <TableCell>{log.edges?.file?.id ?? "-"}</TableCell>}
                  <TableCell>{log.ip || "-"}</TableCell>
                </TableRow>
              ))}
              {!loading && logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isMobile ? 4 : 7}>
                    <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>
                      {t("application:modals.noResults")}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          page={pageInt}
          totalItems={count}
          rowsPerPage={pageSizeInt}
          onRowsPerPageChange={(value) => setPageSize(value.toString())}
          onChange={(_e, value) => setPage(value.toString())}
        />
      </Container>
    </PageContainer>
  );
};

export default EventList;
