import { createStore, get, set, type UseStore } from "idb-keyval";

// Thumbnails are generated client-side (seek to ~10% and draw the frame on a canvas),
// then persisted as JPEG blobs in IndexedDB so later sessions skip the video decoding.
// The video id already includes size + lastModified, so a changed file gets a new key.

const MAX_CONCURRENT_CAPTURES = 3;
const MAX_THUMBNAIL_WIDTH = 480;
const CAPTURE_TIMEOUT_MS = 8000;

// In-memory blob URLs for the current session (successes only — failures are not cached,
// so they get retried the next time a card asks for them).
const urlCache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

let store: UseStore | null = null;
function getStore(): UseStore | null {
  if (store) return store;
  try {
    store = createStore("mytube-thumbnails", "thumbnails");
  } catch {
    store = null;
  }
  return store;
}

async function readStored(videoId: string): Promise<Blob | null> {
  const s = getStore();
  if (!s) return null;
  try {
    return (await get<Blob>(videoId, s)) ?? null;
  } catch {
    return null;
  }
}

function writeStored(videoId: string, blob: Blob): void {
  const s = getStore();
  if (!s) return;
  set(videoId, blob, s).catch(() => {
    // Persistence is best-effort (quota, private mode...) — the session cache still works.
  });
}

// Tiny semaphore so scrolling through a big folder doesn't decode dozens of videos at once.
let active = 0;
const waiting: Array<() => void> = [];

async function runLimited<T>(task: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT_CAPTURES) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  active++;
  try {
    return await task();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

function captureFrame(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    let finished = false;

    const finish = (blob: Blob | null) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      // Detach the source so the decoder is released right away.
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(objectUrl);
      resolve(blob);
    };

    // Seeking never completes on some corrupt files; don't hang the queue forever.
    const timer = window.setTimeout(() => finish(null), CAPTURE_TIMEOUT_MS);

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    video.addEventListener("error", () => finish(null));

    video.addEventListener("loadedmetadata", () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      video.currentTime = duration > 0 ? Math.max(duration * 0.1, 0.1) : 0.1;
    });

    video.addEventListener("seeked", () => {
      const srcWidth = video.videoWidth || 320;
      const srcHeight = video.videoHeight || 180;
      const scale = Math.min(1, MAX_THUMBNAIL_WIDTH / srcWidth);

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(srcWidth * scale);
      canvas.height = Math.round(srcHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        finish(null);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => finish(blob), "image/jpeg", 0.75);
    });

    video.src = objectUrl;
  });
}

async function resolveThumbnail(videoId: string, loadFile: () => Promise<File>): Promise<string | null> {
  const stored = await readStored(videoId);
  if (stored) {
    const url = URL.createObjectURL(stored);
    urlCache.set(videoId, url);
    return url;
  }

  try {
    const blob = await runLimited(async () => captureFrame(await loadFile()));
    if (!blob) return null;

    writeStored(videoId, blob);
    const url = URL.createObjectURL(blob);
    urlCache.set(videoId, url);
    return url;
  } catch {
    // e.g. the file was moved/deleted or permission was lost: no thumbnail, retry next time.
    return null;
  }
}

// `loadFile` is lazy on purpose: when the thumbnail is already persisted we never need to
// touch the file on disk at all.
export function getThumbnail(videoId: string, loadFile: () => Promise<File>): Promise<string | null> {
  const cached = urlCache.get(videoId);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(videoId);
  if (pending) return pending;

  const promise = resolveThumbnail(videoId, loadFile).finally(() => inflight.delete(videoId));
  inflight.set(videoId, promise);
  return promise;
}
