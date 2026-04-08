import { Grid, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { TFunction } from "i18next";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FileType } from "../../../api/explorer.ts";
import { getTaskDisplayType, normalizeTaskSummary, TaskResponse, TaskStatus, TaskType } from "../../../api/workflow.ts";
import { sizeToString } from "../../../util";
import { formatDuration } from "../../../util/datetime.ts";
import TimeBadge from "../../Common/TimeBadge.tsx";
import FileBadge from "../../FileManager/FileBadge.tsx";
import { getTaskDiagnosticFields } from "./TaskDiagnosticFields.tsx";

dayjs.extend(duration);

export interface TaskPropsProps {
  task: TaskResponse;
}

interface TaskPropsBlockProps {
  label: string;
  value: React.ReactNode;
}

const TaskPropsBlock = ({ label, value }: TaskPropsBlockProps) => {
  return (
    <Grid container item xs={12} md={6} lg={4} spacing={0}>
      <Grid item xs={4}>
        <Typography variant={"body2"} color={"text.secondary"}>
          {label}
        </Typography>
      </Grid>
      <Grid item xs={8}>
        <Typography
          variant={"body2"}
          sx={{
            mr: 1,
            overflowWrap: "anywhere",
            whiteSpace: "pre-wrap",
          }}
        >
          {value}
        </Typography>
      </Grid>
    </Grid>
  );
};

export const getTaskStatusText = (status: TaskStatus, t: TFunction) => {
  switch (status) {
    case TaskStatus.queued:
      return t("application:setting.queueing");
    case TaskStatus.processing:
      return t("application:setting.processing");
    case TaskStatus.suspending:
      return t("application:setting.processing") + t("application:setting.suspended");
    case TaskStatus.canceled:
      return t("application:setting.canceled");
    case TaskStatus.error:
      return t("application:setting.failed");
    case TaskStatus.completed:
      return t("application:setting.finished");
    default:
      return t("application:uplaoder.unknownStatus");
  }
};

const TaskProps = ({ task }: TaskPropsProps) => {
  const { t } = useTranslation();
  const status = useMemo(() => getTaskStatusText(task.status as TaskStatus, t), [task.status, t]);
  const taskDisplayType = useMemo(
    () => task.display_type ?? getTaskDisplayType(task.type),
    [task.display_type, task.type],
  );
  const normalizedSummary = useMemo(() => normalizeTaskSummary(task.summary), [task.summary]);
  const diagnosticFields = useMemo(() => getTaskDiagnosticFields(normalizedSummary, t), [normalizedSummary, t]);

  return (
    <Grid container spacing={1} rowSpacing={1.5}>
      <TaskPropsBlock
        label={t("fileManager.createdAt")}
        value={<TimeBadge variant={"inherit"} datetime={task.created_at} />}
      />
      <TaskPropsBlock
        label={t("setting.updatedAt")}
        value={<TimeBadge variant={"inherit"} datetime={task.created_at} />}
      />
      <TaskPropsBlock label={t("setting.taskStatus")} value={status} />
      <TaskPropsBlock label={t("modals.processNode")} value={task.node?.name ?? "-"} />
      {normalizedSummary?.props.src && (
        <TaskPropsBlock
          label={t("setting.input")}
          value={
            <FileBadge
              variant={"outlined"}
              simplifiedFile={{
                path: normalizedSummary.props.src,
                type: FileType.file,
              }}
            />
          }
        />
      )}
      {normalizedSummary?.props.src_str && (
        <TaskPropsBlock
          label={t("setting.input")}
          value={
            <Stack sx={{ maxHeight: 80, overflowY: "auto" }}>
              <Typography variant="inherit">{normalizedSummary.props.src_str}</Typography>
            </Stack>
          }
        />
      )}
      {normalizedSummary?.props.src_multiple && (
        <TaskPropsBlock
          label={t("setting.input")}
          value={
            <Stack
              spacing={0.5}
              sx={{
                maxHeight: 160,
                overflowY: "auto",
                padding: "2px 0",
              }}
            >
              {normalizedSummary.props.src_multiple.map((src, index) => (
                <FileBadge
                  key={index}
                  variant={"outlined"}
                  simplifiedFile={{
                    path: src,
                    type: FileType.file,
                  }}
                />
              ))}
            </Stack>
          }
        />
      )}
      {normalizedSummary?.props.dst && (
        <TaskPropsBlock
          label={t("setting.output")}
          value={
            <FileBadge
              variant={"outlined"}
              clickable={
                taskDisplayType == TaskType.remote_download ||
                taskDisplayType == TaskType.extract_archive ||
                taskDisplayType == TaskType.import ||
                taskDisplayType == TaskType.share_save
              }
              simplifiedFile={{
                path: normalizedSummary.props.dst,
                type:
                  taskDisplayType == TaskType.remote_download ||
                  taskDisplayType == TaskType.extract_archive ||
                  taskDisplayType == TaskType.import ||
                  taskDisplayType == TaskType.share_save
                    ? FileType.folder
                    : FileType.file,
              }}
            />
          }
        />
      )}
      {diagnosticFields.map((field) => (
        <TaskPropsBlock key={field.key} label={field.label} value={field.value} />
      ))}
      <TaskPropsBlock label={t("setting.executeDuration")} value={formatDuration(dayjs.duration(task.duration ?? 0))} />
      {task.resume_time && (task.status == TaskStatus.suspending || task.status == TaskStatus.processing) && (
        <TaskPropsBlock
          label={t("setting.resumeAt")}
          value={<TimeBadge variant={"inherit"} datetime={dayjs.unix(task.resume_time)} />}
        />
      )}
      <TaskPropsBlock label={t("setting.retryCount")} value={task.retry_count ?? 0} />
      {!!normalizedSummary?.props.download?.num_pieces && (
        <TaskPropsBlock label={t("download.chunkNumbers")} value={normalizedSummary.props.download?.num_pieces} />
      )}
      {!!normalizedSummary?.props.download?.uploaded && (
        <TaskPropsBlock
          label={t("download.uploaded")}
          value={sizeToString(normalizedSummary.props.download?.uploaded)}
        />
      )}
      {!!normalizedSummary?.props.download?.upload_speed && (
        <TaskPropsBlock
          label={t("download.uploadSpeed")}
          value={`${sizeToString(normalizedSummary.props.download?.upload_speed)}/s`}
        />
      )}
      {!!normalizedSummary?.props.download?.hash && (
        <TaskPropsBlock label={t("download.InfoHash")} value={normalizedSummary.props.download?.hash} />
      )}
    </Grid>
  );
};

export default TaskProps;
