import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FlightScene } from "./FlightScene";
import { ExploreScene } from "./ExploreScene";
import "./index.css";

function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/flight" replace />} />
        <Route path="/flight" element={<FlightScene />} />
        <Route path="/explore" element={<ExploreScene />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
