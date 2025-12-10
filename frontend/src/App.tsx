import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ui";
import HomePage from "./pages/HomePage";
import UserProfile from "./components/UserProfile";
import Aurora from "./components/Aurora";

export default function App() {
  return (
    <ErrorBoundary>
      <div style={{ position: "relative", width: "100%", minHeight: "100vh" }}>
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          <Aurora
            colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
            blend={0.5}
            amplitude={1.0}
            speed={0.5}
          />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/user/:userId" element={<UserProfile />} />
            </Routes>
          </BrowserRouter>
        </div>
      </div>
    </ErrorBoundary>
  );
}
