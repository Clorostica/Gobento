import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ui";
import HomePage from "./pages/HomePage";
import UserProfile from "./components/UserProfile";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/user/:userId" element={<UserProfile />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
