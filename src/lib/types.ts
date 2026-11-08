export interface VideoEntry {
  id: string;
  name: string;
  relativePath: string;
  playlistName: string | null;
  handle: FileSystemFileHandle;
}

export interface Playlist {
  id: string;
  name: string;
  videos: VideoEntry[];
}

export interface Library {
  rootName: string;
  playlists: Playlist[];
  uncategorized: VideoEntry[];
}

export type PermissionState = "idle" | "granted" | "needs-permission" | "no-handle";

// Broad list of video container extensions to *enumerate* as videos in the library.
// Whether a given file actually plays depends on the browser's native codec support
// (mp4/webm/ogg are reliable; mkv/avi/etc. often are not) — that failure is surfaced
// per-file in the player UI, not by hiding the file from playlists.
const VIDEO_EXTENSIONS = [
  ".mp4", ".webm", ".ogg", ".ogv", ".mov",
  ".mkv", ".avi", ".flv", ".wmv", ".m4v",
];

export function isVideoFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
