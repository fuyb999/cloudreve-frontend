import {
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectProps,
  styled,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { NoLabelFilledSelect } from "../../FileManager/Sidebar/CustomProps/MultiSelectPropsContent.tsx";
import Translate from "../../Icons/Translate.tsx";
import { zipTextEncodings } from "./encodingOptions.ts";

const defaultEncodingValue = " ";

export interface EncodingSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  size?: "small" | "medium";
  variant?: "outlined" | "standard" | "filled";
  fullWidth?: boolean;
  showIcon?: boolean;
  SelectProps?: Partial<SelectProps>;
}

export const StyledInputAdornment = styled(InputAdornment)(() => ({
  "&.MuiInputAdornment-positionStart": {
    marginTop: "0!important",
  },
}));

const EncodingSelector = ({
  value,
  onChange,
  label,
  size = "medium",
  variant = "outlined",
  fullWidth = false,
  showIcon = true,
  SelectProps,
}: EncodingSelectorProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const displayLabel = label || t("modals.selectEncoding");

  const SelectComponent = size == "small" ? NoLabelFilledSelect : Select;
  const InputAdornmentComponent = size == "small" ? StyledInputAdornment : InputAdornment;

  return (
    <FormControl variant={variant} fullWidth={fullWidth} size={size}>
      {size != "small" && <InputLabel>{displayLabel}</InputLabel>}
      <SelectComponent
        variant={variant}
        size={size}
        startAdornment={
          showIcon &&
          !isMobile && (
            <InputAdornmentComponent position="start" sx={{ mt: 0 }}>
              <Translate />
            </InputAdornmentComponent>
          )
        }
        label={displayLabel}
        value={value}
        onChange={(e) => onChange(e.target.value as string)}
        {...SelectProps}
      >
        <MenuItem value={defaultEncodingValue}>
          <em>{t("modals.defaultEncoding")}</em>
        </MenuItem>
        {zipTextEncodings.map((enc) => (
          <MenuItem key={enc} value={enc}>
            {enc}
          </MenuItem>
        ))}
      </SelectComponent>
    </FormControl>
  );
};

export { defaultEncodingValue };
export default EncodingSelector;
