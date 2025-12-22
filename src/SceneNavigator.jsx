import React, { useState, useEffect } from 'react';

import { startCinematicScene, stopCinematicScene } from './CinematicCameraController';

// Global state for explore scene navigation
let currentExploreScene = 1; // 1-8 cinematic scenes
let sceneCallbacks = [];
const TOTAL_SCENES = 8;

export function getCurrentExploreScene() {
  return currentExploreScene;
}

export function setCurrentExploreScene(scene) {
  // Clamp scene to valid range
  const clampedScene = Math.max(1, Math.min(TOTAL_SCENES, scene));
  currentExploreScene = clampedScene;
  
  // Start new cinematic scene (camera reference is handled internally)
  startCinematicScene(clampedScene);
  
  // Notify callbacks
  sceneCallbacks.forEach(cb => cb(clampedScene));
}

export function subscribeToExploreScene(callback) {
  sceneCallbacks.push(callback);
  return () => {
    sceneCallbacks = sceneCallbacks.filter(cb => cb !== callback);
  };
}

const SCENE_NAMES = {
  1: 'Cabo Negro Terrain',
  2: 'Punta Arenas',
  3: 'Satellite View',
  4: 'Global Trade Routes',
  5: 'Maritime Terminal',
  6: 'Wind Energy',
  7: 'Data Center',
  8: 'Synthesis',
};

export function SceneNavigator() {
  const [currentScene, setCurrentScene] = useState(currentExploreScene);

  useEffect(() => {
    const unsubscribe = subscribeToExploreScene((scene) => {
      setCurrentScene(scene);
    });
    return unsubscribe;
  }, []);

  const handlePrevious = () => {
    const newScene = currentScene <= 1 ? TOTAL_SCENES : currentScene - 1;
    setCurrentExploreScene(newScene);
  };

  const handleNext = () => {
    const newScene = currentScene >= TOTAL_SCENES ? 1 : currentScene + 1;
    setCurrentExploreScene(newScene);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '90px', // To the left of the settings button (which is at 20px, button is ~50px wide)
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      {/* Scene name display */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '8px 16px',
          borderRadius: '8px',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <div>{SCENE_NAMES[currentScene]}</div>
        <div style={{ fontSize: '11px', opacity: 0.7 }}>
          {currentScene} / {TOTAL_SCENES}
        </div>
      </div>

      {/* Previous button */}
      <button
        onClick={handlePrevious}
        style={{
          width: '40px',
          height: '40px',
          background: 'rgba(0, 0, 0, 0.7)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          color: '#ffffff',
          cursor: 'pointer',
          fontSize: '18px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          backdropFilter: 'blur(10px)',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(0, 0, 0, 0.7)';
          e.target.style.transform = 'scale(1)';
        }}
      >
        ‹
      </button>

      {/* Next button */}
      <button
        onClick={handleNext}
        style={{
          width: '40px',
          height: '40px',
          background: 'rgba(0, 0, 0, 0.7)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          color: '#ffffff',
          cursor: 'pointer',
          fontSize: '18px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          backdropFilter: 'blur(10px)',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(0, 0, 0, 0.7)';
          e.target.style.transform = 'scale(1)';
        }}
      >
        ›
      </button>
    </div>
  );
}
