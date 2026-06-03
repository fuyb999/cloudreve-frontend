interface PathTarget {
  path?: string;
}

function normalizeUriPath(uri: string): string {
  try {
    const normalized = new URL(uri.replace("cloudreve://", "http://"));
    normalized.search = "";
    normalized.hash = "";
    return normalized.toString().replace("http://", "cloudreve://").replace(/\/$/, "");
  } catch {
    return uri.replace(/[?#].*$/, "").replace(/\/$/, "");
  }
}

export function shouldClearFileTargetAfterDelete(
  target: PathTarget | string | undefined,
  deleted: PathTarget[],
): boolean {
  const targetPath = typeof target === "string" ? target : target?.path;
  if (!targetPath) {
    return false;
  }

  const normalizedTarget = normalizeUriPath(targetPath);
  return deleted.some((f) => {
    if (!f.path) {
      return false;
    }

    const deletedPath = normalizeUriPath(f.path);
    return normalizedTarget === deletedPath || normalizedTarget.startsWith(`${deletedPath}/`);
  });
}
