import React, { Suspense, useState } from "react";
import ReactDOM from "react-dom/client";
import App, { SCENE_NAMES } from "./App.jsx";
import { Canvas } from "@react-three/fiber";
import "./index.css";

function Root() {
  const [currentScene, setCurrentScene] = useState(1);

  return (
    <>
      <div style={{ position: "fixed", top: 10, left: 10, zIndex: 1000, background: "rgba(0,0,0,0.7)", padding: "10px", borderRadius: "5px", color: "white" }}>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ marginRight: "10px" }}>Scene:</label>
          <select 
            value={currentScene} 
            onChange={(e) => setCurrentScene(Number(e.target.value))}
            style={{ padding: "5px", background: "#333", color: "white", border: "1px solid #555", borderRadius: "3px" }}
          >
            <option value={1}>Scene 1: {SCENE_NAMES[1]}</option>
            <option value={2}>Scene 2: {SCENE_NAMES[2]}</option>
            <option value={3}>Scene 3: {SCENE_NAMES[3]}</option>
          </select>
        </div>
      </div>
      <Canvas shadows>
        <Suspense fallback={null}>
          <App sceneNumber={currentScene} />
        </Suspense>
      </Canvas>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
