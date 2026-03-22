import { Box, Button } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { contentProcessingTaskTypes } from "../../../api/workflow";
import { getContentProcessingTaskRoute } from "./contentProcessingRoutes";

export interface ContentProcessingSubtypeLinksProps {
  selectedType?: string;
}

const ContentProcessingSubtypeLinks = ({ selectedType }: ContentProcessingSubtypeLinksProps) => {
  const { t } = useTranslation("dashboard");

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {contentProcessingTaskTypes.map((taskType) => (
        <Button
          key={taskType}
          component={RouterLink}
          to={getContentProcessingTaskRoute(taskType)}
          size="small"
          variant={selectedType === taskType ? "contained" : "text"}
          sx={{ px: 0.5, minWidth: "auto" }}
        >
          {t(`task.${taskType}`)}
        </Button>
      ))}
    </Box>
  );
};

export default ContentProcessingSubtypeLinks;
