import React, { useState, useEffect } from 'react';

// Global state for explore scene navigation
let currentExploreScene = 1; // 1 = Default Orbit, 2 = Punta Arenas, 3 = Satellite
let sceneCallbacks = [];

export function getCurrentExploreScene() {
  return currentExploreScene;
}

export function setCurrentExploreScene(scene) {
  currentExploreScene = scene;
  sceneCallbacks.forEach(cb => cb(scene));
}

export function subscribeToExploreScene(callback) {
  sceneCallbacks.push(callback);
  return () => {
    sceneCallbacks = sceneCallbacks.filter(cb => cb !== callback);
  };
}

const SCENE_NAMES = {
  1: 'Default Orbit',
  2: 'Punta Arenas',
  3: 'Satellite',
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
    const newScene = currentScene <= 1 ? 3 : currentScene - 1;
    setCurrentExploreScene(newScene);
  };

  const handleNext = () => {
    const newScene = currentScene >= 3 ? 1 : currentScene + 1;
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
        }}
      >
        {SCENE_NAMES[currentScene]}
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
