import { ContentProcessingTaskFilter } from "../../../api/workflow";

export const contentProcessingQueueRoute = "/admin/settings/queue";
export const contentProcessingNodeRoute = "/admin/node?capability=content_processing";

export const getContentProcessingTaskRoute = (type: string = ContentProcessingTaskFilter, status?: string) => {
  const params = new URLSearchParams();
  params.set("type", type);
  if (status) {
    params.set("status", status);
  }

  return `/admin/task?${params.toString()}`;
};
