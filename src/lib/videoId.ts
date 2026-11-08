// Derives a stable, URL-safe ID from a video's relative path + size + lastModified.
// There is no database, so this triple stands in for a primary key: it survives
// re-scans of the same folder as long as the file itself doesn't change, and two
// files with the same name in different playlists never collide.
export function deriveVideoId(relativePath: string, size: number, lastModified: number): string {
  const raw = `${relativePath}::${size}::${lastModified}`;
  const encoded = encodeURIComponent(raw);
  return btoa(encoded).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
