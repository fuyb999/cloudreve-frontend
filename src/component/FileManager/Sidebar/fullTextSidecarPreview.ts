import type { FileResponse, FullTextSidecarObject } from "../../../api/explorer.ts";

export interface FullTextSidecarPreviewTarget {
  uri?: string;
  url: string;
  fileName: string;
  viewerFileName: string;
  size: number;
}

const fileResponseTypeFile = 0;

const sidecarPathBase = (path: string) => {
  const base = path.split("/").pop() || "";
  try {
    return decodeURIComponent(base);
  } catch {
    return base;
  }
};

const buildPreviewFileName = (item: FullTextSidecarObject) => {
  if (!item.preview_uri) {
    return item.name;
  }

  const previewBase = sidecarPathBase(item.preview_uri);
  if (previewBase) {
    return previewBase;
  }

  return item.name.toLowerCase().endsWith(".txt") ? item.name : `${item.name}.txt`;
};

export const selectSidecarPreviewTarget = (item: FullTextSidecarObject): FullTextSidecarPreviewTarget => {
  const hasPreviewArtifact = !!(item.preview_uri || item.preview_url);
  const fileName = buildPreviewFileName(item);

  return {
    uri: item.preview_uri || item.uri,
    url: item.preview_url || item.url,
    fileName,
    viewerFileName: hasPreviewArtifact ? fileName : item.name,
    size: hasPreviewArtifact ? 0 : item.size,
  };
};

export const buildSidecarPreviewVirtualFile = (
  extractedAt: string,
  target: FullTextSidecarPreviewTarget,
): FileResponse | undefined => {
  if (!target.uri) {
    return undefined;
  }

  return {
    type: fileResponseTypeFile,
    id: target.uri,
    name: target.fileName,
    created_at: extractedAt,
    updated_at: extractedAt,
    size: target.size,
    path: target.uri,
  };
};

export const buildSidecarObjectVirtualFile = (
  extractedAt: string,
  item: FullTextSidecarObject,
): FileResponse | undefined => {
  if (!item.uri) {
    return undefined;
  }

  return {
    type: fileResponseTypeFile,
    id: item.uri,
    name: item.name,
    created_at: extractedAt,
    updated_at: extractedAt,
    size: item.size,
    path: item.uri,
  };
};
