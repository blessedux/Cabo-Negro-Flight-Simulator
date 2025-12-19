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
        bottom: '20px',
        left: '20px',
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
      {/* Compass image - bigger */}
      <img
        src="/assets/comass_design.svg"
        alt="Compass"
        style={{
          width: '75px',
          height: '75px',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
        }}
      />
      
      {/* Direction letters */}
      <div style={{
        position: 'absolute',
        top: '2px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#ff0000',
        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
      }}>N</div>
      
      <div style={{
        position: 'absolute',
        bottom: '2px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
      }}>S</div>
      
      <div style={{
        position: 'absolute',
        left: '2px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
      }}>W</div>
      
      <div style={{
        position: 'absolute',
        right: '2px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
      }}>E</div>
    </div>
  );
}
