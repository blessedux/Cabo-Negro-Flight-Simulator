import React, { Suspense, useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import App, { SCENE_NAMES } from "./App.jsx";
import { Canvas } from "@react-three/fiber";
import { CompassOverlay } from "./CompassOverlay";
import { PauseMenu } from "./PauseMenu";
import { AltitudeSpeedUI } from "./AltitudeSpeedUI";
import { subscribeToMenuOpen, isMenuOpen } from "./controls";
import { setBeamHitCallback, setGroundHitCallback, setAltitudeZeroCallback, resetCollisionFlags } from "./CollisionDetector";
import { planePosition } from "./Airplane";
import "./index.css";

function Root() {
  const [currentScene, setCurrentScene] = useState(1);
  const [menuOpen, setMenuOpen] = useState(isMenuOpen);
  const totalScenes = 3;
  const sceneKey = useRef(0); // Key to force scene restart

  useEffect(() => {
    // Subscribe to menu state changes
    const unsubscribe = subscribeToMenuOpen((open) => {
      setMenuOpen(open);
    });
    return unsubscribe;
  }, []);

  // Set up collision callbacks
  useEffect(() => {
    // Beam hit -> go to scene 2
    setBeamHitCallback(() => {
      resetCollisionFlags();
      setCurrentScene(2);
    });

    // Ground hit or altitude zero -> restart scene 1
    const restartScene1 = () => {
      // Reset plane position to north border
      const terrainSize = 34.55;
      const northBorderZ = terrainSize / 2;
      planePosition.set(0, 3, northBorderZ);
      
      // Reset collision flags
      resetCollisionFlags();
      
      // Force scene restart by changing key
      sceneKey.current += 1;
      setCurrentScene(1);
    };

    setGroundHitCallback(restartScene1);
    setAltitudeZeroCallback(restartScene1);

    // Cleanup
    return () => {
      setBeamHitCallback(null);
      setGroundHitCallback(null);
      setAltitudeZeroCallback(null);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle scene navigation when menu is open
      if (menuOpen) return;
      
      const key = e.key.toLowerCase();
      
      if (key === 'o') {
        e.preventDefault();
        // Next scene (wrap around)
        setCurrentScene((prev) => (prev >= totalScenes ? 1 : prev + 1));
      } else if (key === 'i') {
        e.preventDefault();
        // Previous scene (wrap around)
        setCurrentScene((prev) => (prev <= 1 ? totalScenes : prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen, totalScenes]);

  const currentSceneName = SCENE_NAMES[currentScene] || 'Unknown';

  return (
    <>
      <div 
        style={{ 
          position: "fixed", 
          bottom: 20, 
          right: 20, 
          zIndex: 1000, 
          background: "rgba(0,0,0,0.7)", 
          padding: "12px 20px", 
          borderRadius: "8px", 
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "16px",
          fontWeight: "500",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
        }}
      >
        Scene {currentScene}: {currentSceneName}
      </div>
      {currentScene === 1 && <CompassOverlay />}
      {currentScene === 1 && <AltitudeSpeedUI />}
      {menuOpen && <PauseMenu />}
      <Canvas shadows>
        <Suspense fallback={null}>
          <App key={sceneKey.current} sceneNumber={currentScene} />
        </Suspense>
      </Canvas>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
