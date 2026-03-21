import { ReactNode } from "react";
import { TFunction } from "i18next";
import { TaskSummary } from "../../../api/workflow.ts";
import { sizeToString } from "../../../util";

export interface TaskDiagnosticField {
  key: string;
  label: string;
  value: ReactNode;
}

const diagnosticFieldOrder: Array<{
  key: string;
  labelKey: string;
}> = [
  { key: "kind", labelKey: "kind" },
  { key: "file_id", labelKey: "fileID" },
  { key: "owner_id", labelKey: "ownerID" },
  { key: "entity_id", labelKey: "entityID" },
  { key: "policy_id", labelKey: "policyID" },
  { key: "file_name", labelKey: "fileName" },
  { key: "file_size", labelKey: "fileSize" },
  { key: "file_ext", labelKey: "fileExt" },
  { key: "language", labelKey: "language" },
  { key: "ext", labelKey: "ext" },
  { key: "mime_type", labelKey: "mimeType" },
  { key: "parser", labelKey: "parser" },
  { key: "title", labelKey: "title" },
  { key: "author", labelKey: "author" },
  { key: "manifest_path", labelKey: "manifestPath" },
  { key: "save_path", labelKey: "savePath" },
  { key: "size", labelKey: "outputSize" },
  { key: "meta_count", labelKey: "metaCount" },
  { key: "metadata_count", labelKey: "metadataCount" },
  { key: "not_available", labelKey: "notAvailable" },
];

const formatDiagnosticValue = (key: string, value: unknown, t: TFunction): ReactNode => {
  if (typeof value === "boolean") {
    return value ? t("dashboard:yes") : t("dashboard:no");
  }

  if ((key === "file_size" || key === "size") && typeof value === "number") {
    return `${sizeToString(value)} (${value})`;
  }

  if (
    (key === "file_id" || key === "owner_id" || key === "entity_id" || key === "policy_id") &&
    typeof value === "number"
  ) {
    return `#${value}`;
  }

  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
};

export const getTaskDiagnosticFields = (summary: TaskSummary | undefined, t: TFunction): TaskDiagnosticField[] => {
  const props = summary?.props;
  if (!props) {
    return [];
  }

  return diagnosticFieldOrder.reduce<TaskDiagnosticField[]>((acc, field) => {
    const value = props[field.key];
    if (value === undefined || value === null || value === "") {
      return acc;
    }

    acc.push({
      key: field.key,
      label: t(`dashboard:taskSummaryFields.${field.labelKey}`),
      value: formatDiagnosticValue(field.key, value, t),
    });
    return acc;
  }, []);
};
