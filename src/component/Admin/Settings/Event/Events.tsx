import {
  Box,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  auditEventCategories,
  getEventName,
  parseEnabledEventTypes,
  serializeEnabledEventTypes,
} from "../../Event/auditEvents.ts";
import { NoMarginHelperText, SettingSection, SettingSectionContent } from "../Settings";
import { SettingContext } from "../SettingWrapper";

const Events = () => {
  const { t } = useTranslation("dashboard");
  const { formRef, setSettings, values } = useContext(SettingContext);
  const enabledTypes = useMemo(
    () => parseEnabledEventTypes(values.audit_log_enabled_types),
    [values.audit_log_enabled_types],
  );
  const enabledSet = useMemo(() => new Set(enabledTypes), [enabledTypes]);

  const updateEnabledTypes = (next: Iterable<number>) => {
    setSettings({
      audit_log_enabled_types: serializeEnabledEventTypes(next),
    });
  };

  const toggleCategory = (events: number[], checked: boolean) => {
    const next = new Set(enabledTypes);
    events.forEach((eventType) => {
      if (checked) {
        next.add(eventType);
      } else {
        next.delete(eventType);
      }
    });
    updateEnabledTypes(next);
  };

  const toggleEvent = (eventType: number, checked: boolean) => {
    const next = new Set(enabledTypes);
    if (checked) {
      next.add(eventType);
    } else {
      next.delete(eventType);
    }

    updateEnabledTypes(next);
  };

  return (
    <Box component={"form"} ref={formRef} onSubmit={(e) => e.preventDefault()}>
      <Stack spacing={5}>
        <SettingSection>
          <Typography variant="h6">{t("settings.auditLog")}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("settings.auditLogDes")}
          </Typography>

          {auditEventCategories.map((category) => (
            <SettingSection key={category.key}>
              <Box>
                <Typography variant="subtitle1">{t(category.title)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t(category.description)}
                </Typography>
              </Box>

              <SettingSectionContent>
                <FormControl component="fieldset">
                  <FormGroup>
                    <FormControlLabel
                      slotProps={{
                        typography: {
                          variant: "body2",
                        },
                      }}
                      control={
                        <Checkbox
                          size={"small"}
                          checked={category.events.every((eventType) => enabledSet.has(eventType))}
                          indeterminate={
                            category.events.some((eventType) => enabledSet.has(eventType)) &&
                            !category.events.every((eventType) => enabledSet.has(eventType))
                          }
                          onChange={(e) => toggleCategory(category.events, e.target.checked)}
                        />
                      }
                      label={t("settings.toggleAll")}
                    />
                    <NoMarginHelperText>{t("settings.toggleAllDes")}</NoMarginHelperText>
                  </FormGroup>
                </FormControl>
                <Grid container spacing={1}>
                  {category.events.map((eventType) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={eventType}>
                      <FormControlLabel
                        slotProps={{
                          typography: {
                            variant: "body2",
                          },
                        }}
                        control={
                          <Checkbox
                            size={"small"}
                            checked={enabledSet.has(eventType)}
                            onChange={(e) => toggleEvent(eventType, e.target.checked)}
                          />
                        }
                        label={t(`settings.event.${getEventName(eventType)}`, getEventName(eventType))}
                      />
                    </Grid>
                  ))}
                </Grid>
              </SettingSectionContent>
              <Divider sx={{ mt: 1 }} />
            </SettingSection>
          ))}
        </SettingSection>
      </Stack>
    </Box>
  );
};

export default Events;
