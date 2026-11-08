export interface VideoProgress {
  currentTime: number;
  duration: number;
  updatedAt: number;
}

export interface RecentEntry {
  videoId: string;
  playlistName: string | null;
  title: string;
  watchedAt: number;
}

const PROGRESS_PREFIX = "mytube:progress:";
const RECENT_KEY = "mytube:recent";
const MAX_RECENT = 50;

export function getProgress(videoId: string): VideoProgress | null {
  const raw = localStorage.getItem(PROGRESS_PREFIX + videoId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VideoProgress;
  } catch {
    return null;
  }
}

export function setProgress(videoId: string, currentTime: number, duration: number): void {
  const progress: VideoProgress = { currentTime, duration, updatedAt: Date.now() };
  localStorage.setItem(PROGRESS_PREFIX + videoId, JSON.stringify(progress));
}

export function getRecent(): RecentEntry[] {
  const raw = localStorage.getItem(RECENT_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RecentEntry[];
  } catch {
    return [];
  }
}

export function pushRecent(entry: RecentEntry): void {
  const existing = getRecent().filter((e) => e.videoId !== entry.videoId);
  const updated = [entry, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}
