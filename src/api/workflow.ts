import { PaginationResults } from "./explorer.ts";
import CrUri, { Filesystem } from "../util/uri.ts";

export interface ArchiveWorkflowService {
  src: string[];
  dst: string;
  encoding?: string;
  password?: string;
  file_mask?: string[];
}

export interface TaskListResponse {
  tasks: TaskResponse[];
  pagination: PaginationResults;
}

export interface TaskResponse {
  created_at: string;
  updated_at: string;
  id: string;
  status: string;
  type: string;
  display_type?: string;
  node?: NodeSummary;
  summary?: TaskSummary;
  error?: string;
  error_history?: string[];
  duration?: number;
  resume_time?: number;
  retry_count?: number;
}

export interface TaskSummary {
  phase?: string;
  props: {
    kind?: string;
    src?: string;
    src_str?: string;
    dst?: string;
    src_multiple?: string[];
    dst_policy_id?: string;
    failed?: number;
    total?: number;
    file_id?: number;
    owner_id?: number;
    entity_id?: number;
    policy_id?: number;
    file_name?: string;
    file_size?: number;
    file_ext?: string;
    language?: string;
    ext?: string;
    manifest_path?: string;
    meta_count?: number;
    save_path?: string;
    size?: number;
    not_available?: boolean;
    mime_type?: string;
    parser?: string;
    title?: string;
    author?: string;
    metadata_count?: number;
    download?: DownloadTaskStatus;
    [key: string]: unknown;
  };
}

type TaskUriPayload = {
  uri?: unknown;
};

const resolveTaskSummaryUri = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const uri = (value as TaskUriPayload).uri;
    if (typeof uri === "string") {
      return uri;
    }
  }

  return undefined;
};

const processTaskSummaryUri = (value: unknown, userHashId = ""): string | undefined => {
  const uri = resolveTaskSummaryUri(value);
  if (!uri) {
    return undefined;
  }

  try {
    const crUrl = new CrUri(uri);
    if (userHashId && crUrl.fs() == Filesystem.my && !crUrl.id()) {
      crUrl.setUsername(userHashId);
    }
    return crUrl.toString();
  } catch {
    return uri;
  }
};

export const normalizeTaskSummary = (summary?: TaskSummary, userHashId = ""): TaskSummary | undefined => {
  if (!summary) {
    return summary;
  }

  const normalized: TaskSummary = {
    ...summary,
    props: { ...(summary.props ?? {}) },
  };
  const props = normalized.props as Record<string, unknown>;

  props.src = processTaskSummaryUri(props.src, userHashId);
  props.dst = processTaskSummaryUri(props.dst, userHashId);

  const srcMultiple = Array.isArray(props.src_multiple)
    ? props.src_multiple
        .map((item) => processTaskSummaryUri(item, userHashId))
        .filter((item): item is string => typeof item === "string" && item.length > 0)
    : undefined;
  props.src_multiple = srcMultiple;

  return normalized;
};

export enum DownloadTaskState {
  seeding = "seeding",
  downloading = "downloading",
  error = "error",
  completed = "completed",
  unknown = "unknown",
}

export interface DownloadTaskStatus {
  name: string;
  state: DownloadTaskState;
  total: number;
  downloaded: number;
  download_speed: number;
  upload_speed: number;
  uploaded: number;
  files?: DownloadTaskFile[];
  hash?: string;
  pieces?: string;
  num_pieces?: number;
}

export interface DownloadTaskFile {
  index: number;
  name: string;
  size: number;
  progress: number;
  selected: boolean;
}

export interface NodeSummary {
  id: string;
  name: string;
  type: NodeTypes;
  capabilities: string;
}

export enum NodeTypes {
  master = "master",
  slave = "slave",
}

export const NodeCapability = {
  none: 0,
  create_archive: 1,
  extract_archive: 2,
  remote_download: 3,
  content_processing: 4,
  //relocate: 5,
};

export interface RelocateWorkflowService {
  src: string[];
  dst_policy_id: string;
}

export interface DownloadWorkflowService {
  src?: string[];
  src_file?: string;
  dst: string;
}

export interface ImportWorkflowService {
  src: string;
  dst: string;
  extract_media_meta?: boolean;
  user_id: string;
  recursive?: boolean;
  policy_id: number;
}

export interface ListTaskService {
  page_size: number;
  category: ListTaskCategory;
  next_page_token?: string;
}

export enum ListTaskCategory {
  general = "general",
  downloading = "downloading",
  downloaded = "downloaded",
}

export enum TaskType {
  relocate = "relocate",
  create_archive = "create_archive",
  extract_archive = "extract_archive",
  remote_download = "remote_download",
  media_metadata = "media_meta",
  document_inspect = "document_inspect",
  entity_recycle_routine = "entity_recycle_routine",
  explicit_entity_recycle = "explicit_entity_recycle",
  upload_sentinel_check = "upload_sentinel_check",
  import = "import",
  full_text_index = "full_text_index",
  full_text_copy = "full_text_copy",
  full_text_change_owner = "full_text_change_owner",
  full_text_delete = "full_text_delete",
  full_text_rebuild = "full_text_rebuild",
  slave_content_processing = "slave_content_processing",
  thumbnail_generate = "thumbnail_generate",
}

export const ContentProcessingTaskFilter = "content_processing";

export const contentProcessingTaskTypes = [
  TaskType.full_text_index,
  TaskType.document_inspect,
  TaskType.media_metadata,
  TaskType.thumbnail_generate,
] as const;

export type ContentProcessingTaskKind =
  | "full_text_extract"
  | "media_meta_extract"
  | "thumbnail_generate"
  | "document_inspect";

const hiddenTaskTypes = new Set<string>([TaskType.full_text_delete, TaskType.slave_content_processing]);

type TaskPrivateState = Record<string, unknown>;

const parseTaskPrivateState = (state?: unknown): TaskPrivateState => {
  if (!state) {
    return {};
  }

  if (typeof state === "string") {
    try {
      const parsed = JSON.parse(state);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as TaskPrivateState;
      }
    } catch {
      return {};
    }
  }

  if (typeof state === "object" && state !== null && !Array.isArray(state)) {
    return state as TaskPrivateState;
  }

  return {};
};

export const getContentProcessingTaskKind = (state?: unknown): ContentProcessingTaskKind | "" => {
  const parsed = parseTaskPrivateState(state);
  if (typeof parsed?.kind !== "string") {
    return "";
  }

  return parsed.kind as ContentProcessingTaskKind;
};

export const getTaskDisplayType = (type?: string, privateState?: unknown): string => {
  if (type === TaskType.full_text_delete) {
    return TaskType.full_text_index;
  }

  if (type === TaskType.slave_content_processing) {
    switch (getContentProcessingTaskKind(privateState)) {
      case "full_text_extract":
        return TaskType.full_text_index;
      case "media_meta_extract":
        return TaskType.media_metadata;
      case "thumbnail_generate":
        return TaskType.thumbnail_generate;
      case "document_inspect":
        return TaskType.document_inspect;
      default:
        return TaskType.slave_content_processing;
    }
  }

  return type ?? "";
};

export const visibleTaskTypes = Object.values(TaskType).filter((type) => !hiddenTaskTypes.has(type));

export const getFullTextTaskFileIDs = (state: TaskPrivateState): number[] => {
  const result: number[] = [];
  const seen = new Set<number>();
  const append = (fileID: unknown) => {
    if (typeof fileID !== "number" || fileID <= 0 || seen.has(fileID)) {
      return;
    }
    seen.add(fileID);
    result.push(fileID);
  };

  if (Array.isArray(state?.file_ids)) {
    state.file_ids.forEach(append);
  }

  if (Array.isArray(state?.files)) {
    state.files.forEach((item) => {
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        append((item as TaskPrivateState).file_id);
      }
    });
  }

  if (typeof state?.payload === "object" && state.payload !== null && !Array.isArray(state.payload)) {
    append((state.payload as TaskPrivateState).file_id);
  }
  append(state?.file_id);
  return result;
};

export enum TaskStatus {
  queued = "queued",
  processing = "processing",
  suspending = "suspending",
  error = "error",
  canceled = "canceled",
  completed = "completed",
}

export interface TaskProgress {
  total: number;
  current: number;
  identifier: string;
}

export interface TaskProgresses {
  [key: string]: TaskProgress;
}

export interface SetFileToDownloadArgs {
  index: number;
  download: boolean;
}

export interface SetDownloadFilesService {
  files: SetFileToDownloadArgs[];
}

export interface RebuildFTSIndexWorkflowService {
  filtered_storage_policy?: number[];
  skip_text_extraction?: boolean;
  skip_attachment_extraction?: boolean;
}
