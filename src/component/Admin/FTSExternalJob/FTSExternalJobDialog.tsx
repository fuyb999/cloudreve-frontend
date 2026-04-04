import { Box, DialogContent } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { getFTSExternalJobDetail } from "../../../api/api";
import { FTSExternalJob } from "../../../api/dashboard";
import { useAppDispatch } from "../../../redux/hooks";
import AutoHeight from "../../Common/AutoHeight";
import FacebookCircularProgress from "../../Common/CircularProgress";
import DraggableDialog from "../../Dialogs/DraggableDialog";
import FTSExternalJobForm from "./FTSExternalJobForm";

export interface FTSExternalJobDialogProps {
  open: boolean;
  onClose: () => void;
  jobID?: number;
}

const FTSExternalJobDialog = ({ open, onClose, jobID }: FTSExternalJobDialogProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation("dashboard");
  const [values, setValues] = useState<FTSExternalJob>({ id: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobID || !open) {
      return;
    }

    setLoading(true);
    dispatch(getFTSExternalJobDetail(jobID))
      .then((res) => {
        setValues(res);
      })
      .catch(() => {
        onClose();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dispatch, jobID, onClose, open]);

  return (
    <DraggableDialog
      title={t("ftsExternalJob.detailTitle")}
      dialogProps={{
        fullWidth: true,
        maxWidth: "md",
        open,
        onClose,
      }}
    >
      <DialogContent>
        <AutoHeight>
          <SwitchTransition>
            <CSSTransition
              addEndListener={(node, done) => node.addEventListener("transitionend", done, false)}
              classNames="fade"
              key={`${loading}`}
            >
              <Box>
                {loading && (
                  <Box
                    sx={{
                      py: 15,
                      height: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <FacebookCircularProgress />
                  </Box>
                )}
                {!loading && <FTSExternalJobForm values={values} />}
              </Box>
            </CSSTransition>
          </SwitchTransition>
        </AutoHeight>
      </DialogContent>
    </DraggableDialog>
  );
};

export default FTSExternalJobDialog;
