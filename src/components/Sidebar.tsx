import { NavLink } from "react-router-dom";
import { useLibrary } from "../context/LibraryContext";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M10 4H2v16h20V6H12z" />
    </svg>
  );
}

export function Sidebar() {
  const { library, pickFolder } = useLibrary();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
      isActive ? "bg-neutral-800 text-white" : "text-neutral-300 hover:bg-neutral-800/60"
    }`;

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-neutral-800 p-3">
      <NavLink to="/" end className={linkClass}>
        <PlayIcon />
        Home
      </NavLink>

      {library && library.playlists.length > 0 && (
        <>
          <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Playlists
          </div>
          {library.playlists.map((playlist) => (
            <NavLink key={playlist.id} to={`/playlist/${playlist.id}`} className={linkClass}>
              <FolderIcon />
              <span className="truncate">{playlist.name}</span>
              <span className="ml-auto text-xs text-neutral-500">{playlist.videos.length}</span>
            </NavLink>
          ))}
        </>
      )}

      <div className="mt-auto pt-4">
        <button
          onClick={() => pickFolder()}
          className="w-full rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
        >
          Change folder
        </button>
      </div>
    </aside>
  );
}
