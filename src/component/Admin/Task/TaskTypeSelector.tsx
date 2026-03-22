import { Box, FormHelperText, ListItemText, SelectChangeEvent } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { ContentProcessingTaskFilter, getTaskDisplayType, visibleTaskTypes } from "../../../api/workflow";
import { DenseSelect, SquareChip } from "../../Common/StyledComponents";
import { SquareMenuItem } from "../../FileManager/ContextMenu/ContextMenu";

interface TaskTypeSelectorProps {
  value: string[];
  onChange: (event: SelectChangeEvent<unknown>) => void;
  renderValue?: (selected: unknown) => React.ReactNode;
  helperText?: string;
  showAllOption?: boolean;
  allOptionText?: string;
  fullWidth?: boolean;
  displayEmpty?: boolean;
  includeContentProcessingAggregate?: boolean;
}

const TaskTypeSelector = ({
  value,
  onChange,
  renderValue,
  helperText,
  showAllOption = false,
  allOptionText,
  fullWidth = true,
  displayEmpty = false,
  includeContentProcessingAggregate = false,
}: TaskTypeSelectorProps) => {
  const { t } = useTranslation("dashboard");
  const options = includeContentProcessingAggregate
    ? [ContentProcessingTaskFilter, ...visibleTaskTypes]
    : visibleTaskTypes;

  const defaultRenderValue = (selected: unknown) => {
    const values = Array.isArray(selected) ? selected : [];
    return (
      <Box display="flex" flexWrap="wrap" gap={0.5}>
        {values.map((val) => (
          <SquareChip key={val} label={t(`task.${getTaskDisplayType(val)}`)} size="small" />
        ))}
      </Box>
    );
  };

  return (
    <>
      <DenseSelect
        fullWidth={fullWidth}
        multiple
        value={value}
        onChange={onChange}
        renderValue={renderValue || defaultRenderValue}
        displayEmpty={displayEmpty}
      >
        {showAllOption && (
          <SquareMenuItem value={[]} disabled>
            <ListItemText
              primary={allOptionText || t("task.allTaskTypes")}
              slotProps={{ primary: { variant: "body2", style: { fontStyle: "italic" } } }}
            />
          </SquareMenuItem>
        )}
        {options.map((type) => (
          <SquareMenuItem value={type} key={type}>
            <ListItemText
              primary={t(`task.${getTaskDisplayType(type)}`)}
              slotProps={{ primary: { variant: "body2" } }}
            />
          </SquareMenuItem>
        ))}
      </DenseSelect>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </>
  );
};

export default TaskTypeSelector;
