import { PaginationResults } from "./explorer.ts";

export interface ListDavAccountsService {
  page_size: number;
  next_page_token?: string;
}

export interface DavAccount {
  id: string;
  created_at: string;
  name: string;
  uri: string;
  password: string;
  options?: string;
}

export interface ListDavAccountsResponse {
  accounts: DavAccount[];
  pagination?: PaginationResults;
}

export interface SyncthingDevice {
  created_at: string;
  updated_at: string;
  device_id: string;
  short_id?: string;
  last_ip?: string;
  bind_uri?: string;
  client_version?: string;
  platform?: string;
  last_seen_at?: string;
  last_sync_at?: string;
  online: boolean;
  is_bound: boolean;
}

export interface ListSyncthingDevicesResponse {
  devices: SyncthingDevice[];
}

export const DavAccountOption = {
  readonly: 0,
  proxy: 1,
  disable_sys_files: 2,
};

export interface CreateDavAccountService {
  name: string;
  uri: string;
  readonly?: boolean;
  proxy?: boolean;
  disable_sys_files?: boolean;
}
