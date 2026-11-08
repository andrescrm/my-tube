import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLibrary } from "../context/LibraryContext";
import { getProgress, pushRecent, setProgress } from "../lib/watchStorage";
import { VideoCard } from "../components/VideoCard";

export function WatchView() {
  const { videoId = "" } = useParams<{ videoId: string }>();
  const { library, findVideoById } = useLibrary();
  const video = findVideoById(videoId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    if (!video) return;

    let objectUrl: string | null = null;
    setPlaybackError(false);
    setSrc(null);

    video.handle.getFile().then((file) => {
      objectUrl = URL.createObjectURL(file);
      setSrc(objectUrl);
    });

    pushRecent({
      videoId: video.id,
      playlistName: video.playlistName,
      title: video.name,
      watchedAt: Date.now(),
    });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [video]);

  if (!video) {
    return <p className="text-neutral-500">Video not found. It may have moved or been removed from the folder.</p>;
  }

  const playlist = video.playlistName ? library?.playlists.find((p) => p.name === video.playlistName) : undefined;
  const upNext = (playlist?.videos ?? library?.uncategorized ?? []).filter((v) => v.id !== video.id);

  const savedProgress = getProgress(video.id);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1">
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
              onTimeUpdate={(e) => {
                const el = e.currentTarget;
                if (el.duration) setProgress(video.id, el.currentTime, el.duration);
              }}
              onError={() => setPlaybackError(true)}
            />
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
        <aside className="flex w-full flex-col gap-4 lg:w-80">
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
