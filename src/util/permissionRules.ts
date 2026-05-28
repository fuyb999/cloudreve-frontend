export function allowedCopyMoveDestinationFilesystems(srcFs: string, isCopy: boolean): string[] {
  if (isCopy) {
    switch (srcFs) {
      case "my":
      case "public":
        return ["my", "public"];
      default:
        return [];
    }
  }

  switch (srcFs) {
    case "my":
      return ["my", "trash", "public"];
    case "trash":
      return ["my"];
    case "public":
      return ["public"];
    default:
      return [];
  }
}
