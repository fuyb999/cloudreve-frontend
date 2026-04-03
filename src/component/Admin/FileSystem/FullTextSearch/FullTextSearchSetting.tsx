import { BuildOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  CircularProgress,
  Collapse,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useSnackbar } from "notistack";
import * as React from "react";
import { lazy, Suspense, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { sendRebuildFTSIndex } from "../../../../api/api.ts";
import { useAppDispatch } from "../../../../redux/hooks.ts";
import { confirmOperation } from "../../../../redux/thunks/dialog.ts";
import { isTrueVal } from "../../../../session/utils.ts";
import SizeInput from "../../../Common/SizeInput.tsx";
import { DefaultCloseAction } from "../../../Common/Snackbar/snackbar.tsx";
import { DenseFilledTextField, SecondaryButton } from "../../../Common/StyledComponents.tsx";
import QuestionCircle from "../../../Icons/QuestionCircle.tsx";
import SettingForm from "../../../Pages/Setting/SettingForm.tsx";
import { NoMarginHelperText, SettingSection, SettingSectionContent } from "../../Settings/Settings.tsx";
import { SettingContext } from "../../Settings/SettingWrapper.tsx";

const MonacoEditor = lazy(() => import("../../../Viewers/CodeViewer/MonacoEditor"));

const FullTextSearchSetting = () => {
  const { t } = useTranslation("dashboard");
  const { setSettings, values, formRef } = useContext(SettingContext);
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const ftsEnabled = isTrueVal(values.fts_enabled);
  const indexType = values.fts_index_type || "elasticsearch";
  const externalEnabled = isTrueVal(values.fts_external_enabled);
  const externalMode = values.fts_external_mode || "fallback_on_error_or_quality";
  const externalUseGlobalKafka = isTrueVal(values.fts_external_use_global_kafka);
  const externalQualityEnabled = isTrueVal(values.fts_external_quality_enabled);
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [rebuildSkipTextExtraction, setRebuildSkipTextExtraction] = useState(false);
  const [rebuildSkipAttachmentExtraction, setRebuildSkipAttachmentExtraction] = useState(false);

  return (
    <Box component={"form"} ref={formRef} onSubmit={(e) => e.preventDefault()}>
      <Stack spacing={5}>
        {/* Master Switch */}
        <SettingSection>
          <Typography variant="h6" gutterBottom>
            {t("settings.ftsTitle")}
            <IconButton
              onClick={() => {
                window.open("https://docs.cloudreve.org/usage/search/fts", "_blank");
              }}
            >
              <QuestionCircle />
            </IconButton>
          </Typography>
          <SettingSectionContent>
            <SettingForm lgWidth={5}>
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Switch
                      checked={ftsEnabled}
                      onChange={(e) =>
                        setSettings({
                          fts_enabled: e.target.checked ? "1" : "0",
                        })
                      }
                    />
                  }
                  label={t("settings.ftsEnable")}
                />
                <NoMarginHelperText>{t("settings.ftsEnableDes")}</NoMarginHelperText>
              </FormControl>
            </SettingForm>
            <SettingForm lgWidth={5}>
              <FormControl fullWidth>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isTrueVal(values.fts_sync_folders)}
                      onChange={(e) =>
                        setSettings({
                          fts_sync_folders: e.target.checked ? "1" : "0",
                        })
                      }
                    />
                  }
                  label={t("settings.ftsSyncFolders")}
                />
                <NoMarginHelperText>{t("settings.ftsSyncFoldersDes")}</NoMarginHelperText>
              </FormControl>
            </SettingForm>
          </SettingSectionContent>
        </SettingSection>

        <Collapse in={ftsEnabled} unmountOnExit>
          <Stack spacing={5}>
            {/* Indexer Section */}
            <SettingSection>
              <Typography variant="h6" gutterBottom>
                {t("settings.ftsIndexer")}
              </Typography>
              <SettingSectionContent>
                <SettingForm title={t("settings.ftsIndexerType")} lgWidth={5}>
                  <DenseFilledTextField
                    select
                    value={indexType}
                    onChange={(e) =>
                      setSettings({
                        fts_index_type: e.target.value,
                      })
                    }
                    fullWidth
                    required
                  >
                    <MenuItem value="elasticsearch">{t("settings.ftsIndexerTypeElasticsearch")}</MenuItem>
                    <MenuItem value="meilisearch">{t("settings.ftsIndexerTypeMeilisearch")}</MenuItem>
                  </DenseFilledTextField>
                  <NoMarginHelperText>{t("settings.ftsIndexerTypeDes")}</NoMarginHelperText>
                </SettingForm>

                <Collapse in={indexType === "elasticsearch"} unmountOnExit>
                  <Stack spacing={3}>
                    <SettingForm title={t("settings.ftsElasticsearchEndpoint")} lgWidth={5}>
                      <DenseFilledTextField
                        fullWidth
                        placeholder="http://localhost:9200"
                        value={values.fts_elasticsearch_endpoint}
                        onChange={(e) =>
                          setSettings({
                            fts_elasticsearch_endpoint: e.target.value,
                          })
                        }
                      />
                      <NoMarginHelperText>{t("settings.ftsElasticsearchEndpointDes")}</NoMarginHelperText>
                    </SettingForm>
                    <SettingForm title={t("settings.ftsElasticsearchCloudId")} lgWidth={5}>
                      <DenseFilledTextField
                        fullWidth
                        value={values.fts_elasticsearch_cloud_id}
                        onChange={(e) =>
                          setSettings({
                            fts_elasticsearch_cloud_id: e.target.value,
                          })
                        }
                      />
                      <NoMarginHelperText>{t("settings.ftsElasticsearchCloudIdDes")}</NoMarginHelperText>
                    </SettingForm>
                    <SettingForm title={t("settings.ftsElasticsearchApiKey")} lgWidth={5}>
                      <DenseFilledTextField
                        fullWidth
                        type="password"
                        value={values.fts_elasticsearch_api_key}
                        onChange={(e) =>
                          setSettings({
                            fts_elasticsearch_api_key: e.target.value,
                          })
                        }
                      />
                      <NoMarginHelperText>{t("settings.ftsElasticsearchApiKeyDes")}</NoMarginHelperText>
                    </SettingForm>
                    <SettingForm title={t("settings.ftsElasticsearchUsername")} lgWidth={5}>
                      <DenseFilledTextField
                        fullWidth
                        value={values.fts_elasticsearch_username}
                        onChange={(e) =>
                          setSettings({
                            fts_elasticsearch_username: e.target.value,
                          })
                        }
                      />
                      <NoMarginHelperText>{t("settings.ftsElasticsearchUsernameDes")}</NoMarginHelperText>
                    </SettingForm>
                    <SettingForm title={t("settings.ftsElasticsearchPassword")} lgWidth={5}>
                      <DenseFilledTextField
                        fullWidth
                        type="password"
                        value={values.fts_elasticsearch_password}
                        onChange={(e) =>
                          setSettings({
                            fts_elasticsearch_password: e.target.value,
                          })
                        }
                      />
                      <NoMarginHelperText>{t("settings.ftsElasticsearchPasswordDes")}</NoMarginHelperText>
                    </SettingForm>
                    <SettingForm title={t("settings.ftsElasticsearchIndex")} lgWidth={5}>
                      <DenseFilledTextField
                        fullWidth
                        required
                        value={values.fts_elasticsearch_index}
                        onChange={(e) =>
                          setSettings({
                            fts_elasticsearch_index: e.target.value,
                          })
                        }
                      />
                      <NoMarginHelperText>{t("settings.ftsElasticsearchIndexDes")}</NoMarginHelperText>
                    </SettingForm>
                    <SettingForm title={t("settings.ftsElasticsearchPageSize")} lgWidth={5}>
                      <DenseFilledTextField
                        type="number"
                        inputProps={{ min: 1, step: 1 }}
                        value={values.fts_elasticsearch_page_size}
                        onChange={(e) =>
                          setSettings({
                            fts_elasticsearch_page_size: e.target.value,
                          })
                        }
                        required
                      />
                      <NoMarginHelperText>{t("settings.ftsElasticsearchPageSizeDes")}</NoMarginHelperText>
                    </SettingForm>
                    <SettingForm lgWidth={5}>
                      <FormControl fullWidth>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isTrueVal(values.fts_elasticsearch_skip_tls_verify)}
                              onChange={(e) =>
                                setSettings({
                                  fts_elasticsearch_skip_tls_verify: e.target.checked ? "1" : "0",
                                })
                              }
                            />
                          }
                          label={t("settings.ftsElasticsearchSkipTLS")}
                        />
                        <NoMarginHelperText>{t("settings.ftsElasticsearchSkipTLSDes")}</NoMarginHelperText>
                      </FormControl>
                    </SettingForm>
                  </Stack>
                </Collapse>

                <Collapse in={indexType === "meilisearch"} unmountOnExit>
                  <Stack spacing={3}>
                    <SettingForm title={t("settings.ftsMeilisearchEndpoint")} lgWidth={5}>
                      <DenseFilledTextField
                        fullWidth
                        required
                        placeholder="http://localhost:7700"
                        value={values.fts_meilisearch_endpoint}
                        onChange={(e) =>
                          setSettings({
                            fts_meilisearch_endpoint: e.target.value,
                          })
                        }
                      />
                      <NoMarginHelperText>{t("settings.ftsMeilisearchEndpointDes")}</NoMarginHelperText>
                    </SettingForm>
                    <SettingForm title={t("settings.ftsMeilisearchApiKey")} lgWidth={5}>
                      <DenseFilledTextField
                        fullWidth
                        required
                        type="password"
                        value={values.fts_meilisearch_api_key}
                        onChange={(e) =>
                          setSettings({
                            fts_meilisearch_api_key: e.target.value,
                          })
                        }
                      />
                      <NoMarginHelperText>{t("settings.ftsMeilisearchApiKeyDes")}</NoMarginHelperText>
                    </SettingForm>
                    <SettingForm title={t("settings.ftsMeilisearchPageSize")} lgWidth={5}>
                      <DenseFilledTextField
                        type="number"
                        inputProps={{ min: 1, step: 1 }}
                        value={values.fts_meilisearch_page_size}
                        onChange={(e) =>
                          setSettings({
                            fts_meilisearch_page_size: e.target.value,
                          })
                        }
                        required
                      />
                      <NoMarginHelperText>{t("settings.ftsMeilisearchPageSizeDes")}</NoMarginHelperText>
                    </SettingForm>
                    <SettingForm lgWidth={5}>
                      <FormControl fullWidth>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isTrueVal(values.fts_meilisearch_embed_enabled)}
                              onChange={(e) =>
                                setSettings({
                                  fts_meilisearch_embed_enabled: e.target.checked ? "1" : "0",
                                })
                              }
                            />
                          }
                          label={t("settings.ftsMeilisearchAISearch")}
                        />
                        <NoMarginHelperText>{t("settings.ftsMeilisearchAISearchDes")}</NoMarginHelperText>
                      </FormControl>
                    </SettingForm>
                    <Collapse in={isTrueVal(values.fts_meilisearch_embed_enabled)} unmountOnExit>
                      <SettingForm title={t("settings.ftsMeilisearchEmbedConfig")} lgWidth={9}>
                        <Suspense fallback={<CircularProgress />}>
                          <MonacoEditor
                            theme={theme.palette.mode === "dark" ? "vs-dark" : "vs"}
                            language="json"
                            value={values.fts_meilisearch_embed_config}
                            onChange={(value) =>
                              setSettings({
                                fts_meilisearch_embed_config: value || "{}",
                              })
                            }
                            height="200px"
                            minHeight="200px"
                            options={{
                              wordWrap: "on",
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                            }}
                          />
                        </Suspense>
                        <NoMarginHelperText>{t("settings.ftsMeilisearchEmbedConfigDes")}</NoMarginHelperText>
                      </SettingForm>
                    </Collapse>
                  </Stack>
                </Collapse>

                {/* Action Buttons */}
                <SettingForm title={t("settings.ftsIndexerActions")} lgWidth={5}>
                  <FormControl fullWidth>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title={t("settings.ftsRebuildIndexTooltip")}>
                        <SecondaryButton
                          startIcon={<BuildOutlined />}
                          variant="contained"
                          color="primary"
                          disabled={rebuildLoading}
                          onClick={() => {
                            dispatch(confirmOperation(t("settings.ftsRebuildIndexConfirm"))).then(() => {
                              setRebuildLoading(true);
                              dispatch(
                                sendRebuildFTSIndex({
                                  skip_text_extraction: rebuildSkipTextExtraction,
                                  skip_attachment_extraction: rebuildSkipAttachmentExtraction,
                                }),
                              )
                                .then(() => {
                                  enqueueSnackbar(t("settings.ftsRebuildIndexSubmitted"), {
                                    variant: "success",
                                    action: DefaultCloseAction,
                                  });
                                })
                                .finally(() => {
                                  setRebuildLoading(false);
                                });
                            });
                          }}
                        >
                          {t("settings.ftsRebuildIndex")}
                        </SecondaryButton>
                      </Tooltip>
                    </Box>
                    <Stack spacing={1.5} sx={{ mt: 2 }}>
                      <Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={rebuildSkipTextExtraction}
                              onChange={(e) => {
                                setRebuildSkipTextExtraction(e.target.checked);
                              }}
                            />
                          }
                          label={t("settings.ftsRebuildSkipTextExtraction")}
                        />
                        <NoMarginHelperText>{t("settings.ftsRebuildSkipTextExtractionDes")}</NoMarginHelperText>
                      </Box>
                      <Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={rebuildSkipAttachmentExtraction}
                              onChange={(e) => {
                                setRebuildSkipAttachmentExtraction(e.target.checked);
                              }}
                            />
                          }
                          label={t("settings.ftsRebuildSkipAttachmentExtraction")}
                        />
                        <NoMarginHelperText>{t("settings.ftsRebuildSkipAttachmentExtractionDes")}</NoMarginHelperText>
                      </Box>
                    </Stack>
                    <NoMarginHelperText>{t("settings.ftsIndexerActionsDes")}</NoMarginHelperText>
                  </FormControl>
                </SettingForm>
              </SettingSectionContent>
            </SettingSection>

            {/* Extractor (Tika) Section */}
            <SettingSection>
              <Typography variant="h6" gutterBottom>
                {t("settings.ftsExtractor")}
              </Typography>
              <SettingSectionContent>
                <SettingForm title={t("settings.ftsTikaEndpoint")} lgWidth={5}>
                  <DenseFilledTextField
                    fullWidth
                    placeholder="http://localhost:9998"
                    value={values.fts_tika_endpoint}
                    onChange={(e) =>
                      setSettings({
                        fts_tika_endpoint: e.target.value,
                      })
                    }
                  />
                  <NoMarginHelperText>{t("settings.ftsTikaEndpointDes")}</NoMarginHelperText>
                </SettingForm>
                <SettingForm lgWidth={5}>
                  <FormControl fullWidth>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isTrueVal(values.fts_tika_document_enabled)}
                          onChange={(e) =>
                            setSettings({
                              fts_tika_document_enabled: e.target.checked ? "1" : "0",
                            })
                          }
                        />
                      }
                      label={t("settings.ftsTikaDocumentEnabled")}
                    />
                    <NoMarginHelperText>{t("settings.ftsTikaDocumentEnabledDes")}</NoMarginHelperText>
                  </FormControl>
                </SettingForm>
                <Collapse in={isTrueVal(values.fts_tika_document_enabled)} unmountOnExit>
                  <SettingForm title={t("settings.ftsTikaDocumentExts")} lgWidth={8}>
                    <DenseFilledTextField
                      fullWidth
                      multiline
                      minRows={3}
                      value={values.fts_tika_document_exts}
                      onChange={(e) =>
                        setSettings({
                          fts_tika_document_exts: e.target.value,
                        })
                      }
                    />
                    <NoMarginHelperText>{t("settings.ftsTikaDocumentExtsDes")}</NoMarginHelperText>
                  </SettingForm>
                </Collapse>
                <SettingForm lgWidth={5}>
                  <FormControl fullWidth>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isTrueVal(values.fts_tika_archive_enabled)}
                          onChange={(e) =>
                            setSettings({
                              fts_tika_archive_enabled: e.target.checked ? "1" : "0",
                            })
                          }
                        />
                      }
                      label={t("settings.ftsTikaArchiveEnabled")}
                    />
                    <NoMarginHelperText>{t("settings.ftsTikaArchiveEnabledDes")}</NoMarginHelperText>
                  </FormControl>
                </SettingForm>
                <Collapse in={isTrueVal(values.fts_tika_archive_enabled)} unmountOnExit>
                  <SettingForm title={t("settings.ftsTikaArchiveExts")} lgWidth={8}>
                    <DenseFilledTextField
                      fullWidth
                      multiline
                      minRows={2}
                      value={values.fts_tika_archive_exts}
                      onChange={(e) =>
                        setSettings({
                          fts_tika_archive_exts: e.target.value,
                        })
                      }
                    />
                    <NoMarginHelperText>{t("settings.ftsTikaArchiveExtsDes")}</NoMarginHelperText>
                  </SettingForm>
                </Collapse>
                <SettingForm title={t("settings.ftsTikaMaxFileSize")} lgWidth={5}>
                  <FormControl>
                    <SizeInput
                      variant={"outlined"}
                      required
                      allowZero={false}
                      value={parseInt(values.fts_tika_max_file_size) || 0}
                      onChange={(e) =>
                        setSettings({
                          fts_tika_max_file_size: e.toString(),
                        })
                      }
                    />
                  </FormControl>
                  <NoMarginHelperText>{t("settings.ftsTikaMaxFileSizeDes")}</NoMarginHelperText>
                </SettingForm>
                <SettingForm lgWidth={5}>
                  <FormControl fullWidth>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isTrueVal(values.fts_tika_sidecar_enabled)}
                          onChange={(e) =>
                            setSettings({
                              fts_tika_sidecar_enabled: e.target.checked ? "1" : "0",
                            })
                          }
                        />
                      }
                      label={t("settings.ftsTikaSidecarEnabled")}
                    />
                    <NoMarginHelperText>{t("settings.ftsTikaSidecarEnabledDes")}</NoMarginHelperText>
                  </FormControl>
                </SettingForm>
                <Collapse in={isTrueVal(values.fts_tika_sidecar_enabled)} unmountOnExit>
                  <Stack spacing={3}>
                    <SettingForm lgWidth={5}>
                      <FormControl fullWidth>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isTrueVal(values.fts_tika_sidecar_text_enabled)}
                              onChange={(e) =>
                                setSettings({
                                  fts_tika_sidecar_text_enabled: e.target.checked ? "1" : "0",
                                })
                              }
                            />
                          }
                          label={t("settings.ftsTikaSidecarTextEnabled")}
                        />
                        <NoMarginHelperText>{t("settings.ftsTikaSidecarTextEnabledDes")}</NoMarginHelperText>
                      </FormControl>
                    </SettingForm>
                    <SettingForm lgWidth={5}>
                      <FormControl fullWidth>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isTrueVal(values.fts_tika_sidecar_assets_enabled)}
                              onChange={(e) =>
                                setSettings({
                                  fts_tika_sidecar_assets_enabled: e.target.checked ? "1" : "0",
                                })
                              }
                            />
                          }
                          label={t("settings.ftsTikaSidecarAssetsEnabled")}
                        />
                        <NoMarginHelperText>{t("settings.ftsTikaSidecarAssetsEnabledDes")}</NoMarginHelperText>
                      </FormControl>
                    </SettingForm>
                    <SettingForm lgWidth={5}>
                      <FormControl fullWidth>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isTrueVal(values.fts_tika_extract_inline_images)}
                              onChange={(e) =>
                                setSettings({
                                  fts_tika_extract_inline_images: e.target.checked ? "1" : "0",
                                })
                              }
                            />
                          }
                          label={t("settings.ftsTikaInlineImages")}
                        />
                        <NoMarginHelperText>{t("settings.ftsTikaInlineImagesDes")}</NoMarginHelperText>
                      </FormControl>
                    </SettingForm>
                    <SettingForm lgWidth={8}>
                      <Alert severity="info" variant="outlined">
                        {t("settings.ftsTikaSidecarRebuildHint")}
                      </Alert>
                    </SettingForm>
                  </Stack>
                </Collapse>
              </SettingSectionContent>
            </SettingSection>

            {/* Chunker Section */}
            <SettingSection>
              <Typography variant="h6" gutterBottom>
                {t("settings.ftsExternalTitle")}
              </Typography>
              <SettingSectionContent>
                <SettingForm lgWidth={5}>
                  <FormControl fullWidth>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={externalEnabled}
                          onChange={(e) =>
                            setSettings({
                              fts_external_enabled: e.target.checked ? "1" : "0",
                            })
                          }
                        />
                      }
                      label={t("settings.ftsExternalEnabled")}
                    />
                    <NoMarginHelperText>{t("settings.ftsExternalEnabledDes")}</NoMarginHelperText>
                  </FormControl>
                </SettingForm>
                <Collapse in={externalEnabled} unmountOnExit>
                  <Stack spacing={3}>
                    <SettingForm title={t("settings.ftsExternalMode")} lgWidth={5}>
                      <DenseFilledTextField
                        select
                        value={externalMode}
                        onChange={(e) =>
                          setSettings({
                            fts_external_mode: e.target.value,
                          })
                        }
                        fullWidth
                      >
                        <MenuItem value="primary">{t("settings.ftsExternalModePrimary")}</MenuItem>
                        <MenuItem value="fallback_on_error">{t("settings.ftsExternalModeFallbackOnError")}</MenuItem>
                        <MenuItem value="fallback_on_error_or_quality">
                          {t("settings.ftsExternalModeFallbackOnErrorOrQuality")}
                        </MenuItem>
                      </DenseFilledTextField>
                      <NoMarginHelperText>{t("settings.ftsExternalModeDes")}</NoMarginHelperText>
                    </SettingForm>
                    <SettingForm title={t("settings.ftsExternalTimeout")} lgWidth={5}>
                      <DenseFilledTextField
                        type="number"
                        inputProps={{ min: 1, step: 1 }}
                        value={values.fts_external_timeout_seconds}
                        onChange={(e) =>
                          setSettings({
                            fts_external_timeout_seconds: e.target.value,
                          })
                        }
                        fullWidth
                      />
                      <NoMarginHelperText>{t("settings.ftsExternalTimeoutDes")}</NoMarginHelperText>
                    </SettingForm>
                    <SettingForm title={t("settings.ftsExternalRetryMax")} lgWidth={5}>
                      <DenseFilledTextField
                        type="number"
                        inputProps={{ min: 0, step: 1 }}
                        value={values.fts_external_retry_max}
                        onChange={(e) =>
                          setSettings({
                            fts_external_retry_max: e.target.value,
                          })
                        }
                        fullWidth
                      />
                      <NoMarginHelperText>{t("settings.ftsExternalRetryMaxDes")}</NoMarginHelperText>
                    </SettingForm>
                    <SettingForm lgWidth={5}>
                      <FormControl fullWidth>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isTrueVal(values.fts_external_recursive_attachments)}
                              onChange={(e) =>
                                setSettings({
                                  fts_external_recursive_attachments: e.target.checked ? "1" : "0",
                                })
                              }
                            />
                          }
                          label={t("settings.ftsExternalRecursiveAttachments")}
                        />
                        <NoMarginHelperText>{t("settings.ftsExternalRecursiveAttachmentsDes")}</NoMarginHelperText>
                      </FormControl>
                    </SettingForm>
                    <SettingForm lgWidth={5}>
                      <FormControl fullWidth>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isTrueVal(values.fts_external_skip_encrypted_files)}
                              onChange={(e) =>
                                setSettings({
                                  fts_external_skip_encrypted_files: e.target.checked ? "1" : "0",
                                })
                              }
                            />
                          }
                          label={t("settings.ftsExternalSkipEncrypted")}
                        />
                        <NoMarginHelperText>{t("settings.ftsExternalSkipEncryptedDes")}</NoMarginHelperText>
                      </FormControl>
                    </SettingForm>

                    <SettingForm lgWidth={5}>
                      <FormControl fullWidth>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={externalUseGlobalKafka}
                              onChange={(e) =>
                                setSettings({
                                  fts_external_use_global_kafka: e.target.checked ? "1" : "0",
                                })
                              }
                            />
                          }
                          label={t("settings.ftsExternalUseGlobalKafka")}
                        />
                        <NoMarginHelperText>{t("settings.ftsExternalUseGlobalKafkaDes")}</NoMarginHelperText>
                      </FormControl>
                    </SettingForm>
                    <Collapse in={!externalUseGlobalKafka} unmountOnExit>
                      <Stack spacing={3}>
                        <SettingForm title={t("settings.ftsExternalKafkaBrokers")} lgWidth={8}>
                          <DenseFilledTextField
                            fullWidth
                            multiline
                            minRows={2}
                            value={values.fts_external_kafka_brokers}
                            onChange={(e) =>
                              setSettings({
                                fts_external_kafka_brokers: e.target.value,
                              })
                            }
                          />
                          <NoMarginHelperText>{t("settings.ftsExternalKafkaBrokersDes")}</NoMarginHelperText>
                        </SettingForm>
                        <SettingForm title={t("settings.ftsExternalKafkaSecurityProtocol")} lgWidth={5}>
                          <DenseFilledTextField
                            select
                            fullWidth
                            value={values.fts_external_kafka_security_protocol || "PLAINTEXT"}
                            onChange={(e) =>
                              setSettings({
                                fts_external_kafka_security_protocol: e.target.value,
                              })
                            }
                          >
                            <MenuItem value="PLAINTEXT">PLAINTEXT</MenuItem>
                            <MenuItem value="SSL">SSL</MenuItem>
                            <MenuItem value="SASL_PLAINTEXT">SASL_PLAINTEXT</MenuItem>
                            <MenuItem value="SASL_SSL">SASL_SSL</MenuItem>
                          </DenseFilledTextField>
                          <NoMarginHelperText>{t("settings.ftsExternalKafkaSecurityProtocolDes")}</NoMarginHelperText>
                        </SettingForm>
                        <SettingForm title={t("settings.ftsExternalKafkaSaslMechanism")} lgWidth={5}>
                          <DenseFilledTextField
                            select
                            fullWidth
                            value={values.fts_external_kafka_sasl_mechanism || "PLAIN"}
                            onChange={(e) =>
                              setSettings({
                                fts_external_kafka_sasl_mechanism: e.target.value,
                              })
                            }
                          >
                            <MenuItem value="PLAIN">PLAIN</MenuItem>
                          </DenseFilledTextField>
                          <NoMarginHelperText>{t("settings.ftsExternalKafkaSaslMechanismDes")}</NoMarginHelperText>
                        </SettingForm>
                        <SettingForm title={t("settings.ftsExternalKafkaUsername")} lgWidth={5}>
                          <DenseFilledTextField
                            fullWidth
                            value={values.fts_external_kafka_username}
                            onChange={(e) =>
                              setSettings({
                                fts_external_kafka_username: e.target.value,
                              })
                            }
                          />
                          <NoMarginHelperText>{t("settings.ftsExternalKafkaUsernameDes")}</NoMarginHelperText>
                        </SettingForm>
                        <SettingForm title={t("settings.ftsExternalKafkaPassword")} lgWidth={5}>
                          <DenseFilledTextField
                            fullWidth
                            type="password"
                            value={values.fts_external_kafka_password}
                            onChange={(e) =>
                              setSettings({
                                fts_external_kafka_password: e.target.value,
                              })
                            }
                          />
                          <NoMarginHelperText>{t("settings.ftsExternalKafkaPasswordDes")}</NoMarginHelperText>
                        </SettingForm>
                        <SettingForm lgWidth={5}>
                          <FormControl fullWidth>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={isTrueVal(values.fts_external_kafka_tls_skip_verify)}
                                  onChange={(e) =>
                                    setSettings({
                                      fts_external_kafka_tls_skip_verify: e.target.checked ? "1" : "0",
                                    })
                                  }
                                />
                              }
                              label={t("settings.ftsExternalKafkaTLSSkipVerify")}
                            />
                            <NoMarginHelperText>{t("settings.ftsExternalKafkaTLSSkipVerifyDes")}</NoMarginHelperText>
                          </FormControl>
                        </SettingForm>
                      </Stack>
                    </Collapse>

                    <SettingForm title={t("settings.ftsExternalKafkaProcessTopic")} lgWidth={5}>
                      <DenseFilledTextField
                        fullWidth
                        value={values.fts_external_kafka_process_topic}
                        onChange={(e) =>
                          setSettings({
                            fts_external_kafka_process_topic: e.target.value,
                          })
                        }
                      />
                      <NoMarginHelperText>{t("settings.ftsExternalKafkaProcessTopicDes")}</NoMarginHelperText>
                    </SettingForm>
                    <SettingForm title={t("settings.ftsExternalKafkaResultTopic")} lgWidth={5}>
                      <DenseFilledTextField
                        fullWidth
                        value={values.fts_external_kafka_result_topic}
                        onChange={(e) =>
                          setSettings({
                            fts_external_kafka_result_topic: e.target.value,
                          })
                        }
                      />
                      <NoMarginHelperText>{t("settings.ftsExternalKafkaResultTopicDes")}</NoMarginHelperText>
                    </SettingForm>
                    <SettingForm title={t("settings.ftsExternalKafkaErrorTopic")} lgWidth={5}>
                      <DenseFilledTextField
                        fullWidth
                        value={values.fts_external_kafka_error_topic}
                        onChange={(e) =>
                          setSettings({
                            fts_external_kafka_error_topic: e.target.value,
                          })
                        }
                      />
                      <NoMarginHelperText>{t("settings.ftsExternalKafkaErrorTopicDes")}</NoMarginHelperText>
                    </SettingForm>
                    <SettingForm title={t("settings.ftsExternalKafkaConsumerGroup")} lgWidth={5}>
                      <DenseFilledTextField
                        fullWidth
                        value={values.fts_external_kafka_consumer_group}
                        onChange={(e) =>
                          setSettings({
                            fts_external_kafka_consumer_group: e.target.value,
                          })
                        }
                      />
                      <NoMarginHelperText>{t("settings.ftsExternalKafkaConsumerGroupDes")}</NoMarginHelperText>
                    </SettingForm>

                    <SettingForm lgWidth={5}>
                      <FormControl fullWidth>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={externalQualityEnabled}
                              onChange={(e) =>
                                setSettings({
                                  fts_external_quality_enabled: e.target.checked ? "1" : "0",
                                })
                              }
                            />
                          }
                          label={t("settings.ftsExternalQualityEnabled")}
                        />
                        <NoMarginHelperText>{t("settings.ftsExternalQualityEnabledDes")}</NoMarginHelperText>
                      </FormControl>
                    </SettingForm>
                    <Collapse in={externalQualityEnabled} unmountOnExit>
                      <Stack spacing={3}>
                        <Alert severity="info">{t("settings.ftsExternalQualityFontLossDetectionNotice")}</Alert>
                        <SettingForm title={t("settings.ftsExternalQualityMinTextLength")} lgWidth={5}>
                          <DenseFilledTextField
                            type="number"
                            inputProps={{ min: 0, step: 1 }}
                            fullWidth
                            value={values.fts_external_quality_min_text_length}
                            onChange={(e) =>
                              setSettings({
                                fts_external_quality_min_text_length: e.target.value,
                              })
                            }
                          />
                          <NoMarginHelperText>{t("settings.ftsExternalQualityMinTextLengthDes")}</NoMarginHelperText>
                        </SettingForm>
                        <SettingForm title={t("settings.ftsExternalQualityMaxReplacementRatio")} lgWidth={5}>
                          <DenseFilledTextField
                            type="number"
                            inputProps={{ min: 0, max: 1, step: 0.01 }}
                            fullWidth
                            value={values.fts_external_quality_max_replacement_ratio}
                            onChange={(e) =>
                              setSettings({
                                fts_external_quality_max_replacement_ratio: e.target.value,
                              })
                            }
                          />
                          <NoMarginHelperText>
                            {t("settings.ftsExternalQualityMaxReplacementRatioDes")}
                          </NoMarginHelperText>
                        </SettingForm>
                        <SettingForm title={t("settings.ftsExternalQualityMaxControlCharRatio")} lgWidth={5}>
                          <DenseFilledTextField
                            type="number"
                            inputProps={{ min: 0, max: 1, step: 0.01 }}
                            fullWidth
                            value={values.fts_external_quality_max_control_char_ratio}
                            onChange={(e) =>
                              setSettings({
                                fts_external_quality_max_control_char_ratio: e.target.value,
                              })
                            }
                          />
                          <NoMarginHelperText>
                            {t("settings.ftsExternalQualityMaxControlCharRatioDes")}
                          </NoMarginHelperText>
                        </SettingForm>
                        <SettingForm title={t("settings.ftsExternalQualityMinPrintableRatio")} lgWidth={5}>
                          <DenseFilledTextField
                            type="number"
                            inputProps={{ min: 0, max: 1, step: 0.01 }}
                            fullWidth
                            value={values.fts_external_quality_min_printable_ratio}
                            onChange={(e) =>
                              setSettings({
                                fts_external_quality_min_printable_ratio: e.target.value,
                              })
                            }
                          />
                          <NoMarginHelperText>
                            {t("settings.ftsExternalQualityMinPrintableRatioDes")}
                          </NoMarginHelperText>
                        </SettingForm>
                        <SettingForm title={t("settings.ftsExternalQualityFontBoxMinCount")} lgWidth={5}>
                          <DenseFilledTextField
                            type="number"
                            inputProps={{ min: 1, step: 1 }}
                            fullWidth
                            value={values.fts_external_quality_font_box_min_count}
                            onChange={(e) =>
                              setSettings({
                                fts_external_quality_font_box_min_count: e.target.value,
                              })
                            }
                          />
                          <NoMarginHelperText>{t("settings.ftsExternalQualityFontBoxMinCountDes")}</NoMarginHelperText>
                        </SettingForm>
                        <SettingForm title={t("settings.ftsExternalQualityFontBoxMinRun")} lgWidth={5}>
                          <DenseFilledTextField
                            type="number"
                            inputProps={{ min: 1, step: 1 }}
                            fullWidth
                            value={values.fts_external_quality_font_box_min_run}
                            onChange={(e) =>
                              setSettings({
                                fts_external_quality_font_box_min_run: e.target.value,
                              })
                            }
                          />
                          <NoMarginHelperText>{t("settings.ftsExternalQualityFontBoxMinRunDes")}</NoMarginHelperText>
                        </SettingForm>
                        <SettingForm title={t("settings.ftsExternalQualityFontBoxMinRatio")} lgWidth={5}>
                          <DenseFilledTextField
                            type="number"
                            inputProps={{ min: 0, max: 1, step: 0.01 }}
                            fullWidth
                            value={values.fts_external_quality_font_box_min_ratio}
                            onChange={(e) =>
                              setSettings({
                                fts_external_quality_font_box_min_ratio: e.target.value,
                              })
                            }
                          />
                          <NoMarginHelperText>{t("settings.ftsExternalQualityFontBoxMinRatioDes")}</NoMarginHelperText>
                        </SettingForm>
                      </Stack>
                    </Collapse>
                  </Stack>
                </Collapse>
              </SettingSectionContent>
            </SettingSection>

            <SettingSection>
              <Typography variant="h6" gutterBottom>
                {t("settings.ftsChunker")}
              </Typography>
              <SettingSectionContent>
                <SettingForm title={t("settings.ftsChunkSize")} lgWidth={5}>
                  <FormControl>
                    <SizeInput
                      variant={"outlined"}
                      required
                      allowZero={false}
                      value={parseInt(values.fts_chunk_size) || 0}
                      onChange={(e) =>
                        setSettings({
                          fts_chunk_size: e.toString(),
                        })
                      }
                    />
                  </FormControl>
                  <NoMarginHelperText>{t("settings.ftsChunkSizeDes")}</NoMarginHelperText>
                </SettingForm>
              </SettingSectionContent>
            </SettingSection>
          </Stack>
        </Collapse>
      </Stack>
    </Box>
  );
};

export default FullTextSearchSetting;
