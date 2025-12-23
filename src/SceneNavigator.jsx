import React, { useState, useEffect } from 'react';
import { startCinematicScene, stopCinematicScene } from './CinematicCameraController';
import { useIsMobile } from './utils/isMobile';
import { subscribeToTileModal } from './TileModal';

// Global state for explore scene navigation
let currentExploreScene = 1; // 1-7 cinematic scenes
let sceneCallbacks = [];
const TOTAL_SCENES = 7;

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
  3: 'Global Trade Routes',
  4: 'Maritime Terminal',
  5: 'Wind Energy',
  6: 'Data Center',
  7: 'Synthesis',
};

export function SceneNavigator() {
  const [currentScene, setCurrentScene] = useState(currentExploreScene);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobileDevice = useIsMobile();

  useEffect(() => {
    const unsubscribe = subscribeToExploreScene((scene) => {
      setCurrentScene(scene);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToTileModal((state) => {
      setIsModalOpen(state.isOpen);
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

  // Mobile: show beneath modal at bottom center, Desktop: show at bottom right
  const bottomStyle = isMobileDevice ? (isModalOpen ? '10px' : '20px') : '20px';
  const rightStyle = isMobileDevice ? 'auto' : '90px';
  const leftStyle = isMobileDevice ? '50%' : 'auto';
  const transformStyle = isMobileDevice ? 'translateX(-50%)' : 'none';
  const zIndexStyle = isMobileDevice ? 10001 : 1000; // Above modal on mobile

  return (
    <div
      style={{
        position: 'fixed',
        bottom: bottomStyle,
        right: rightStyle,
        left: leftStyle,
        transform: transformStyle,
        zIndex: zIndexStyle,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexDirection: isMobileDevice ? 'column' : 'row',
      }}
    >
      {/* Mobile: Show arrows first, then scene name */}
      {isMobileDevice && (
        <>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrevious}
              style={{
                width: '50px',
                height: '50px',
                background: 'rgba(0, 0, 0, 0.7)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '24px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                backdropFilter: 'blur(10px)',
              }}
            >
              ‹
            </button>
            <button
              onClick={handleNext}
              style={{
                width: '50px',
                height: '50px',
                background: 'rgba(0, 0, 0, 0.7)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '24px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                backdropFilter: 'blur(10px)',
              }}
            >
              ›
            </button>
          </div>
        </>
      )}

      {/* Scene name display */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '8px 16px',
          borderRadius: '8px',
          color: 'white',
          fontSize: isMobileDevice ? '12px' : '14px',
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
        <div style={{ fontSize: isMobileDevice ? '10px' : '11px', opacity: 0.7 }}>
          {currentScene} / {TOTAL_SCENES}
        </div>
      </div>

      {/* Desktop: Show arrows after scene name */}
      {!isMobileDevice && (
        <>
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
        </>
      )}
    </div>
  );
}
