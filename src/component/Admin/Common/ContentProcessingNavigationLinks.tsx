import { Button, Stack } from "@mui/material";
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  contentProcessingNodeRoute,
  contentProcessingQueueRoute,
  getContentProcessingTaskRoute,
} from "./contentProcessingRoutes";

export interface ContentProcessingNavigationLinksProps {
  showAggregate?: boolean;
  showQueue?: boolean;
  showNodes?: boolean;
  aggregateLabel?: React.ReactNode;
  queueLabel?: React.ReactNode;
  nodeLabel?: React.ReactNode;
}

const ContentProcessingNavigationLinks = ({
  showAggregate = false,
  showQueue = false,
  showNodes = false,
  aggregateLabel,
  queueLabel,
  nodeLabel,
}: ContentProcessingNavigationLinksProps) => (
  <Stack direction="row" spacing={1}>
    {showAggregate && (
      <Button component={RouterLink} to={getContentProcessingTaskRoute()} size="small" sx={{ px: 0, minWidth: "auto" }}>
        {aggregateLabel}
      </Button>
    )}
    {showQueue && (
      <Button component={RouterLink} to={contentProcessingQueueRoute} size="small" sx={{ px: 0, minWidth: "auto" }}>
        {queueLabel}
      </Button>
    )}
    {showNodes && (
      <Button component={RouterLink} to={contentProcessingNodeRoute} size="small" sx={{ px: 0, minWidth: "auto" }}>
        {nodeLabel}
      </Button>
    )}
  </Stack>
);

export default ContentProcessingNavigationLinks;
