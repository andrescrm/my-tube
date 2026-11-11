import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { VideoEntry } from "../lib/types";
import { getThumbnail } from "../lib/thumbnail";
import { getProgress } from "../lib/watchStorage";

export function VideoCard({ video }: { video: VideoEntry }) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const progress = getProgress(video.id);
  const progressPct =
    progress && progress.duration > 0 ? Math.min(100, (progress.currentTime / progress.duration) * 100) : 0;

  // Only start generating/loading the thumbnail once the card is (nearly) on screen.
  useEffect(() => {
    const el = linkRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    getThumbnail(video.id, () => video.handle.getFile()).then((url) => {
      if (!cancelled) setThumbnail(url);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, video]);

  return (
    <Link
      ref={linkRef}
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
