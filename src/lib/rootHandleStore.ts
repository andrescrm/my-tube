import { get, set, del } from "idb-keyval";

// FileSystemDirectoryHandle instances are structured-cloneable but not JSON-serializable,
// so they can't live in localStorage — IndexedDB (via idb-keyval) is the only option here.
const ROOT_HANDLE_KEY = "mytube:rootDirectoryHandle";

export function getStoredRootHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  return get(ROOT_HANDLE_KEY);
}

export function setStoredRootHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  return set(ROOT_HANDLE_KEY, handle);
}

export function clearStoredRootHandle(): Promise<void> {
  return del(ROOT_HANDLE_KEY);
}

export async function verifyPermission(
  handle: FileSystemDirectoryHandle,
  requestIfNeeded: boolean,
): Promise<boolean> {
  const options: FileSystemHandlePermissionDescriptor = { mode: "read" };

  if ((await handle.queryPermission(options)) === "granted") {
    return true;
  }

  if (!requestIfNeeded) {
    return false;
  }

  return (await handle.requestPermission(options)) === "granted";
}
