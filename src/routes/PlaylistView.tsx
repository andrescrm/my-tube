import { useParams } from "react-router-dom";
import { useLibrary } from "../context/LibraryContext";
import { VideoGrid } from "../components/VideoGrid";

export function PlaylistView() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const { library } = useLibrary();
  const playlist = library?.playlists.find((p) => p.id === playlistId);

  if (!playlist) {
    return <p className="text-neutral-500">Playlist not found.</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">{playlist.name}</h1>
      <VideoGrid videos={playlist.videos} emptyMessage="This folder has no playable videos." />
    </div>
  );
}
