# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Scaffolding is in progress (Vite + React + TypeScript). This file is the design spec agreed with
the user before implementation; update the Commands section below once real scripts exist.

## What this project is

"MyTube" — a local, offline video player that mimics YouTube's UI/UX, but instead of a remote
catalog it browses a video folder on the user's own disk. The user grants access to one root
folder once; every immediate subfolder of that root becomes a "playlist" in the sidebar, and the
videos inside each subfolder are that playlist's contents. There is no backend, no server, and no
account system — everything runs as a static single-page app opened directly in a Chromium
browser.

## Tech stack (decided)

- **Build tool / framework**: Vite + React, TypeScript, package manager **pnpm**. Not Next.js —
  there is no backend to justify SSR/file-based server routing, and Vite's dev server / build
  times are faster for a pure client-side SPA.
- **Filesystem access**: browser File System Access API (`window.showDirectoryPicker()`), not
  Electron/Tauri. This keeps the app a zero-install static SPA. Consequence: **the app only works
  in Chromium-based browsers (Chrome/Edge)** — Firefox and Safari do not implement this API. This
  is an accepted tradeoff, not a bug to "fix" by adding polyfills.
- **Styling**: Tailwind CSS, for a dark, dense, YouTube-like grid/sidebar layout.
- **Routing**: React Router, with real URL routes so back/forward/refresh behave correctly.
- **State management**: React Context + hooks. Do not introduce Redux/Zustand/etc. unless the
  Context approach demonstrably breaks down — the app's state (one directory tree, playback
  progress, recently-watched list) is small enough not to need it.
- **Thumbnails**: generated client-side, not pre-rendered. Load the video off-screen, seek to
  ~10% of its duration, draw that frame to a `<canvas>`, export as a blob URL, and cache it (see
  Architecture below) — no server-side/ffmpeg thumbnailing.
- **Persistence**: `localStorage` for playback progress and recently-watched metadata (see below
  for why the *directory handle itself* needs IndexedDB instead).
- **Linting**: Vite's default (Oxlint) was accepted as scaffolded — no strong preference for
  ESLint was expressed, so don't swap it without reason.

## Architecture

### Folder → playlist mapping

- The user picks one root directory via `showDirectoryPicker()`.
- Every immediate child directory of the root is a playlist (sidebar entry), named after the
  folder name.
- Video files sitting directly in the root (not inside any subfolder) belong to an implicit
  "Uncategorized" / Home collection, not a playlist.
- Subfolders are only scanned one level deep for playlist purposes — do not recurse into
  sub-subfolders and flatten them into a playlist; nested folders are a v2 concern (e.g. nested
  playlist groups), out of scope until asked for.

### Directory handle persistence — use IndexedDB, not localStorage

`FileSystemDirectoryHandle` objects are not strings and cannot go into `localStorage`. Persist the
handle itself in IndexedDB (via `idb-keyval`) so the app can re-offer "Continue with [folder name]"
on next launch instead of forcing a re-pick every time. Note that the underlying permission grant
does **not** survive a browser restart — on reload, call `handle.queryPermission()` and fall back
to `handle.requestPermission()` (which requires a user gesture, e.g. a "Reconnect" button) before
re-scanning.

### Video identity (no database, so no auto-increment IDs)

Since there is no backend, derive a stable-enough video ID from `relativePath + size + lastModified`
of the `File`, then encode it for use in the `/watch/:videoId` route. Do not rely on file name alone
— duplicate names across playlists are expected. This derived ID is also the cache key for
thumbnails and the `localStorage` key for playback progress.

### Playback progress & recently-watched (localStorage schema)

Keep this simple and namespaced, e.g.:
- `mytube:progress:<videoId>` → `{ currentTime, duration, updatedAt }`
- `mytube:recent` → ordered array of `{ videoId, playlistName, title, watchedAt }`, capped at some
  reasonable length (trim oldest on overflow, don't let it grow unbounded)

### Thumbnail cache

In-memory `Map<videoId, blobUrl>` for the session is the minimum bar. Since generation requires
decoding the video, consider whether persisting generated thumbnails (e.g. to IndexedDB as blobs)
is worth it to avoid re-decoding every session — this is a reasonable follow-up but not a blocker
for v1.

### Routes

- `/` — Home: recently watched + all videos in the implicit Uncategorized collection.
- `/playlist/:playlistId` — grid of videos inside one top-level folder.
- `/watch/:videoId` — player view for a single video.

### Codec/format constraints

Playback uses the native `<video>` element — only formats the browser can decode natively will
play (mp4/H.264, webm/VP8-VP9, ogg). Files like `.mkv` or `.avi` may enumerate fine as files but
fail to play; when browsing/scanning, don't silently hide unsupported extensions — surface a clear
per-file error state so the user knows why a given video won't play rather than treating it as a
generic failure.

## Commands

- `pnpm install` — install dependencies
- `pnpm dev` — start the Vite dev server
- `pnpm build` — type-check (`tsc -b`) and build for production
- `pnpm preview` — preview the production build locally
- `pnpm lint` — run Oxlint
