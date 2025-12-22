import React, { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PauseMenu } from "./PauseMenu";
import { Navbar } from "./Navbar";
import { ExplorerControlMenu } from "./ExplorerControlMenu";
import { SceneNavigator, getCurrentExploreScene, subscribeToExploreScene, setCurrentExploreScene } from "./SceneNavigator";
import { SceneTextOverlay } from "./SceneTextOverlay";
import { TileModal, setTileModalOpen } from "./TileModal";
import { subscribeToMenuOpen, isMenuOpen } from "./controls";
import { startCinematicScene, stopCinematicScene } from "./CinematicCameraController";
import { ExploreEnvironment } from "./ExploreEnvironment";
import { CompassOverlay } from "./CompassOverlay";
import { ExploreAltitudeUI } from "./ExploreAltitudeUI";
import { TutorialOverlay } from "./TutorialOverlay";
import { 
  getFreeExplorationMode, 
  subscribeToFreeExplorationMode, 
  toggleFreeExplorationMode,
  setFreeExplorationMode 
} from "./FreeExplorationMode";
import * as THREE from "three";

export function ExploreScene() {
  const [menuOpen, setMenuOpen] = useState(isMenuOpen);
  const [isFreeMode, setIsFreeMode] = useState(getFreeExplorationMode());

  useEffect(() => {
    // Subscribe to menu state changes
    const unsubscribeMenu = subscribeToMenuOpen((open) => {
      setMenuOpen(open);
    });
    
    // Subscribe to free exploration mode changes
    const unsubscribeFreeMode = subscribeToFreeExplorationMode((enabled) => {
      setIsFreeMode(enabled);
      if (enabled) {
        // Stop cinematic mode when entering free exploration
        stopCinematicScene();
      } else {
        // Resume cinematic mode when exiting free exploration
        const currentScene = getCurrentExploreScene();
        startCinematicScene(currentScene);
      }
    });
    
    // Subscribe to explore scene changes - trigger cinematic camera movement
    const unsubscribeScene = subscribeToExploreScene((scene) => {
      // Only start cinematic scene if not in free mode
      if (!getFreeExplorationMode()) {
        startCinematicScene(scene);
      }
      
      // Close any open modals when scene changes (buttons are now in SceneTextOverlay for Scene 8)
      setTileModalOpen(false);
    });
    
    // Initialize first scene on mount (if not in free mode)
    if (!getFreeExplorationMode()) {
      const initialScene = getCurrentExploreScene();
      startCinematicScene(initialScene);
    }
    
    // Keyboard handlers
    const handleKeyDown = (e) => {
      // Don't handle keys if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Spacebar: Toggle free exploration mode
      if (e.code === 'Space') {
        e.preventDefault();
        toggleFreeExplorationMode();
      }
      
      // Arrow keys: Navigate scenes (only in cinematic mode, not free exploration)
      if (!getFreeExplorationMode()) {
        if (e.code === 'ArrowLeft') {
          e.preventDefault();
          const currentScene = getCurrentExploreScene();
          const newScene = currentScene <= 1 ? 8 : currentScene - 1;
          setCurrentExploreScene(newScene);
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          const currentScene = getCurrentExploreScene();
          const newScene = currentScene >= 8 ? 1 : currentScene + 1;
          setCurrentExploreScene(newScene);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      unsubscribeMenu();
      unsubscribeFreeMode();
      unsubscribeScene();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <>
      <TutorialOverlay />
      <Navbar />
      <ExplorerControlMenu />
      
      {/* Scene Navigator - fade out in free mode */}
      <div
        style={{
          opacity: isFreeMode ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out',
          pointerEvents: isFreeMode ? 'none' : 'auto',
        }}
      >
      <SceneNavigator />
      </div>
      
      {/* Scene Text Overlay - fade out in free mode */}
      <div
        style={{
          opacity: isFreeMode ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out',
          pointerEvents: 'none',
        }}
      >
        <SceneTextOverlay />
      </div>
      
      {/* Compass and Altitude UI - show in free mode */}
      {isFreeMode && (
        <>
          <CompassOverlay />
          <ExploreAltitudeUI />
        </>
      )}
      
      <TileModal />
      {menuOpen && <PauseMenu />}
      <Canvas 
        shadows
        gl={{
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
      >
        <Suspense fallback={null}>
          {/* Single unified environment - camera angles change, not the scene */}
          <ExploreEnvironment />
        </Suspense>
      </Canvas>
    </>
  );
}
