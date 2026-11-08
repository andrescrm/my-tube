import type { Library, Playlist, VideoEntry } from "./types";
import { isVideoFile } from "./types";
import { deriveVideoId } from "./videoId";

async function collectVideosIn(
  dirHandle: FileSystemDirectoryHandle,
  relativePrefix: string,
  playlistName: string | null,
): Promise<VideoEntry[]> {
  const entries: VideoEntry[] = [];

  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind !== "file" || !isVideoFile(name)) continue;

    const file = await handle.getFile();
    const relativePath = `${relativePrefix}${name}`;
    entries.push({
      id: deriveVideoId(relativePath, file.size, file.lastModified),
      name,
      relativePath,
      playlistName,
      handle,
    });
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));
  return entries;
}

// Scans exactly one level deep: immediate subfolders become playlists, videos
// sitting directly in the root become "uncategorized". See CLAUDE.md — deeper
// recursion/nested playlists are explicitly out of scope for now.
export async function scanLibrary(rootHandle: FileSystemDirectoryHandle): Promise<Library> {
  const playlists: Playlist[] = [];

  const uncategorized = await collectVideosIn(rootHandle, "", null);

  for await (const [name, handle] of rootHandle.entries()) {
    if (handle.kind !== "directory") continue;

    const videos = await collectVideosIn(handle, `${name}/`, name);
    // React Router encodes/decodes URL segments on its own — using the raw name here
    // (rather than pre-encoding it) keeps this id consistent with the decoded useParams()
    // value in PlaylistView, even for names with spaces or other special characters.
    playlists.push({ id: name, name, videos });
  }

  playlists.sort((a, b) => a.name.localeCompare(b.name));

  return { rootName: rootHandle.name, playlists, uncategorized };
}
