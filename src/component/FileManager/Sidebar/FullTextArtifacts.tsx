import { ChevronRightRounded, ExpandMoreRounded } from "@mui/icons-material";
import {
  Box,
  Button,
  ButtonGroup,
  DialogContent,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFileEntityUrl, getFullTextSidecar } from "../../../api/api.ts";
import {
  FileResponse,
  FileType,
  FullTextSidecarObject,
  FullTextSidecarResponse,
  Metadata,
  Viewer,
  ViewerType,
} from "../../../api/explorer.ts";
import { AppError, Code } from "../../../api/request.ts";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks.ts";
import { Viewers, ViewersByID } from "../../../redux/siteConfigSlice.ts";
import { downloadSingleFile } from "../../../redux/thunks/download.ts";
import { builtInViewers, openViewer } from "../../../redux/thunks/viewer.ts";
import SessionManager, { UserSettings } from "../../../session";
import { fileExtension, getFileLinkedUri, sizeToString } from "../../../util";
import CaretDown from "../../Icons/CaretDown.tsx";
import DraggableDialog from "../../Dialogs/DraggableDialog.tsx";
import { ViewerIcon } from "../Dialogs/OpenWith.tsx";
import TimeBadge from "../../Common/TimeBadge.tsx";

export interface FullTextArtifactsProps {
  target: FileResponse;
}

type FullTextSidecarTreeNode = FullTextSidecarObject & {
  children: FullTextSidecarTreeNode[];
};

type FullTextSidecarTreeRow = FullTextSidecarTreeNode & {
  level: number;
};

const objectKindLabelKey = (item: FullTextSidecarObject) => {
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

const getObjectDisplayTitle = (item: FullTextSidecarObject) => item.name || item.id;

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

const flattenTree = (
  items: FullTextSidecarTreeNode[],
  expanded: Set<string>,
  level = 0,
  rows: FullTextSidecarTreeRow[] = [],
) => {
  for (const item of items) {
    rows.push({ ...item, level });
    if (item.children.length > 0 && expanded.has(item.id)) {
      flattenTree(item.children, expanded, level + 1, rows);
    }
  }

  return rows;
};

const collectExpandableIds = (items: FullTextSidecarTreeNode[], ids = new Set<string>()) => {
  for (const item of items) {
    if (item.children.length > 0) {
      ids.add(item.id);
      collectExpandableIds(item.children, ids);
    }
  }

  return ids;
};

const buildSidecarVirtualFile = (extractedAt: string, item: FullTextSidecarObject): FileResponse | undefined => {
  if (!item.uri) {
    return undefined;
  }

  return {
    type: FileType.file,
    id: item.uri,
    name: item.name,
    created_at: extractedAt,
    updated_at: extractedAt,
    size: item.size,
    path: item.uri,
  };
};

const isSupportedSidecarViewer = (viewer: Viewer) => {
  if (viewer.type === ViewerType.wopi) {
    return false;
  }

  if (viewer.type === ViewerType.builtin && viewer.id === builtInViewers.archive) {
    return false;
  }

  return true;
};

const getSupportedSidecarViewers = (fileName: string) => {
  const ext = fileExtension(fileName) ?? "";
  return (Viewers[ext] || []).filter(isSupportedSidecarViewer);
};

const pickPreferredSidecarViewer = (
  fileName: string,
  viewers: Viewer[],
  defaultViewerMapping?: { [key: string]: string },
) => {
  if (viewers.length === 0) {
    return undefined;
  }

  const ext = fileExtension(fileName) ?? "";
  const preferredViewerID = SessionManager.get(UserSettings.OpenWithPrefix + ext);
  if (preferredViewerID && ViewersByID[preferredViewerID]) {
    const viewer = viewers.find((item) => item.id === preferredViewerID);
    if (viewer) {
      return viewer;
    }
  }

  const defaultViewerID = defaultViewerMapping?.[ext];
  if (defaultViewerID) {
    const viewer = viewers.find((item) => item.id === defaultViewerID);
    if (viewer) {
      return viewer;
    }
  }

  return viewers[0];
};

const getSidecarViewerVersion = (viewer?: Viewer) => {
  if (viewer?.type === ViewerType.builtin && viewer.id === builtInViewers.music) {
    return "__sidecar__";
  }

  return undefined;
};

const openPreviewUrl = (url: string) => {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.assign(url);
  }
};

const FullTextArtifactActionGroup = ({
  item,
  virtualFile,
  viewers,
}: {
  item: FullTextSidecarObject;
  virtualFile?: FileResponse;
  viewers: Viewer[];
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const defaultViewerMapping = useAppSelector((state) => state.siteConfig?.explorer?.config?.default_viewer_mapping);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const preferredViewer = useMemo(
    () => pickPreferredSidecarViewer(item.name, viewers, defaultViewerMapping),
    [defaultViewerMapping, item.name, viewers],
  );

  const openFallbackPreview = async () => {
    if (!virtualFile) {
      openPreviewUrl(item.url);
      return;
    }

    const entityUrl = await dispatch(
      getFileEntityUrl({
        uris: [virtualFile.path],
      }),
    );
    openPreviewUrl(entityUrl.urls[0]?.url || item.url);
  };

  const openWithViewer = async (viewer?: Viewer) => {
    if (!virtualFile || !viewer) {
      await openFallbackPreview();
      return;
    }

    await dispatch(openViewer(virtualFile, viewer, virtualFile.size, getSidecarViewerVersion(viewer), true));
  };

  const handlePreview = async () => {
    if (viewers.length === 0) {
      await openFallbackPreview();
      return;
    }

    await openWithViewer(preferredViewer);
  };

  return (
    <>
      <ButtonGroup size="small" variant="text" disableElevation>
        <Button
          size="small"
          onClick={() => {
            handlePreview().catch(() => openPreviewUrl(item.url));
          }}
        >
          {t("application:fileManager.preview")}
        </Button>
        <Button
          size="small"
          disabled={viewers.length === 0}
          sx={{ minWidth: 30, px: 0.5 }}
          onClick={(e) => {
            setAnchorEl(e.currentTarget);
          }}
        >
          <CaretDown sx={{ fontSize: "12px!important" }} />
        </Button>
      </ButtonGroup>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl) && viewers.length > 0}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              minWidth: 180,
            },
          },
        }}
      >
        {viewers.map((viewer) => (
          <MenuItem
            key={viewer.id}
            onClick={() => {
              setAnchorEl(null);
              openWithViewer(viewer).catch(() => openPreviewUrl(item.url));
            }}
          >
            <ListItemIcon>
              <ViewerIcon size={20} viewer={viewer} py={0} />
            </ListItemIcon>
            <ListItemText>{t(viewer.display_name)}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const FullTextArtifactsDetail = ({
  sidecar,
  target,
  open,
  onClose,
}: {
  sidecar: FullTextSidecarResponse;
  target: FileResponse;
  open: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const tree = useMemo(() => buildTree(sidecar.objects), [sidecar.objects]);
  const expandableIds = useMemo(() => collectExpandableIds(tree), [tree]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextExpanded = new Set<string>();
    tree.forEach((item) => {
      if (item.children.length > 0) {
        nextExpanded.add(item.id);
      }
    });
    setExpanded(nextExpanded);
  }, [open, tree]);

  const rows = useMemo(() => flattenTree(tree, expanded), [tree, expanded]);

  return (
    <DraggableDialog
      title={t("application:fileManager.fullTextArtifactsDialogTitle", { name: target.name })}
      hideOk
      showCancel
      cancelText={t("common:close")}
      dialogProps={{
        open,
        onClose,
        fullWidth: true,
        maxWidth: "md",
        disableRestoreFocus: true,
      }}
    >
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent={"space-between"}
            alignItems={{ sm: "center" }}
            gap={1}
          >
            <Typography variant="body2" color="text.secondary">
              {t("application:fileManager.fullTextExtractedAt")}{" "}
              <TimeBadge variant="body2" datetime={sidecar.extracted_at} />
            </Typography>
            {expandableIds.size > 0 && (
              <Stack direction={"row"} spacing={1}>
                <Button size="small" onClick={() => setExpanded(new Set(expandableIds))}>
                  {t("application:fileManager.fullTextArtifactsExpandAll")}
                </Button>
                <Button size="small" onClick={() => setExpanded(new Set())}>
                  {t("application:fileManager.fullTextArtifactsCollapseAll")}
                </Button>
              </Stack>
            )}
          </Stack>

          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
            {rows.length === 0 && (
              <Box sx={{ px: 1.5, py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t("application:fileManager.fullTextArtifactsEmpty")}
                </Typography>
              </Box>
            )}
            {rows.map((item, index) => {
              const kindLabelKey = objectKindLabelKey(item);
              const displayTitle = getObjectDisplayTitle(item);
              const virtualFile = buildSidecarVirtualFile(sidecar.extracted_at, item);
              const sidecarViewers = getSupportedSidecarViewers(item.name);
              const metaLine = [kindLabelKey ? t(kindLabelKey) : "", item.mime_type].filter(Boolean).join(" · ");

              return (
                <Box
                  key={item.id}
                  sx={{
                    px: 1.5,
                    py: 1.25,
                    borderTop: index > 0 ? "1px solid" : "none",
                    borderColor: "divider",
                  }}
                >
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", minWidth: 0 }}>
                        <Box sx={{ pl: item.level * 2, display: "flex", alignItems: "center", flexShrink: 0 }}>
                          {item.children.length > 0 ? (
                            <IconButton
                              size="small"
                              onClick={() => {
                                const nextExpanded = new Set(expanded);
                                if (nextExpanded.has(item.id)) {
                                  nextExpanded.delete(item.id);
                                } else {
                                  nextExpanded.add(item.id);
                                }
                                setExpanded(nextExpanded);
                              }}
                            >
                              {expanded.has(item.id) ? (
                                <ExpandMoreRounded fontSize="small" />
                              ) : (
                                <ChevronRightRounded fontSize="small" />
                              )}
                            </IconButton>
                          ) : (
                            <Box sx={{ width: 32, flexShrink: 0 }} />
                          )}
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body2"
                            color="textPrimary"
                            fontWeight={500}
                            sx={{ wordBreak: "break-all" }}
                          >
                            {displayTitle}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", wordBreak: "break-all" }}
                          >
                            {item.id}
                          </Typography>
                          {metaLine && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", wordBreak: "break-all" }}
                            >
                              {metaLine}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                    <Stack
                      direction={"row"}
                      spacing={1}
                      alignItems={"center"}
                      justifyContent={{ xs: "space-between", sm: "flex-end" }}
                      sx={{ flexShrink: 0, minWidth: { sm: 220 } }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                        {sizeToString(item.size)}
                      </Typography>
                      <FullTextArtifactActionGroup item={item} virtualFile={virtualFile} viewers={sidecarViewers} />
                      <Button
                        size="small"
                        onClick={async () => {
                          if (!virtualFile) {
                            window.location.assign(withDownloadQuery(item.url));
                            return;
                          }

                          await dispatch(downloadSingleFile(virtualFile));
                        }}
                      >
                        {t("application:fileManager.download")}
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Stack>
      </DialogContent>
    </DraggableDialog>
  );
};

const FullTextArtifacts = ({ target }: FullTextArtifactsProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const ftsEnabled = useAppSelector((state) => state.siteConfig?.explorer?.config?.full_text_search);
  const sidecarSourceURI = getFileLinkedUri(target);

  const [sidecar, setSidecar] = useState<FullTextSidecarResponse | null | undefined>(undefined);
  const [loadFailed, setLoadFailed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const shouldLoad = useMemo(() => {
    return !!ftsEnabled && target.type === FileType.file && !!target.metadata?.[Metadata.full_text_index];
  }, [ftsEnabled, target.type, target.metadata]);

  useEffect(() => {
    setSidecar(undefined);
    setLoadFailed(false);
    setDialogOpen(false);

    if (!shouldLoad) {
      setSidecar(null);
      return;
    }

    let canceled = false;
    dispatch(getFullTextSidecar({ uri: sidecarSourceURI }, true))
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
  }, [dispatch, shouldLoad, sidecarSourceURI]);

  const hasText = useMemo(() => {
    return !!sidecar?.objects.some((item) => item.kind === "text");
  }, [sidecar]);

  const attachmentCount = useMemo(() => {
    return sidecar?.objects.filter((item) => item.kind !== "text" && item.kind !== "metadata").length ?? 0;
  }, [sidecar]);

  if (!shouldLoad) {
    return null;
  }

  return (
    <>
      <Typography sx={{ pt: 1 }} color="textPrimary" fontWeight={500} variant={"subtitle1"}>
        {t("application:fileManager.fullTextArtifacts")}
      </Typography>

      {sidecar === undefined && (
        <Stack spacing={0.75}>
          <Skeleton variant="text" width={140} />
          <Skeleton variant="text" width={180} />
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
        <>
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              {hasText
                ? t("application:fileManager.fullTextArtifactsHasText")
                : t("application:fileManager.fullTextArtifactsNoText")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("application:fileManager.fullTextArtifactsAttachmentCount", {
                count: attachmentCount,
              })}
            </Typography>
            <Box>
              <Button size="small" sx={{ px: 0 }} onClick={() => setDialogOpen(true)}>
                {t("application:fileManager.fullTextArtifactsOpenDetail")}
              </Button>
            </Box>
          </Stack>

          <FullTextArtifactsDetail
            sidecar={sidecar}
            target={target}
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
          />
        </>
      )}
    </>
  );
};

export default FullTextArtifacts;
