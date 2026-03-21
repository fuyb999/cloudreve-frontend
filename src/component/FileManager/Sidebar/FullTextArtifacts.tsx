import { Box, Link, Skeleton, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFullTextSidecar } from "../../../api/api.ts";
import {
  FileResponse,
  FileType,
  FullTextSidecarObject,
  FullTextSidecarResponse,
  Metadata,
} from "../../../api/explorer.ts";
import { AppError, Code } from "../../../api/request.ts";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks.ts";
import { sizeToString } from "../../../util";
import TimeBadge from "../../Common/TimeBadge.tsx";

export interface FullTextArtifactsProps {
  target: FileResponse;
}

type FullTextSidecarTreeNode = FullTextSidecarObject & {
  children: FullTextSidecarTreeNode[];
};

const objectTitleKey = (item: FullTextSidecarObject) => {
  switch (item.kind) {
    case "text":
      return "application:fileManager.fullTextArtifactText";
    case "metadata":
      return "application:fileManager.fullTextArtifactMetadata";
    case "embedded":
      return "application:fileManager.fullTextArtifactAssets";
    case "docx_media":
      return "application:fileManager.fullTextArtifactDocxMedia";
    case "archive":
      return "application:fileManager.fullTextArtifactArchive";
    default:
      return "";
  }
};

const withDownloadQuery = (url: string) => {
  try {
    const resolved = new URL(url);
    resolved.searchParams.set("download", "true");
    return resolved.toString();
  } catch {
    return url;
  }
};

const buildTree = (items: FullTextSidecarObject[]) => {
  const byParent = new Map<string, FullTextSidecarTreeNode[]>();
  const nodes = new Map<string, FullTextSidecarTreeNode>();
  const roots: FullTextSidecarTreeNode[] = [];

  for (const item of items) {
    const node: FullTextSidecarTreeNode = { ...item, children: [] };
    nodes.set(item.id, node);

    const parentKey = item.parent_id || "";
    const siblings = byParent.get(parentKey) || [];
    siblings.push(node);
    byParent.set(parentKey, siblings);
  }

  for (const item of items) {
    if (!item.parent_id || !nodes.has(item.parent_id)) {
      roots.push(nodes.get(item.id)!);
    }
  }

  const attachChildren = (node: FullTextSidecarTreeNode) => {
    node.children = byParent.get(node.id) || [];
    node.children.forEach(attachChildren);
  };

  roots.forEach(attachChildren);
  return roots;
};

const ArtifactNode = ({ item, level }: { item: FullTextSidecarTreeNode; level: number }) => {
  const { t } = useTranslation();
  const titleKey = objectTitleKey(item);
  const displayTitle = titleKey ? t(titleKey) : item.name;

  return (
    <Box
      sx={{
        pl: level > 0 ? 1.5 : 0,
        borderLeft: level > 0 ? "1px solid" : "none",
        borderColor: "divider",
        ml: level > 0 ? 0.75 : 0,
      }}
    >
      <Box
        sx={{
          p: 1.25,
          borderRadius: 1,
          bgcolor: "action.hover",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
          <Typography variant="body2" color="textPrimary" fontWeight={500}>
            {displayTitle}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            {sizeToString(item.size)}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", wordBreak: "break-all", mt: 0.25 }}
        >
          {item.name}
          {item.mime_type ? ` · ${item.mime_type}` : ""}
          {item.kind ? ` · ${item.kind}` : ""}
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, mt: 0.75 }}>
          <Link href={item.url} target="_blank" rel="noreferrer" underline="hover">
            {t("application:fileManager.view")}
          </Link>
          <Link href={withDownloadQuery(item.url)} target="_blank" rel="noreferrer" underline="hover">
            {t("application:fileManager.download")}
          </Link>
        </Box>
      </Box>
      {item.children.length > 0 && (
        <Stack spacing={1} sx={{ mt: 1 }}>
          {item.children.map((child) => (
            <ArtifactNode key={child.id} item={child} level={level + 1} />
          ))}
        </Stack>
      )}
    </Box>
  );
};

const FullTextArtifacts = ({ target }: FullTextArtifactsProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const ftsEnabled = useAppSelector((state) => state.siteConfig?.explorer?.config?.full_text_search);

  const [sidecar, setSidecar] = useState<FullTextSidecarResponse | null | undefined>(undefined);
  const [loadFailed, setLoadFailed] = useState(false);

  const shouldLoad = useMemo(() => {
    return !!ftsEnabled && target.type === FileType.file && !!target.metadata?.[Metadata.full_text_index];
  }, [ftsEnabled, target.type, target.metadata]);

  const tree = useMemo(() => {
    return sidecar ? buildTree(sidecar.objects) : [];
  }, [sidecar]);

  useEffect(() => {
    setSidecar(undefined);
    setLoadFailed(false);

    if (!shouldLoad) {
      setSidecar(null);
      return;
    }

    let canceled = false;
    dispatch(getFullTextSidecar({ uri: target.path }, true))
      .then((res) => {
        if (!canceled) {
          setSidecar(res);
        }
      })
      .catch((err) => {
        if (canceled) {
          return;
        }

        if (err instanceof AppError && err.code === Code.NodeFound) {
          setSidecar(null);
          return;
        }

        console.error("Failed to load full-text sidecar", err);
        setLoadFailed(true);
        setSidecar(null);
      });

    return () => {
      canceled = true;
    };
  }, [dispatch, shouldLoad, target.path]);

  if (!shouldLoad) {
    return null;
  }

  return (
    <>
      <Typography sx={{ pt: 1 }} color="textPrimary" fontWeight={500} variant={"subtitle1"}>
        {t("application:fileManager.fullTextArtifacts")}
      </Typography>
      {sidecar === undefined && (
        <Stack spacing={1}>
          <Skeleton variant="text" width={120} />
          <Skeleton variant="rounded" height={72} />
          <Skeleton variant="rounded" height={72} />
        </Stack>
      )}
      {loadFailed && (
        <Typography variant="body2" color="text.secondary">
          {t("application:fileManager.fullTextArtifactsLoadFailed")}
        </Typography>
      )}
      {!loadFailed && sidecar === null && (
        <Typography variant="body2" color="text.secondary">
          {t("application:fileManager.fullTextArtifactsEmpty")}
        </Typography>
      )}
      {sidecar && (
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {t("application:fileManager.fullTextExtractedAt")}{" "}
            <TimeBadge variant="body2" datetime={sidecar.extracted_at} />
          </Typography>
          {tree.map((item) => (
            <ArtifactNode key={item.id} item={item} level={0} />
          ))}
        </Stack>
      )}
    </>
  );
};

export default FullTextArtifacts;
