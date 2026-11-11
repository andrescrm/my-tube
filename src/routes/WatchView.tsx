import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLibrary } from "../context/LibraryContext";
import { getProgress, pushRecent, setProgress } from "../lib/watchStorage";
import { VideoCard } from "../components/VideoCard";

const PROGRESS_SAVE_INTERVAL_MS = 3000;

export function WatchView() {
  const { videoId = "" } = useParams<{ videoId: string }>();
  const { library, findVideoById } = useLibrary();
  const video = findVideoById(videoId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const lastSavedAt = useRef(0);

  useEffect(() => {
    if (!video) return;

    let objectUrl: string | null = null;
    let cancelled = false;
    setPlaybackError(false);
    setLoadError(null);
    setSrc(null);
    lastSavedAt.current = 0;

    video.handle
      .getFile()
      .then((file) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(file);
        setSrc(objectUrl);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof DOMException && err.name === "NotFoundError"
            ? "The file could not be found. It may have been moved, renamed or deleted."
            : "The file could not be opened. Folder access may have been lost — try reconnecting the folder.",
        );
      });

    pushRecent({
      videoId: video.id,
      playlistName: video.playlistName,
      title: video.name,
      watchedAt: Date.now(),
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [video]);

  // timeupdate fires several times per second; only hit localStorage every few seconds,
  // plus a forced save on pause/end so the exact position isn't lost.
  const saveProgress = (el: HTMLVideoElement, force = false) => {
    if (!video || !el.duration) return;
    const now = Date.now();
    if (!force && now - lastSavedAt.current < PROGRESS_SAVE_INTERVAL_MS) return;
    lastSavedAt.current = now;
    setProgress(video.id, el.currentTime, el.duration);
  };

  if (!video) {
    return <p className="text-neutral-500">Video not found. It may have moved or been removed from the folder.</p>;
  }

  const playlist = video.playlistName ? library?.playlists.find((p) => p.name === video.playlistName) : undefined;
  const upNext = (playlist?.videos ?? library?.uncategorized ?? []).filter((v) => v.id !== video.id);

  const savedProgress = getProgress(video.id);

  return (
    <div className="flex flex-col gap-6 lg:min-h-0 lg:flex-1 lg:flex-row">
      <div className="min-w-0 flex-1 lg:min-h-0 lg:overflow-y-auto">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          {src && !playbackError && (
            <video
              ref={videoRef}
              src={src}
              controls
              autoPlay
              className="h-full w-full"
              onLoadedMetadata={() => {
                if (savedProgress && savedProgress.currentTime < savedProgress.duration - 1 && videoRef.current) {
                  videoRef.current.currentTime = savedProgress.currentTime;
                }
              }}
              onTimeUpdate={(e) => saveProgress(e.currentTarget)}
              onPause={(e) => saveProgress(e.currentTarget, true)}
              onEnded={(e) => saveProgress(e.currentTarget, true)}
              onError={() => setPlaybackError(true)}
            />
          )}
          {loadError && (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-neutral-400">
              <p className="font-medium text-neutral-200">This video can't be opened</p>
              <p className="text-sm">{loadError}</p>
            </div>
          )}
          {playbackError && (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-neutral-400">
              <p className="font-medium text-neutral-200">This video can't be played</p>
              <p className="text-sm">
                Your browser doesn't support this file's format/codec ({video.name.split(".").pop()}). Try
                converting it to MP4 (H.264) or WebM.
              </p>
            </div>
          )}
        </div>

        <h1 className="mt-4 text-lg font-semibold">{video.name}</h1>
        {video.playlistName ? (
          <Link to={`/playlist/${video.playlistName}`} className="text-sm text-neutral-400 hover:underline">
            {video.playlistName}
          </Link>
        ) : (
          <span className="text-sm text-neutral-500">Uncategorized</span>
        )}
      </div>

      {upNext.length > 0 && (
        <aside className="flex w-full flex-col gap-4 lg:min-h-0 lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:pr-1">
          <h2 className="text-sm font-semibold text-neutral-300">Up next</h2>
          <div className="flex flex-col gap-4">
            {upNext.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
