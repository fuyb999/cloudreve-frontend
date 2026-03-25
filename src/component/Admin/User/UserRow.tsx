import { Box, Checkbox, IconButton, Link, Skeleton, TableCell, TableRow, Tooltip } from "@mui/material";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { batchDeleteUser } from "../../../api/api";
import { User, UserStatus } from "../../../api/dashboard";
import { useAppDispatch } from "../../../redux/hooks";
import { confirmOperation } from "../../../redux/thunks/dialog";
import { sizeToString } from "../../../util";
import { NoWrapTableCell, NoWrapTypography, SquareChip } from "../../Common/StyledComponents";
import UserAvatar from "../../Common/User/UserAvatar";
import Delete from "../../Icons/Delete";
import PersonPasskey from "../../Icons/PersonPasskey";

export interface UserRowProps {
  user?: User;
  loading?: boolean;
  deleting?: boolean;
  selected?: boolean;
  onDelete?: () => void;
  onDetails?: (id: number) => void;
  onSelect?: (id: number) => void;
}

const UserRow = ({ user, loading, deleting, selected, onDelete, onDetails, onSelect }: UserRowProps) => {
  const { t } = useTranslation("dashboard");
  const dispatch = useAppDispatch();
  const [deleteLoading, setDeleteLoading] = useState(false);

  const onRowClick = () => {
    onDetails?.(user?.id ?? 0);
  };

  const onDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(confirmOperation(t("user.confirmDelete", { user: user?.username || user?.email }))).then(() => {
      if (user?.id) {
        setDeleteLoading(true);
        dispatch(batchDeleteUser({ ids: [user.id] }))
          .then(() => {
            onDelete?.();
          })
          .finally(() => {
            setDeleteLoading(false);
          });
      }
    });
  };

  const onSelectClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect?.(user?.id ?? 0);
  };

  if (loading) {
    return (
      <TableRow sx={{ height: "43px" }}>
        <NoWrapTableCell>
          <Skeleton variant="circular" width={24} height={24} />
        </NoWrapTableCell>
        <NoWrapTableCell>
          <Skeleton variant="text" width={60} />
        </NoWrapTableCell>
        <NoWrapTableCell>
          <Skeleton variant="text" width={180} />
        </NoWrapTableCell>
        <NoWrapTableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width={140} />
          </Box>
        </NoWrapTableCell>
        <NoWrapTableCell>
          <Skeleton variant="text" width={220} />
        </NoWrapTableCell>
        <NoWrapTableCell>
          <Skeleton variant="text" width={150} />
        </NoWrapTableCell>
        <NoWrapTableCell>
          <Skeleton variant="text" width={100} />
        </NoWrapTableCell>
        <NoWrapTableCell align="right">
          <Skeleton variant="circular" width={24} height={24} />
        </NoWrapTableCell>
      </TableRow>
    );
  }

  const stopPropagation = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
  };

  return (
    <TableRow hover key={user?.id} sx={{ cursor: "pointer" }} onClick={onRowClick} selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox
          disabled={deleting}
          size="small"
          disableRipple
          color="primary"
          onClick={onSelectClick}
          checked={selected}
        />
      </TableCell>
      <NoWrapTableCell>
        <NoWrapTypography variant="inherit">{user?.id}</NoWrapTypography>
      </NoWrapTableCell>
      <NoWrapTableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <NoWrapTypography sx={{ minWidth: 0, flex: 1 }} variant="inherit">
            {user?.username}
          </NoWrapTypography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
            {user?.status == UserStatus.inactive && <SquareChip size="small" label={t("user.status_inactive")} />}
            {user?.status == UserStatus.sys_banned && (
              <SquareChip size="small" color="error" label={t("user.status_sys_banned")} />
            )}
            {user?.status == UserStatus.manual_banned && (
              <SquareChip size="small" color="error" label={t("user.status_manual_banned")} />
            )}
            {user?.two_fa_enabled && (
              <Tooltip title={t("user.2FAEnabled")}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <PersonPasskey fontSize="small" sx={{ color: "text.secondary" }} />
                </Box>
              </Tooltip>
            )}
          </Box>
        </Box>
      </NoWrapTableCell>
      <NoWrapTableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <UserAvatar
            sx={{ width: 24, height: 24 }}
            overwriteTextSize
            user={{ id: user?.hash_id ?? "", nickname: user?.nick ?? "", created_at: user?.created_at ?? "" }}
          />
          <NoWrapTypography sx={{ minWidth: 0, flex: 1 }} variant="inherit">
            {user?.nick}
          </NoWrapTypography>
        </Box>
      </NoWrapTableCell>
      <NoWrapTableCell>
        <NoWrapTypography variant="inherit">{user?.email}</NoWrapTypography>
      </NoWrapTableCell>
      <NoWrapTableCell>
        <NoWrapTypography variant="inherit">
          <Link
            onClick={stopPropagation}
            component={RouterLink}
            to={`/admin/group/${user?.edges?.group?.id}`}
            underline="hover"
          >
            {user?.edges?.group?.name}
          </Link>
        </NoWrapTypography>
      </NoWrapTableCell>
      <NoWrapTableCell>{sizeToString(user?.storage ?? 0)}</NoWrapTableCell>
      <NoWrapTableCell align="right">
        <IconButton size="small" onClick={onDeleteClick} disabled={deleteLoading || deleting}>
          <Delete fontSize="small" />
        </IconButton>
      </NoWrapTableCell>
    </TableRow>
  );
};

export default UserRow;
