import { Box, Button, ListItemText, Popover, PopoverProps, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DenseFilledTextField, DenseSelect } from "../../Common/StyledComponents";
import { SquareMenuItem } from "../../FileManager/ContextMenu/ContextMenu";
import SettingForm from "../../Pages/Setting/SettingForm";

export interface FTSExternalJobFilterPopoverProps extends PopoverProps {
  requestID: string;
  setRequestID: (value: string) => void;
  fileID: string;
  setFileID: (value: string) => void;
  ownerID: string;
  setOwnerID: (value: string) => void;
  entityID: string;
  setEntityID: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  mode: string;
  setMode: (value: string) => void;
  triggerReason: string;
  setTriggerReason: (value: string) => void;
  clearFilters: () => void;
}

const externalJobStatuses = ["queued", "success", "error"];
const externalJobModes = ["primary", "fallback_on_error", "fallback_on_error_or_quality"];

const FTSExternalJobFilterPopover = ({
  requestID,
  setRequestID,
  fileID,
  setFileID,
  ownerID,
  setOwnerID,
  entityID,
  setEntityID,
  status,
  setStatus,
  mode,
  setMode,
  triggerReason,
  setTriggerReason,
  clearFilters,
  onClose,
  open,
  ...rest
}: FTSExternalJobFilterPopoverProps) => {
  const { t } = useTranslation("dashboard");
  const [localRequestID, setLocalRequestID] = useState(requestID);
  const [localFileID, setLocalFileID] = useState(fileID);
  const [localOwnerID, setLocalOwnerID] = useState(ownerID);
  const [localEntityID, setLocalEntityID] = useState(entityID);
  const [localStatus, setLocalStatus] = useState(status);
  const [localMode, setLocalMode] = useState(mode);
  const [localTriggerReason, setLocalTriggerReason] = useState(triggerReason);

  useEffect(() => {
    if (!open) {
      return;
    }

    setLocalRequestID(requestID);
    setLocalFileID(fileID);
    setLocalOwnerID(ownerID);
    setLocalEntityID(entityID);
    setLocalStatus(status);
    setLocalMode(mode);
    setLocalTriggerReason(triggerReason);
  }, [open, requestID, fileID, ownerID, entityID, status, mode, triggerReason]);

  const handleApply = () => {
    setRequestID(localRequestID);
    setFileID(localFileID);
    setOwnerID(localOwnerID);
    setEntityID(localEntityID);
    setStatus(localStatus);
    setMode(localMode);
    setTriggerReason(localTriggerReason);
    onClose?.({}, "backdropClick");
  };

  const handleReset = () => {
    setLocalRequestID("");
    setLocalFileID("");
    setLocalOwnerID("");
    setLocalEntityID("");
    setLocalStatus("");
    setLocalMode("");
    setLocalTriggerReason("");
    clearFilters();
    onClose?.({}, "backdropClick");
  };

  return (
    <Popover
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          sx: {
            p: 2,
            width: 320,
            maxWidth: "100%",
          },
        },
      }}
      onClose={onClose}
      open={open}
      {...rest}
    >
      <Stack spacing={2}>
        <SettingForm title={t("ftsExternalJob.requestId")} noContainer lgWidth={12}>
          <DenseFilledTextField
            fullWidth
            size="small"
            value={localRequestID}
            onChange={(e) => setLocalRequestID(e.target.value)}
          />
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.fileId")} noContainer lgWidth={12}>
          <DenseFilledTextField
            fullWidth
            size="small"
            value={localFileID}
            onChange={(e) => setLocalFileID(e.target.value)}
          />
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.ownerId")} noContainer lgWidth={12}>
          <DenseFilledTextField
            fullWidth
            size="small"
            value={localOwnerID}
            onChange={(e) => setLocalOwnerID(e.target.value)}
          />
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.entityId")} noContainer lgWidth={12}>
          <DenseFilledTextField
            fullWidth
            size="small"
            value={localEntityID}
            onChange={(e) => setLocalEntityID(e.target.value)}
          />
        </SettingForm>

        <SettingForm title={t("task.status")} noContainer lgWidth={12}>
          <DenseSelect
            fullWidth
            displayEmpty
            value={localStatus === "" ? " " : localStatus}
            onChange={(e) => setLocalStatus(e.target.value === " " ? "" : (e.target.value as string))}
          >
            {externalJobStatuses.map((item) => (
              <SquareMenuItem key={item} value={item}>
                <ListItemText
                  primary={t(`ftsExternalJob.status.${item}`)}
                  slotProps={{ primary: { variant: "body2" } }}
                />
              </SquareMenuItem>
            ))}
            <SquareMenuItem value=" ">
              <ListItemText primary={<em>{t("user.all")}</em>} slotProps={{ primary: { variant: "body2" } }} />
            </SquareMenuItem>
          </DenseSelect>
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.mode")} noContainer lgWidth={12}>
          <DenseSelect
            fullWidth
            displayEmpty
            value={localMode === "" ? " " : localMode}
            onChange={(e) => setLocalMode(e.target.value === " " ? "" : (e.target.value as string))}
          >
            {externalJobModes.map((item) => (
              <SquareMenuItem key={item} value={item}>
                <ListItemText
                  primary={t(`ftsExternalJob.modeValue.${item}`)}
                  slotProps={{ primary: { variant: "body2" } }}
                />
              </SquareMenuItem>
            ))}
            <SquareMenuItem value=" ">
              <ListItemText primary={<em>{t("user.all")}</em>} slotProps={{ primary: { variant: "body2" } }} />
            </SquareMenuItem>
          </DenseSelect>
        </SettingForm>

        <SettingForm title={t("ftsExternalJob.triggerReason")} noContainer lgWidth={12}>
          <DenseFilledTextField
            fullWidth
            size="small"
            value={localTriggerReason}
            onChange={(e) => setLocalTriggerReason(e.target.value)}
          />
        </SettingForm>

        <Box display="flex" justifyContent="space-between">
          <Button variant="outlined" size="small" onClick={handleReset}>
            {t("user.reset")}
          </Button>
          <Button variant="contained" size="small" onClick={handleApply}>
            {t("user.apply")}
          </Button>
        </Box>
      </Stack>
    </Popover>
  );
};

export default FTSExternalJobFilterPopover;
