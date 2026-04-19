import Add from "../Icons/Add.tsx";
import { Button, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ContextMenuTypes } from "../../redux/fileManagerSlice.ts";
import { useAppDispatch, useAppSelector } from "../../redux/hooks.ts";
import { openNewContextMenu } from "../../redux/thunks/filemanager.ts";
import { FileManagerIndex } from "./FileManager.tsx";
import useActionDisplayOpt from "./ContextMenu/useActionDisplayOpt.ts";

const NewButton = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const parent = useAppSelector((state) => state.fileManager[FileManagerIndex.main].list?.parent);
  const displayOpt = useActionDisplayOpt([], ContextMenuTypes.new, parent, FileManagerIndex.main);
  const canCreate =
    !!displayOpt.showCreateFolder ||
    !!displayOpt.showCreateFile ||
    !!displayOpt.showUpload ||
    !!displayOpt.showRemoteDownload ||
    !!displayOpt.showNewFileFromTemplate;

  if (!canCreate) {
    return null;
  }

  if (isMobile) {
    return (
      <IconButton onClick={(e) => dispatch(openNewContextMenu(FileManagerIndex.main, e))}>
        <Add />
      </IconButton>
    );
  }

  return (
    <Button
      variant={"contained"}
      onClick={(e) => dispatch(openNewContextMenu(FileManagerIndex.main, e))}
      startIcon={<Add />}
      color={"primary"}
    >
      {t("fileManager.new")}
    </Button>
  );
};

export default NewButton;
