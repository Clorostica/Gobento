import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UserProfile from "./components/UserProfile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/user/:userId" element={<UserProfile />} />
      </Routes>
    </BrowserRouter>
  );
}
