import { Link, Typography } from "@mui/material";
import { memo, useCallback, useMemo } from "react";
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
    let privateState: any = {};
    try {
      privateState = JSON.parse(task.private_state ?? "{}");
    } catch (error) {
      console.error(error);
    }
    const fullTextFileIDs = getFullTextTaskFileIDs(privateState);
    const primaryFullTextFileID = fullTextFileIDs[0] ?? 0;

    switch (getTaskDisplayType(task.type)) {
      case TaskType.upload_sentinel_check:
        return t("task.uploadSentinelCheck", { uploadSessionID: privateState?.session?.Props?.UploadSessionID });
      case TaskType.media_metadata:
        return (
          <Trans
            ns="dashboard"
            values={{ entityID: privateState?.entity_id ?? 0 }}
            i18nKey="task.mediaMetadata"
            components={[<Link key={0} href={"#/"} onClick={entityLinkClick(privateState?.entity_id ?? 0)} />]}
          />
        );
      case TaskType.entity_recycle_routine:
        return t("task.entityRecycleRoutine");
      case TaskType.explicit_entity_recycle:
        return t("task.explicitEntityRecycle", {
          blobs: privateState?.entity_ids?.map((id: number) => `#${id}`).join(", "),
        });
      case TaskType.full_text_index:
        if (fullTextFileIDs.length > 1) {
          return t("task.fullTextIndexBatch", {
            count: fullTextFileIDs.length,
            defaultValue: "Reconcile full-text index for {{count}} files",
          });
        }
        if (!primaryFullTextFileID) {
          return t("task.full_text_index");
        }
        return (
          <Trans
            ns="dashboard"
            values={{ fileID: primaryFullTextFileID }}
            i18nKey="task.fullTextIndex"
            components={[<Link key={0} href={"#/"} onClick={fileLinkClick(primaryFullTextFileID)} />]}
          />
        );
      case TaskType.full_text_copy:
        return (
          <Trans
            ns="dashboard"
            values={{ fileID: privateState?.file_id ?? 0 }}
            i18nKey="task.fullTextCopy"
            components={[<Link key={0} href={"#/"} onClick={fileLinkClick(privateState?.file_id ?? 0)} />]}
          />
        );
      case TaskType.full_text_change_owner:
        return (
          <Trans
            ns="dashboard"
            values={{ fileID: privateState?.file_id ?? 0 }}
            i18nKey="task.fullTextChangeOwner"
            components={[<Link key={0} href={"#/"} onClick={fileLinkClick(privateState?.file_id ?? 0)} />]}
          />
        );
      default:
        return "";
    }
  }, [task, t]);

  if (isUserTask) {
    return (
      <Typography variant="body2">
        <TaskSummaryTitle type={getTaskDisplayType(task.type?.toString())} summary={processedSummary} isInDashboard />
      </Typography>
    );
  }

  return <Typography variant="body2">{content}</Typography>;
});
