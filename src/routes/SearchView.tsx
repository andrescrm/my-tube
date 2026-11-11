import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useLibrary } from "../context/LibraryContext";
import { VideoGrid } from "../components/VideoGrid";

export function SearchView() {
  const [params] = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const { allVideos } = useLibrary();

  const results = useMemo(() => {
    if (!query) return [];
    const terms = query.toLowerCase().split(/\s+/);
    return allVideos.filter((v) => {
      const haystack = `${v.name} ${v.playlistName ?? ""}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [allVideos, query]);

  if (!query) {
    return <p className="text-neutral-500">Type something to search across all your videos and playlists.</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">
        Results for "{query}" <span className="text-sm font-normal text-neutral-500">({results.length})</span>
      </h1>
      <VideoGrid videos={results} emptyMessage={`No videos match "${query}".`} />
    </div>
  );
}
