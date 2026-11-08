import { useMemo } from "react";
import { useLibrary } from "../context/LibraryContext";
import { VideoGrid } from "../components/VideoGrid";
import { getRecent } from "../lib/watchStorage";

export function Home() {
  const { library, findVideoById } = useLibrary();

  const recentVideos = useMemo(() => {
    if (!library) return [];
    return getRecent()
      .map((entry) => findVideoById(entry.videoId))
      .filter((v) => v !== undefined);
  }, [library, findVideoById]);

  return (
    <div className="flex flex-col gap-10">
      {recentVideos.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Continue watching</h2>
          <VideoGrid videos={recentVideos} emptyMessage="" />
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold">All videos</h2>
        <VideoGrid
          videos={library?.uncategorized ?? []}
          emptyMessage="No videos found directly in the root folder. Videos inside subfolders show up under their playlist in the sidebar."
        />
      </section>
    </div>
  );
}
