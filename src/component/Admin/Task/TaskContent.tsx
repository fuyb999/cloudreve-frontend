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

const resolveTaskEntityID = (state: any): number => {
  const candidates = [
    state?.entity_id,
    state?.result?.entity_id,
    state?.payload?.entity_id,
    state?.payload?.entity?.id,
  ];
  return candidates.find((value) => typeof value === "number" && value > 0) ?? 0;
};

const resolveTaskFileID = (state: any): number => {
  const candidates = [state?.file_id, state?.result?.file_id, state?.payload?.file_id];
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
    () => getTaskDisplayType(task.type, task.private_state),
    [task.type, task.private_state],
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
    let privateState: any = {};
    try {
      privateState = JSON.parse(task.private_state ?? "{}");
    } catch (error) {
      console.error(error);
    }

    const fullTextFileIDs = getFullTextTaskFileIDs(privateState);
    const primaryFullTextFileID = fullTextFileIDs[0] ?? 0;
    const entityID = resolveTaskEntityID(privateState);
    const fileID = resolveTaskFileID(privateState);

    switch (taskDisplayType) {
      case TaskType.upload_sentinel_check:
        return t("task.uploadSentinelCheck", { uploadSessionID: privateState?.session?.Props?.UploadSessionID });
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
  }, [entityLinkClick, fileLinkClick, task, taskDisplayType, t]);

  if (isUserTask) {
    return (
      <Typography variant="body2">
        <TaskSummaryTitle
          type={getTaskDisplayType(task.type?.toString(), task.private_state)}
          summary={processedSummary}
          isInDashboard
        />
      </Typography>
    );
  }

  return <Typography variant="body2">{content}</Typography>;
});
