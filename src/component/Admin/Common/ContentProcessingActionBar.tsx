import { Box, Stack } from "@mui/material";
import React from "react";
import ContentProcessingNavigationLinks from "./ContentProcessingNavigationLinks";
import ContentProcessingSubtypeLinks from "./ContentProcessingSubtypeLinks";
import ContentProcessingTaskStatusLinks from "./ContentProcessingTaskStatusLinks";

export interface ContentProcessingActionBarProps {
  selectedType?: string;
  status?: string;
  showAggregateNavigation?: boolean;
  showQueueNavigation?: boolean;
  showNodeNavigation?: boolean;
  showAllStatus?: boolean;
  showFailedStatus?: boolean;
  showSuspendingStatus?: boolean;
  emphasizeStatusSelection?: boolean;
  aggregateLabel?: React.ReactNode;
  queueLabel?: React.ReactNode;
  nodeLabel?: React.ReactNode;
  allStatusLabel: React.ReactNode;
  failedStatusLabel: React.ReactNode;
  suspendingStatusLabel: React.ReactNode;
}

const ContentProcessingActionBar = ({
  selectedType,
  status,
  showAggregateNavigation = false,
  showQueueNavigation = false,
  showNodeNavigation = false,
  showAllStatus = true,
  showFailedStatus = true,
  showSuspendingStatus = true,
  emphasizeStatusSelection = false,
  aggregateLabel,
  queueLabel,
  nodeLabel,
  allStatusLabel,
  failedStatusLabel,
  suspendingStatusLabel,
}: ContentProcessingActionBarProps) => (
  <Stack spacing={0.5}>
    {(showAggregateNavigation || showQueueNavigation || showNodeNavigation) && (
      <ContentProcessingNavigationLinks
        showAggregate={showAggregateNavigation}
        showQueue={showQueueNavigation}
        showNodes={showNodeNavigation}
        aggregateLabel={aggregateLabel}
        queueLabel={queueLabel}
        nodeLabel={nodeLabel}
      />
    )}
    <ContentProcessingTaskStatusLinks
      type={selectedType}
      status={status}
      showAll={showAllStatus}
      showFailed={showFailedStatus}
      showSuspending={showSuspendingStatus}
      emphasizeSelection={emphasizeStatusSelection}
      allLabel={allStatusLabel}
      failedLabel={failedStatusLabel}
      suspendingLabel={suspendingStatusLabel}
    />
    <Box>
      <ContentProcessingSubtypeLinks selectedType={selectedType} />
    </Box>
  </Stack>
);

export default ContentProcessingActionBar;
