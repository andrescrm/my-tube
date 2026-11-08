// In-memory cache for the current session — see CLAUDE.md's "Thumbnail cache" section
// for why persisting these across sessions (IndexedDB) is a deliberate follow-up, not v1.
const cache = new Map<string, Promise<string | null>>();

function captureFrame(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(video.src);
    };

    video.addEventListener("error", () => {
      cleanup();
      resolve(null);
    });

    video.addEventListener("loadedmetadata", () => {
      // Seeking to 0 on some very short/corrupt files never fires 'seeked'; guard with a timeout.
      video.currentTime = Math.min(Math.max(video.duration * 0.1, 0.1), video.duration || 0.1);
    });

    video.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 180;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      cleanup();
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    });

    window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, 8000);
  });
}

export function getThumbnail(videoId: string, file: File): Promise<string | null> {
  const existing = cache.get(videoId);
  if (existing) return existing;

  const promise = captureFrame(file);
  cache.set(videoId, promise);
  return promise;
}
