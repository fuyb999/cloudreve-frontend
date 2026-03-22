import { Button, Stack } from "@mui/material";
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { TaskStatus } from "../../../api/workflow";
import { getContentProcessingTaskRoute } from "./contentProcessingRoutes";

export interface ContentProcessingTaskStatusLinksProps {
  type?: string;
  status?: string;
  showAll?: boolean;
  showFailed?: boolean;
  showSuspending?: boolean;
  emphasizeSelection?: boolean;
  allLabel: React.ReactNode;
  failedLabel: React.ReactNode;
  suspendingLabel: React.ReactNode;
}

const getButtonVariant = (emphasizeSelection: boolean, active: boolean) => {
  if (!emphasizeSelection) {
    return "text" as const;
  }

  return active ? ("contained" as const) : ("text" as const);
};

const ContentProcessingTaskStatusLinks = ({
  type,
  status,
  showAll = true,
  showFailed = true,
  showSuspending = true,
  emphasizeSelection = false,
  allLabel,
  failedLabel,
  suspendingLabel,
}: ContentProcessingTaskStatusLinksProps) => (
  <Stack direction="row" spacing={1}>
    {showAll && (
      <Button
        component={RouterLink}
        to={getContentProcessingTaskRoute(type)}
        size="small"
        variant={getButtonVariant(emphasizeSelection, !status)}
        sx={{ px: emphasizeSelection ? 0.5 : 0, minWidth: "auto" }}
      >
        {allLabel}
      </Button>
    )}
    {showFailed && (
      <Button
        component={RouterLink}
        to={getContentProcessingTaskRoute(type, TaskStatus.error)}
        size="small"
        variant={getButtonVariant(emphasizeSelection, status === TaskStatus.error)}
        sx={{ px: emphasizeSelection ? 0.5 : 0, minWidth: "auto" }}
      >
        {failedLabel}
      </Button>
    )}
    {showSuspending && (
      <Button
        component={RouterLink}
        to={getContentProcessingTaskRoute(type, TaskStatus.suspending)}
        size="small"
        variant={getButtonVariant(emphasizeSelection, status === TaskStatus.suspending)}
        sx={{ px: emphasizeSelection ? 0.5 : 0, minWidth: "auto" }}
      >
        {suspendingLabel}
      </Button>
    )}
  </Stack>
);

export default ContentProcessingTaskStatusLinks;
