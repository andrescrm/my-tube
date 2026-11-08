import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { VideoEntry } from "../lib/types";
import { getThumbnail } from "../lib/thumbnail";
import { getProgress } from "../lib/watchStorage";

export function VideoCard({ video }: { video: VideoEntry }) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const progress = getProgress(video.id);
  const progressPct =
    progress && progress.duration > 0 ? Math.min(100, (progress.currentTime / progress.duration) * 100) : 0;

  useEffect(() => {
    let cancelled = false;
    video.handle.getFile().then((file) => {
      getThumbnail(video.id, file).then((url) => {
        if (!cancelled) setThumbnail(url);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [video]);

  return (
    <Link
      to={`/watch/${video.id}`}
      className="group flex flex-col gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-red-500"
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-800">
        {thumbnail ? (
          <img src={thumbnail} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-600">
            <svg viewBox="0 0 24 24" className="h-10 w-10 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        {progressPct > 1 && (
          <div className="absolute bottom-0 left-0 h-1 w-full bg-black/50">
            <div className="h-full bg-red-600" style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <span className="line-clamp-2 text-sm font-medium text-neutral-100">{video.name}</span>
        {video.playlistName && <span className="text-xs text-neutral-400">{video.playlistName}</span>}
      </div>
    </Link>
  );
}
