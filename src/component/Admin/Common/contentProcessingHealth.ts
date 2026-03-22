import { TFunction } from "i18next";
import { Node, NodeStatus, NodeType, QueueMetric } from "../../../api/dashboard";
import { NodeCapability } from "../../../api/workflow";
import Boolset from "../../../util/boolset";

export interface ContentProcessingHealthSummary {
  eligibleNodes: Node[];
  activeNodes: Node[];
  suspendedNodes: Node[];
  queueMetric?: QueueMetric;
  configuredWorkers?: number;
  warnings: string[];
}

export const getContentProcessingHealthSummary = ({
  nodes,
  queueMetric,
  configuredWorkers,
  t,
}: {
  nodes: Node[];
  queueMetric?: QueueMetric;
  configuredWorkers?: number;
  t: TFunction;
}): ContentProcessingHealthSummary => {
  const eligibleNodes = nodes.filter((node) => {
    if (node.type !== NodeType.slave || !node.capabilities) {
      return false;
    }

    return new Boolset(node.capabilities).enabled(NodeCapability.content_processing);
  });

  const activeNodes = eligibleNodes.filter((node) => node.status === NodeStatus.active);
  const suspendedNodes = eligibleNodes.filter((node) => node.status === NodeStatus.suspended);
  const warnings: string[] = [];

  if (eligibleNodes.length === 0) {
    warnings.push(t("queue.contentProcessingInspectionRiskNoEligible"));
  } else if (activeNodes.length === 0) {
    warnings.push(t("queue.contentProcessingInspectionRiskNoActive"));
  }

  if (configuredWorkers !== undefined && configuredWorkers <= 0) {
    warnings.push(t("queue.contentProcessingInspectionRiskNoWorkers"));
  }

  if (
    queueMetric &&
    configuredWorkers !== undefined &&
    configuredWorkers > 0 &&
    queueMetric.busy_workers >= configuredWorkers
  ) {
    warnings.push(t("queue.contentProcessingInspectionRiskWorkerSaturated"));
  }

  if (suspendedNodes.length > 0) {
    warnings.push(
      t("queue.contentProcessingInspectionRiskSuspendedNodes", {
        count: suspendedNodes.length,
      }),
    );
  }

  if (queueMetric && queueMetric.failure_tasks > 0) {
    warnings.push(
      t("queue.contentProcessingInspectionRiskFailedTasks", {
        count: queueMetric.failure_tasks,
      }),
    );
  }

  if (queueMetric && queueMetric.suspending_tasks > 0) {
    warnings.push(
      t("queue.contentProcessingInspectionRiskSuspendingTasks", {
        count: queueMetric.suspending_tasks,
      }),
    );
  }

  return {
    eligibleNodes,
    activeNodes,
    suspendedNodes,
    queueMetric,
    configuredWorkers,
    warnings,
  };
};
