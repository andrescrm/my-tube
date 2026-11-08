import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LibraryProvider } from "./context/LibraryContext";
import { Layout } from "./components/Layout";
import { Home } from "./routes/Home";
import { PlaylistView } from "./routes/PlaylistView";
import { WatchView } from "./routes/WatchView";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <LibraryProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/playlist/:playlistId" element={<PlaylistView />} />
            <Route path="/watch/:videoId" element={<WatchView />} />
          </Route>
        </Routes>
      </LibraryProvider>
    </BrowserRouter>
  );
}

export default App;
