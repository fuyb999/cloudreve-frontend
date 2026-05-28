import { FileResponse } from "../api/explorer.ts";
import CrUri from "./uri.ts";
import { allowedCopyMoveDestinationFilesystems } from "./permissionRules.ts";

// canCopyMoveTo checks if the files can be copied or moved to the destination.
export function canCopyMoveTo(files: FileResponse[], dst: string, isCopy: boolean): boolean {
  const dstUri = new CrUri(dst);
  const srcUri = new CrUri(files[0].path);
  return allowedCopyMoveDestinationFilesystems(srcUri.fs(), isCopy).includes(dstUri.fs());
}

export function allowedMoveCopyDestinationFilesystems(files: FileResponse[], isCopy: boolean): string[] | undefined {
  if (files.length === 0) {
    return undefined;
  }

  return allowedCopyMoveDestinationFilesystems(new CrUri(files[0].path).fs(), isCopy);
}
