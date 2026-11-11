import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Library, VideoEntry } from "../lib/types";
import { scanLibrary } from "../lib/scanLibrary";
import { getStoredRootHandle, setStoredRootHandle, verifyPermission } from "../lib/rootHandleStore";

type Status =
  | { kind: "checking" }
  | { kind: "no-folder" }
  | { kind: "needs-permission"; rootName: string }
  | { kind: "ready" }
  | { kind: "error"; message: string };

interface LibraryContextValue {
  status: Status;
  library: Library | null;
  allVideos: VideoEntry[];
  pickFolder: () => Promise<void>;
  reconnect: () => Promise<void>;
  findVideoById: (videoId: string) => VideoEntry | undefined;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

let cachedRootHandle: FileSystemDirectoryHandle | null = null;

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>({ kind: "checking" });
  const [library, setLibrary] = useState<Library | null>(null);

  const loadFrom = useCallback(async (handle: FileSystemDirectoryHandle) => {
    try {
      const scanned = await scanLibrary(handle);
      cachedRootHandle = handle;
      setLibrary(scanned);
      setStatus({ kind: "ready" });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Failed to scan folder" });
    }
  }, []);

  const pickFolder = useCallback(async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: "read" });
      await setStoredRootHandle(handle);
      await loadFrom(handle);
    } catch (err) {
      // AbortError means the user closed the picker without choosing — not a real error.
      if (err instanceof DOMException && err.name === "AbortError") return;
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Could not open folder picker" });
    }
  }, [loadFrom]);

  const reconnect = useCallback(async () => {
    const handle = cachedRootHandle ?? (await getStoredRootHandle());
    if (!handle) {
      setStatus({ kind: "no-folder" });
      return;
    }
    const granted = await verifyPermission(handle, true);
    if (granted) {
      await loadFrom(handle);
    } else {
      setStatus({ kind: "needs-permission", rootName: handle.name });
    }
  }, [loadFrom]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const handle = await getStoredRootHandle();
      if (!handle) {
        if (!cancelled) setStatus({ kind: "no-folder" });
        return;
      }
      cachedRootHandle = handle;
      // Never auto-request permission on mount: requestPermission() requires a user
      // gesture, so a silent query only — the UI prompts the user to click "Reconnect".
      const granted = await verifyPermission(handle, false);
      if (cancelled) return;
      if (granted) {
        await loadFrom(handle);
      } else {
        setStatus({ kind: "needs-permission", rootName: handle.name });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadFrom]);

  const allVideos = useMemo(
    () => (library ? [...library.uncategorized, ...library.playlists.flatMap((p) => p.videos)] : []),
    [library],
  );

  const findVideoById = useCallback(
    (videoId: string): VideoEntry | undefined => allVideos.find((v) => v.id === videoId),
    [allVideos],
  );

  const value: LibraryContextValue = {
    status,
    library,
    allVideos,
    pickFolder,
    reconnect,
    findVideoById,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within a LibraryProvider");
  return ctx;
}
