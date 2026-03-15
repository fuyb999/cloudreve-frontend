import { AuditLogType } from "../../../api/explorer";

export interface AuditEventCategory {
  key: string;
  title: string;
  description: string;
  events: number[];
}

export const auditEventCategories: AuditEventCategory[] = [
  {
    key: "system",
    title: "settings.systemEvents",
    description: "settings.systemEventsDes",
    events: [AuditLogType.server_start],
  },
  {
    key: "user",
    title: "settings.userEvents",
    description: "settings.userEventsDes",
    events: [
      AuditLogType.user_signup,
      AuditLogType.user_activated,
      AuditLogType.user_login,
      AuditLogType.user_login_failed,
      AuditLogType.user_token_refresh,
      AuditLogType.change_nick,
      AuditLogType.change_avatar,
      AuditLogType.change_password,
      AuditLogType.enable_2fa,
      AuditLogType.disable_2fa,
      AuditLogType.add_passkey,
      AuditLogType.remove_passkey,
      AuditLogType.oauth_grant_create,
      AuditLogType.oauth_token_exchange,
      AuditLogType.oauth_grant_revoke,
    ],
  },
  {
    key: "file",
    title: "settings.fileEvents",
    description: "settings.fileEventsDes",
    events: [
      AuditLogType.file_create,
      AuditLogType.file_imported,
      AuditLogType.file_rename,
      AuditLogType.entity_uploaded,
      AuditLogType.entity_downloaded,
      AuditLogType.copy_from,
      AuditLogType.copy_to,
      AuditLogType.move_to,
      AuditLogType.delete_file,
      AuditLogType.move_to_trash,
      AuditLogType.update_metadata,
      AuditLogType.get_direct_link,
      AuditLogType.delete_direct_link,
      AuditLogType.update_view,
    ],
  },
  {
    key: "version",
    title: "settings.versionEvents",
    description: "settings.versionEventsDes",
    events: [AuditLogType.set_current_version, AuditLogType.delete_version],
  },
  {
    key: "media",
    title: "settings.mediaEvents",
    description: "settings.mediaEventsDes",
    events: [AuditLogType.thumb_generated, AuditLogType.live_photo_uploaded],
  },
  {
    key: "filesystem",
    title: "settings.filesystemEvents",
    description: "settings.filesystemEventsDes",
    events: [AuditLogType.create_archive, AuditLogType.extract_archive],
  },
  {
    key: "webdav",
    title: "settings.webdavEvents",
    description: "settings.webdavEventsDes",
    events: [
      AuditLogType.webdav_login_failed,
      AuditLogType.webdav_account_create,
      AuditLogType.webdav_account_update,
      AuditLogType.webdav_account_delete,
    ],
  },
  {
    key: "email",
    title: "settings.emailEvents",
    description: "settings.emailEventsDes",
    events: [AuditLogType.email_sent],
  },
];

export const implementedAuditLogTypes = Array.from(
  new Set(auditEventCategories.flatMap((category) => category.events)),
).sort((a, b) => a - b);

export const getEventName = (eventType: number): string => {
  return Object.entries(AuditLogType).find(([_, value]) => value === eventType)?.[0] || `event_${eventType}`;
};

export const parseEnabledEventTypes = (raw?: string): number[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is number => typeof item === "number");
  } catch {
    return [];
  }
};

export const serializeEnabledEventTypes = (types: Iterable<number>) => {
  return JSON.stringify(Array.from(new Set(types)).sort((a, b) => a - b));
};
