declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      id?: string;
      mode?: FileSystemPermissionMode;
      startIn?: string;
    }) => Promise<FileSystemDirectoryHandle>;
  }

  interface NavigatorUAData {
    mobile?: boolean;
    platform?: string;
  }

  interface Navigator {
    userAgentData?: NavigatorUAData;
  }

  type FileSystemPermissionMode = "read" | "readwrite";
  type FileSystemPermissionState = "granted" | "denied" | "prompt";

  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    queryPermission?(descriptor?: { mode?: FileSystemPermissionMode }): Promise<FileSystemPermissionState>;
    requestPermission?(descriptor?: { mode?: FileSystemPermissionMode }): Promise<FileSystemPermissionState>;
  }
}

export {};
