import React, { useEffect, useRef } from 'react';
import { setCompassOverlayRef } from './Compass';

export function CompassOverlay() {
  const compassRef = useRef();

  useEffect(() => {
    // Register this ref with the Compass component
    if (compassRef.current) {
      setCompassOverlayRef(compassRef.current);
    }
    
    return () => {
      setCompassOverlayRef(null);
    };
  }, []);

  return (
    <div
      ref={compassRef}
      style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        width: '80px',
        height: '80px',
        zIndex: 1001,
        pointerEvents: 'none',
        transition: 'transform 0.1s ease-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '50%',
      }}
    >
      <img
        src="/assets/comass_design.svg"
        alt="Compass"
        style={{
          width: '70px',
          height: '70px',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
        }}
      />
    </div>
  );
}
