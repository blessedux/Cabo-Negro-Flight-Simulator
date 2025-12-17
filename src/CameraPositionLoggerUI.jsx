import React, { useState, useEffect } from 'react';
import { getCameraData } from './FreeCameraDragControls';

export function CameraPositionLoggerUI() {
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState({ pitch: 0, yaw: 0, roll: 0 });

  useEffect(() => {
    const updateUI = () => {
      const data = getCameraData();
      setPosition(data.position);
      setRotation(data.rotation);
      requestAnimationFrame(updateUI);
    };

    const frameId = requestAnimationFrame(updateUI);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const copyToClipboard = () => {
    const text = `position: [${position.x}, ${position.y}, ${position.z}],\nrotation: { pitch: ${rotation.pitch}, yaw: ${rotation.yaw}, roll: ${rotation.roll} }`;
    navigator.clipboard.writeText(text);
    alert('Camera data copied to clipboard!');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        minWidth: '280px',
      }}
    >
      <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '14px' }}>
        Camera Position & Angle
      </div>
      <div style={{ marginBottom: '8px' }}>
        <div style={{ color: '#aaa', marginBottom: '4px' }}>Position:</div>
        <div>
          X: {position.x}, Y: {position.y}, Z: {position.z}
        </div>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#aaa', marginBottom: '4px' }}>Rotation:</div>
        <div>
          Pitch: {rotation.pitch}
        </div>
        <div>
          Yaw: {rotation.yaw}
        </div>
        <div>
          Roll: {rotation.roll}
        </div>
      </div>
      <button
        onClick={copyToClipboard}
        style={{
          width: '100%',
          padding: '8px',
          background: 'rgba(100, 150, 255, 0.8)',
          border: 'none',
          borderRadius: '5px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 'bold',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(100, 150, 255, 1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(100, 150, 255, 0.8)';
        }}
      >
        Copy to Clipboard
      </button>
    </div>
  );
}
