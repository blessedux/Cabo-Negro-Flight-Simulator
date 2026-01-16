import React, { useState, useEffect } from 'react';
import { getCurrentSceneId, subscribeToSceneChange } from './CinematicCameraController';
import { getCurrentExploreScene, subscribeToExploreScene } from './SceneNavigator';
import { getScene } from './cinematicScenes';
import { useNavigate } from 'react-router-dom';
import { setFreeExplorationMode } from './FreeExplorationMode';
import { useIsMobile } from './utils/isMobile';

export function SceneTextOverlay() {
  const [currentSceneId, setCurrentSceneId] = useState(getCurrentSceneId() || getCurrentExploreScene());
  const [isVisible, setIsVisible] = useState(false);
  const [textData, setTextData] = useState(null);
  const navigate = useNavigate();
  const isMobileDevice = useIsMobile();

  // Handle free exploration button click
  const handleFreeExplore = (e) => {
    e.stopPropagation();
    setFreeExplorationMode(true);
  };

  // Handle pilot/flight button click
  const handlePilot = (e) => {
    e.stopPropagation();
    navigate('/flight');
  };

  useEffect(() => {
    const updateText = (sceneId) => {
      if (!sceneId) return;
      
      setCurrentSceneId(sceneId);
      
      // Fade out current text
      setIsVisible(false);
      
      // After fade out, update text and fade in
      setTimeout(() => {
        const scene = getScene(sceneId);
        if (scene && scene.text) {
          setTextData(scene.text);
          setIsVisible(true);
        }
      }, 800); // Wait for fade out (0.8s)
    };

    // Subscribe to cinematic scene changes
    const unsubscribeCinematic = subscribeToSceneChange(updateText);
    
    // Subscribe to explore scene changes (fallback)
    const unsubscribeExplore = subscribeToExploreScene((sceneId) => {
      // Only update if cinematic controller hasn't set a scene yet
      if (!getCurrentSceneId()) {
        updateText(sceneId);
      }
    });

    // Initialize with current scene
    const sceneId = getCurrentSceneId() || getCurrentExploreScene();
    if (sceneId) {
      const scene = getScene(sceneId);
      if (scene && scene.text) {
        setTextData(scene.text);
        setIsVisible(true);
      }
    }

    return () => {
      unsubscribeCinematic();
      unsubscribeExplore();
    };
  }, []);

  if (!textData) {
    return null;
  }

  // Hide title overlay for Scene 2 (show modal instead)
  if (currentSceneId === 2) {
    return null;
  }

  // Determine alignment based on scene
  // Scene 1: left aligned, Scene 2: right aligned, others: center
  const getAlignment = () => {
    if (currentSceneId === 1) {
      return {
        left: '5%',
        right: 'auto',
        transform: 'none',
        textAlign: 'left'
      };
    } else if (currentSceneId === 2) {
      return {
        left: 'auto',
        right: '5%',
        transform: 'none',
        textAlign: 'right'
      };
    } else {
      return {
        left: '50%',
        right: 'auto',
        transform: 'translateX(-50%)',
        textAlign: 'center'
      };
    }
  };

  const alignment = getAlignment();

  const isScene9 = currentSceneId === 9; // Synthesis scene (final scene with buttons)

  // Hide on mobile - only show slides (SceneNavigator)
  if (isMobileDevice) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '25%',
        ...alignment,
        zIndex: 2000,
        pointerEvents: 'auto', // Allow pointer events for buttons
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.8s ease-in-out',
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          padding: '20px 36px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <h1
          style={{
            color: '#ffffff',
            fontSize: '24px',
            fontWeight: '300',
            letterSpacing: '0.05em',
            margin: '0 0 6px 0',
            fontFamily: 'system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          {textData.title}
        </h1>
        <p
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '14px',
            fontWeight: '300',
            letterSpacing: '0.02em',
            margin: isScene9 ? '0 0 20px 0' : '0 0 16px 0',
            fontFamily: 'system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
            fontStyle: 'italic',
            pointerEvents: 'none',
          }}
        >
          {textData.subtitle}
        </p>
        
        {/* Explore Freely button - show on all slides, desktop only */}
        {!isMobileDevice && (
          <button
            onClick={handleFreeExplore}
            style={{
              padding: '12px 20px',
              background: 'rgba(100, 200, 100, 0.9)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              width: '100%',
              textShadow: '1px 1px 4px rgba(0, 0, 0, 0.3)',
              fontFamily: 'system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
              marginTop: '12px',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(100, 200, 100, 1)';
              e.target.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(100, 200, 100, 0.9)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Explore Freely
          </button>
        )}
        
        {/* Scene 9: Additional Pilot button */}
        {isScene9 && (
          <button
            onClick={handlePilot}
            style={{
              padding: '12px 20px',
              background: 'rgba(200, 150, 100, 0.9)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              width: '100%',
              textShadow: '1px 1px 4px rgba(0, 0, 0, 0.3)',
              fontFamily: 'system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
              marginTop: '12px',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(200, 150, 100, 1)';
              e.target.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(200, 150, 100, 0.9)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Pilot Above the Area
          </button>
        )}
      </div>
    </div>
  );
}
