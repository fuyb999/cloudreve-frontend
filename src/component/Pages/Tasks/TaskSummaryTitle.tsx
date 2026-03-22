import { Box, Chip, styled, Typography } from "@mui/material";
import React, { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { FileType } from "../../../api/explorer.ts";
import { TaskSummary, TaskType } from "../../../api/workflow.ts";
import { useAppSelector } from "../../../redux/hooks.ts";
import { newMyUri } from "../../../util/uri.ts";
import FileBadge from "../../FileManager/FileBadge.tsx";

export interface TaskSummaryTitleProps {
  type: string;
  summary?: TaskSummary;
  isInDashboard?: boolean;
}

const StyledFileBadge = styled(FileBadge)(() => ({
  paddingLeft: 8,
  paddingRight: 8,
  marginLeft: 4,
  marginRight: 4,
  maxWidth: "200px",
}));

const StyledChip = styled(Chip)(() => ({
  marginLeft: 8,
  height: "20px",
}));

const getSummaryEntityID = (summary?: TaskSummary): number => {
  return summary?.props?.entity_id ?? 0;
};

const getSummaryFileID = (summary?: TaskSummary): number => {
  return summary?.props?.file_id ?? 0;
};

const TaskSummaryTitle = ({ type, summary, isInDashboard = false }: TaskSummaryTitleProps) => {
  const { t } = useTranslation();
  const policyOption = useAppSelector((state) => state.globalState.policyOptionCache);

  const selectedCount = useMemo(() => {
    let selected = 0;
    for (const file of summary?.props.download?.files ?? []) {
      if (file.selected) {
        selected++;
      }
    }

    return selected;
  }, [summary?.props.download?.files]);

  switch (type) {
    case TaskType.remote_download:
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Typography variant={"inherit"} sx={{}}>
            {isInDashboard && t("dashboard:task.remoteDownload")}
            {summary?.props.download?.name ?? t("download.unknownTaskName")}
            {selectedCount > 1 && <StyledChip color={"primary"} size="small" label={selectedCount} />}
          </Typography>
        </Box>
      );
    case TaskType.create_archive:
      return (
        <Trans
          i18nKey="setting.createArchiveTo"
          components={[
            <span key={0}>
              {summary?.props.src_multiple?.slice(0, 3).map((src, index) => (
                <StyledFileBadge
                  key={`${index}_${src}`}
                  variant={"outlined"}
                  simplifiedFile={{
                    type: FileType.file,
                    path: src,
                  }}
                />
              ))}
            </span>,
            <StyledFileBadge
              key={1}
              variant={"outlined"}
              simplifiedFile={{
                type: FileType.file,
                path: summary?.props.dst ? summary?.props.dst : newMyUri("").toString(),
              }}
            />,
          ]}
          values={{
            more: (summary?.props.src_multiple?.length ?? 0) > 3 ? "..." : "",
          }}
        />
      );
    case TaskType.import:
      return (
        <Trans
          i18nKey="setting.importFileTo"
          values={{
            policy: policyOption
              ? policyOption.find((p) => p.id == summary?.props.dst_policy_id)?.name ?? "Unknown"
              : "",
          }}
          components={[
            <StyledFileBadge
              key={0}
              variant={"outlined"}
              simplifiedFile={{
                type: FileType.folder,
                path: summary?.props.dst ? summary?.props.dst : newMyUri("").toString(),
              }}
            />,
          ]}
        />
      );
    case TaskType.full_text_rebuild:
      return (
        <Typography variant={"inherit"}>
          {t("setting.rebuildFTSIndex", {
            total: summary?.props.total ?? "-",
          })}
        </Typography>
      );
    case TaskType.media_metadata:
      return getSummaryEntityID(summary) > 0 ? (
        <Trans
          ns="dashboard"
          values={{ entityID: getSummaryEntityID(summary) }}
          i18nKey="task.mediaMetadata"
          components={[<span key={0} />]}
        />
      ) : (
        <Typography variant={"inherit"}>{t("task.media_metadata")}</Typography>
      );
    case TaskType.document_inspect:
      return getSummaryEntityID(summary) > 0 ? (
        <Trans
          ns="dashboard"
          values={{ entityID: getSummaryEntityID(summary) }}
          i18nKey="task.documentInspect"
          components={[<span key={0} />]}
        />
      ) : (
        <Typography variant={"inherit"}>{t("task.document_inspect")}</Typography>
      );
    case TaskType.thumbnail_generate:
      if (getSummaryFileID(summary) > 0) {
        return (
          <Trans
            ns="dashboard"
            values={{ fileID: getSummaryFileID(summary) }}
            i18nKey="task.thumbnailGenerateFile"
            components={[<span key={0} />]}
          />
        );
      }
      if (getSummaryEntityID(summary) > 0) {
        return (
          <Trans
            ns="dashboard"
            values={{ entityID: getSummaryEntityID(summary) }}
            i18nKey="task.thumbnailGenerateEntity"
            components={[<span key={0} />]}
          />
        );
      }
      return t("task.thumbnail_generate");
    default:
      return (
        <Trans
          i18nKey="setting.extractFileTo"
          components={[
            <StyledFileBadge
              key={0}
              variant={"outlined"}
              simplifiedFile={{
                type: FileType.file,
                path: summary?.props.src ? summary?.props.src : newMyUri("").toString(),
              }}
            />,
            <StyledFileBadge
              key={1}
              variant={"outlined"}
              simplifiedFile={{
                type: FileType.folder,
                path: summary?.props.dst ? summary?.props.dst : newMyUri("").toString(),
              }}
            />,
          ]}
          values={{
            more: (summary?.props.src_multiple?.length ?? 0) > 3 ? "..." : "",
          }}
        />
      );
  }
};

export default TaskSummaryTitle;
