import PageHeader from "../PageHeader.tsx";
import { Container } from "@mui/material";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import ResponsiveTabs from "../../Common/ResponsiveTabs.tsx";
import { useAppDispatch } from "../../../redux/hooks.ts";
import { loadSiteConfig } from "../../../redux/thunks/site.ts";
import PageContainer from "../PageContainer.tsx";
import SyncthingClient from "./SyncthingClient.tsx";

export enum DevicePageTab {
  Syncthing = "syncthing",
}

const Devices = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const tabs = useMemo(() => {
    return [
      {
        label: t("setting.syncthingClient"),
        value: DevicePageTab.Syncthing,
      },
    ];
  }, [t]);

  useEffect(() => {
    dispatch(loadSiteConfig("app"));
  }, [dispatch]);

  return (
    <PageContainer>
      <Container maxWidth="lg">
        <PageHeader title={t("application:navbar.connect")} />
        <ResponsiveTabs value={DevicePageTab.Syncthing} onChange={() => undefined} tabs={tabs} />
        <SyncthingClient />
      </Container>
    </PageContainer>
  );
};

export default Devices;
