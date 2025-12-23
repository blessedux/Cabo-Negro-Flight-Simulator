import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function TutorialOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Only show tutorial on /explore route
    if (location.pathname !== '/explore') {
      return;
    }
    
    // Check if user has seen tutorial before (specifically for explore scene)
    const seen = localStorage.getItem('hasSeenExploreTutorial');
    if (!seen) {
      // Show tutorial after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setHasSeenTutorial(true);
    }
  }, [location.pathname]);

  const handleClose = () => {
    setIsVisible(false);
    setHasSeenTutorial(true);
    localStorage.setItem('hasSeenExploreTutorial', 'true');
  };

  if (hasSeenTutorial || !isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'rgba(20, 20, 20, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '40px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          maxWidth: '600px',
          width: '90%',
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            color: '#ffffff',
            fontSize: '28px',
            fontWeight: '300',
            margin: '0 0 20px 0',
            fontFamily: 'system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Welcome
        </h2>
        
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '30px',
            fontFamily: 'system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          <p style={{ marginBottom: '15px' }}>
            <strong>Navigation:</strong> Use the arrow buttons or <kbd style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}>←</kbd> <kbd style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}>→</kbd> arrow keys to navigate between scenes.
          </p>
          <p style={{ marginBottom: '15px' }}>
            <strong>Free Exploration:</strong> Press <kbd style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}>SPACEBAR</kbd> to enter free exploration mode and move the camera freely.
          </p>
          <p style={{ marginBottom: '15px' }}>
            <strong>Interactive Tiles:</strong> In free exploration mode, look for blue glowing tiles you can click for more information.
          </p>
          <p>
            <strong>Menu:</strong> Press <kbd style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}>ESC</kbd> to open the menu.
          </p>
        </div>

        <button
          onClick={handleClose}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            fontFamily: 'system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
            transition: 'all 0.2s ease',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

