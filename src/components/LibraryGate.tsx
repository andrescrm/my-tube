import type { ReactNode } from "react";
import { useLibrary } from "../context/LibraryContext";

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center">{children}</div>;
}

const buttonClass = "rounded-full bg-red-600 px-6 py-2 font-medium text-white hover:bg-red-700 transition";

export function LibraryGate({ children }: { children: ReactNode }) {
  const { status, pickFolder, reconnect } = useLibrary();

  switch (status.kind) {
    case "checking":
      return (
        <Centered>
          <p className="text-neutral-400">Loading…</p>
        </Centered>
      );

    case "no-folder":
      return (
        <Centered>
          <h1 className="text-2xl font-semibold">Welcome to MyTube</h1>
          <p className="max-w-md text-neutral-400">
            Pick a folder on your computer. Every subfolder inside it becomes a playlist, and its
            videos show up here — nothing is uploaded anywhere.
          </p>
          <button onClick={() => pickFolder()} className={buttonClass}>
            Choose video folder
          </button>
        </Centered>
      );

    case "needs-permission":
      return (
        <Centered>
          <h1 className="text-2xl font-semibold">Reconnect to "{status.rootName}"</h1>
          <p className="max-w-md text-neutral-400">
            Your browser needs you to confirm access again after reloading the page.
          </p>
          <div className="flex gap-3">
            <button onClick={() => reconnect()} className={buttonClass}>
              Reconnect
            </button>
            <button
              onClick={() => pickFolder()}
              className="rounded-full border border-neutral-700 px-6 py-2 font-medium text-neutral-200 hover:bg-neutral-800"
            >
              Choose a different folder
            </button>
          </div>
        </Centered>
      );

    case "error":
      return (
        <Centered>
          <h1 className="text-2xl font-semibold text-red-400">Something went wrong</h1>
          <p className="max-w-md text-neutral-400">{status.message}</p>
          <button onClick={() => pickFolder()} className={buttonClass}>
            Choose video folder
          </button>
        </Centered>
      );

    case "ready":
      return <>{children}</>;
  }
}
