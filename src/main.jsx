import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FlightScene } from "./FlightScene";
import { ExploreScene } from "./ExploreScene";
import { MetaTags } from "./MetaTags";
import "./index.css";

function Root() {
  return (
    <BrowserRouter>
      <MetaTags />
      <Routes>
        <Route path="/" element={<Navigate to="/explore" replace />} />
        <Route path="/flight" element={<FlightScene />} />
        <Route path="/explore" element={<ExploreScene />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
