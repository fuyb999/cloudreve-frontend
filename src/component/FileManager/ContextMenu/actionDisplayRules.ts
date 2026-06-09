export interface CreateArchiveActionRule {
  hasReadable?: boolean;
  hasCurrentUser: boolean;
  hasArchiveTaskPermission: boolean;
  hasCreateArchiveCapability: boolean;
}

export const canShowCreateArchiveAction = ({
  hasReadable,
  hasCurrentUser,
  hasArchiveTaskPermission,
  hasCreateArchiveCapability,
}: CreateArchiveActionRule) =>
  !!(hasReadable && hasCurrentUser && hasArchiveTaskPermission && hasCreateArchiveCapability);
