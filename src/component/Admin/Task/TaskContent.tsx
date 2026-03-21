import { Link, Typography } from "@mui/material";
import React, { memo, useCallback, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Task } from "../../../api/dashboard";
import { getFullTextTaskFileIDs, getTaskDisplayType, TaskSummary, TaskType } from "../../../api/workflow";
import CrUri, { Filesystem } from "../../../util/uri";
import TaskSummaryTitle from "../../Pages/Tasks/TaskSummaryTitle";

export const userTaskTypes: string[] = [
  TaskType.relocate,
  TaskType.create_archive,
  TaskType.extract_archive,
  TaskType.remote_download,
  TaskType.import,
  TaskType.full_text_rebuild,
];

export interface TaskContentProps {
  task: Task;
  openEntity?: (entityID: number) => void;
  openFile?: (fileID: number) => void;
}

type TaskPrivateState = Record<string, unknown>;

const parseTaskPrivateState = (state?: string): TaskPrivateState => {
  if (!state) {
    return {};
  }

  try {
    const parsed = JSON.parse(state);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as TaskPrivateState;
    }
  } catch (error) {
    console.error(error);
  }

  return {};
};

const nestedRecord = (value: unknown): TaskPrivateState | undefined => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as TaskPrivateState;
  }
  return undefined;
};

const resolveTaskEntityID = (summary: TaskSummary | undefined, state: TaskPrivateState): number => {
  const candidates = [
    summary?.props?.entity_id,
    state?.entity_id,
    nestedRecord(state?.result)?.entity_id,
    nestedRecord(state?.payload)?.entity_id,
    nestedRecord(nestedRecord(state?.payload)?.entity)?.id,
  ];
  return candidates.find((value) => typeof value === "number" && value > 0) ?? 0;
};

const resolveTaskFileID = (summary: TaskSummary | undefined, state: TaskPrivateState): number => {
  const candidates = [
    summary?.props?.file_id,
    state?.file_id,
    nestedRecord(state?.result)?.file_id,
    nestedRecord(state?.payload)?.file_id,
  ];
  return candidates.find((value) => typeof value === "number" && value > 0) ?? 0;
};

const processUrl = (url: string, userHashId: string) => {
  const crUrl = new CrUri(url);
  if (crUrl.fs() == Filesystem.my && !crUrl.id()) {
    crUrl.setUsername(userHashId);
  }
  return crUrl.toString();
};

export const processTaskContent = (summary: TaskSummary, userHashId: string): TaskSummary => {
  if (summary.props?.src) {
    summary.props.src = processUrl(summary.props.src, userHashId);
  }
  if (summary.props?.dst) {
    summary.props.dst = processUrl(summary.props.dst, userHashId);
  }
  if (summary.props?.src_multiple) {
    summary.props.src_multiple = summary.props.src_multiple.map((url) => processUrl(url, userHashId));
  }

  return summary;
};

export const TaskContent = memo(({ task, openEntity, openFile }: TaskContentProps) => {
  const { t } = useTranslation("dashboard");
  const isUserTask = userTaskTypes.includes(task.type ?? "");
  const taskDisplayType = useMemo(
    () => task.display_type ?? getTaskDisplayType(task.type, task.private_state),
    [task.display_type, task.type, task.private_state],
  );
  const processedSummary = useMemo(() => {
    return processTaskContent({ ...task.summary } as TaskSummary, task?.user_hash_id ?? "");
  }, [task.summary, task.user_hash_id]);

  const entityLinkClick = useCallback(
    (entityID: number) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (openEntity) {
        openEntity(entityID);
      }
    },
    [openEntity],
  );

  const fileLinkClick = useCallback(
    (fileID: number) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (openFile) {
        openFile(fileID);
      }
    },
    [openFile],
  );

  const content = useMemo(() => {
    const privateState = parseTaskPrivateState(task.private_state);
    const fullTextFileIDs = getFullTextTaskFileIDs(privateState);
    const summaryFileID = typeof processedSummary?.props?.file_id === "number" ? processedSummary.props.file_id : 0;
    const primaryFullTextFileID = fullTextFileIDs[0] ?? 0;
    const entityID = resolveTaskEntityID(processedSummary, privateState);
    const fileID = resolveTaskFileID(processedSummary, privateState);
    const explicitEntityIDs = Array.isArray(privateState?.entity_ids)
      ? privateState.entity_ids.filter((id): id is number => typeof id === "number" && id > 0)
      : [];

    switch (taskDisplayType) {
      case TaskType.upload_sentinel_check:
        return t("task.uploadSentinelCheck", {
          uploadSessionID: nestedRecord(nestedRecord(privateState?.session)?.Props)?.UploadSessionID,
        });
      case TaskType.media_metadata:
        return (
          <Trans
            ns="dashboard"
            values={{ entityID }}
            i18nKey="task.mediaMetadata"
            components={[<Link key={0} href={"#/"} onClick={entityLinkClick(entityID)} />]}
          />
        );
      case TaskType.document_inspect:
        if (!entityID) {
          return t("task.document_inspect");
        }
        return (
          <Trans
            ns="dashboard"
            values={{ entityID }}
            i18nKey="task.documentInspect"
            components={[<Link key={0} href={"#/"} onClick={entityLinkClick(entityID)} />]}
          />
        );
      case TaskType.entity_recycle_routine:
        return t("task.entityRecycleRoutine");
      case TaskType.explicit_entity_recycle:
        return t("task.explicitEntityRecycle", {
          blobs: explicitEntityIDs.map((id) => `#${id}`).join(", "),
        });
      case TaskType.full_text_index:
        if (fullTextFileIDs.length > 1) {
          return t("task.fullTextIndexBatch", {
            count: fullTextFileIDs.length,
            defaultValue: "Reconcile full-text index for {{count}} files",
          });
        }
        if (!primaryFullTextFileID && !summaryFileID) {
          return t("task.full_text_index");
        }
        return (
          <Trans
            ns="dashboard"
            values={{ fileID: primaryFullTextFileID || summaryFileID }}
            i18nKey="task.fullTextIndex"
            components={[<Link key={0} href={"#/"} onClick={fileLinkClick(primaryFullTextFileID || summaryFileID)} />]}
          />
        );
      case TaskType.full_text_copy:
        return (
          <Trans
            ns="dashboard"
            values={{ fileID }}
            i18nKey="task.fullTextCopy"
            components={[<Link key={0} href={"#/"} onClick={fileLinkClick(fileID)} />]}
          />
        );
      case TaskType.full_text_change_owner:
        return (
          <Trans
            ns="dashboard"
            values={{ fileID }}
            i18nKey="task.fullTextChangeOwner"
            components={[<Link key={0} href={"#/"} onClick={fileLinkClick(fileID)} />]}
          />
        );
      case TaskType.thumbnail_generate:
        if (fileID > 0) {
          return (
            <Trans
              ns="dashboard"
              values={{ fileID }}
              i18nKey="task.thumbnailGenerateFile"
              components={[<Link key={0} href={"#/"} onClick={fileLinkClick(fileID)} />]}
            />
          );
        }
        if (entityID > 0) {
          return (
            <Trans
              ns="dashboard"
              values={{ entityID }}
              i18nKey="task.thumbnailGenerateEntity"
              components={[<Link key={0} href={"#/"} onClick={entityLinkClick(entityID)} />]}
            />
          );
        }
        return t("task.thumbnail_generate");
      case TaskType.slave_content_processing:
        return t("task.slaveContentProcessing");
      default:
        return "";
    }
  }, [entityLinkClick, fileLinkClick, processedSummary, task.private_state, taskDisplayType, t]);

  if (isUserTask) {
    return (
      <Typography variant="body2">
        <TaskSummaryTitle type={taskDisplayType} summary={processedSummary} isInDashboard />
      </Typography>
    );
  }

  return <Typography variant="body2">{content}</Typography>;
});

TaskContent.displayName = "TaskContent";
