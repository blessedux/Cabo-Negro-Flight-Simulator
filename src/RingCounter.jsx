import React, { useState, useEffect } from 'react';

// Global counter state
let ringCount = 0;
let onRingHitCallback = null;

export function setRingHitCallback(callback) {
  onRingHitCallback = callback;
}

export function incrementRingCount() {
  ringCount++;
  if (onRingHitCallback) {
    onRingHitCallback(ringCount);
  }
}

export function resetRingCount() {
  ringCount = 0;
  if (onRingHitCallback) {
    onRingHitCallback(ringCount);
  }
}

export function RingCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Set initial count
    setCount(ringCount);
    
    // Set callback to update state when count changes
    setRingHitCallback((newCount) => {
      setCount(newCount);
    });
    
    return () => {
      setRingHitCallback(null);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '10px 16px',
        borderRadius: '10px',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '14px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '80px',
      }}
    >
      <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase' }}>
        Rings
      </div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', lineHeight: '1' }}>
        {count}
      </div>
    </div>
  );
}
