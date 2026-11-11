import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

export function SearchBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const onSearchPage = pathname === "/search";
  const query = onSearchPage ? (params.get("q") ?? "") : "";

  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className="mb-6 flex max-w-xl items-center rounded-full border border-neutral-700 bg-neutral-900 px-4 focus-within:border-neutral-500"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-neutral-400">
        <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14" />
      </svg>
      <input
        type="search"
        value={query}
        placeholder="Search videos"
        aria-label="Search videos"
        onChange={(e) => {
          const q = e.target.value;
          // Live search: replace the history entry while typing on the results page so
          // Back doesn't have to step through every keystroke.
          navigate(`/search?q=${encodeURIComponent(q)}`, { replace: onSearchPage });
        }}
        className="w-full bg-transparent px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
      />
    </form>
  );
}
