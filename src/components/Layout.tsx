import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { LibraryGate } from "./LibraryGate";
import { SearchBar } from "./SearchBar";

export function Layout() {
  // On the watch page the page itself doesn't scroll on large screens; the video column and the
  // "Up next" panel scroll independently instead.
  const isWatch = useLocation().pathname.startsWith("/watch");

  return (
    <div className="flex h-screen w-screen bg-neutral-950 text-neutral-100">
      <LibraryGate>
        <Sidebar />
        <main className={`flex min-w-0 flex-1 flex-col overflow-y-auto p-6 ${isWatch ? "lg:overflow-hidden" : ""}`}>
          <SearchBar />
          <Outlet />
        </main>
      </LibraryGate>
    </div>
  );
}
