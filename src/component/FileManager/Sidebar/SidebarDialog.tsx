import { Dialog, Slide } from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { getFileInfo } from "../../../api/api.ts";
import { FileResponse } from "../../../api/explorer.ts";
import { closeSidebar } from "../../../redux/globalStateSlice.ts";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks.ts";
import { SideBarProps } from "./Sidebar.tsx";
import SidebarContent from "./SidebarContent.tsx";

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const SidebarDialog = ({ inPhotoViewer }: SideBarProps) => {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.globalState.sidebarOpen);
  const sidebarTarget = useAppSelector((state) => state.globalState.sidebarTarget);
  // null: not valid, undefined: not loaded, FileResponse: loaded
  const [target, setTarget] = useState<FileResponse | undefined | null>(undefined);
  const requestId = useRef(0);

  const loadExtendedInfo = useCallback(
    (path: string) => {
      const currentRequestId = ++requestId.current;
      dispatch(
        getFileInfo(
          {
            uri: path,
            extended: true,
          },
          true,
        ),
      )
        .then((res) => {
          if (currentRequestId !== requestId.current) {
            return;
          }
          setTarget((r) => ({ ...res, capability: r?.capability }));
        })
        .catch(() => {
          if (currentRequestId !== requestId.current) {
            return;
          }
          setTarget(null);
        });
    },
    [dispatch, setTarget],
  );

  useEffect(() => {
    if (sidebarTarget && sidebarOpen) {
      if (typeof sidebarTarget === "string") {
        setTarget(undefined);
        loadExtendedInfo(sidebarTarget);
      } else {
        setTarget(sidebarTarget);
        loadExtendedInfo(sidebarTarget.path);
      }
    } else {
      requestId.current++;
      setTarget(null);
    }
  }, [sidebarTarget, sidebarOpen, setTarget, loadExtendedInfo]);

  return (
    <Dialog
      fullScreen
      TransitionComponent={Transition}
      open={!!sidebarOpen}
      onClose={() => {
        dispatch(closeSidebar());
      }}
    >
      <SidebarContent inPhotoViewer={inPhotoViewer} target={target} setTarget={setTarget} />
    </Dialog>
  );
};

export default SidebarDialog;
