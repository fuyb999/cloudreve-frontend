import { ListItemText } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { DenseSelect } from "../../../Common/StyledComponents";

const MultipleNodeSelectionInput = () => {
  const { t } = useTranslation("dashboard");

  return (
    <DenseSelect
      multiple
      displayEmpty
      sx={{
        minHeight: 39,
      }}
      MenuProps={{
        PaperProps: { sx: { maxWidth: 230 } },
        MenuListProps: {
          sx: {
            "& .MuiMenuItem-root": {
              whiteSpace: "normal",
            },
          },
        },
      }}
      renderValue={() => {
        return (
          <ListItemText
            primary={<em>{t("group.allNodes")}</em>}
            slotProps={{
              primary: { color: "textSecondary", variant: "body2" },
            }}
          />
        );
      }}
    ></DenseSelect>
  );
};

export default MultipleNodeSelectionInput;
