import type { VideoEntry } from "../lib/types";
import { VideoCard } from "./VideoCard";

export function VideoGrid({ videos, emptyMessage }: { videos: VideoEntry[]; emptyMessage: string }) {
  if (videos.length === 0) {
    return <p className="text-neutral-500">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
