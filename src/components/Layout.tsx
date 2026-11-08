import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { LibraryGate } from "./LibraryGate";

export function Layout() {
  return (
    <div className="flex h-screen w-screen bg-neutral-950 text-neutral-100">
      <LibraryGate>
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </LibraryGate>
    </div>
  );
}
