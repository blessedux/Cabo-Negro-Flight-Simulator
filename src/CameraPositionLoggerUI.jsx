import React, { useState, useEffect } from 'react';
import { getCameraData, setCameraFov, getCameraFov } from './FreeCameraDragControls';

export function CameraPositionLoggerUI() {
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState({ pitch: 0, yaw: 0, roll: 0 });
  const [fov, setFov] = useState(getCameraFov());

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
    const text = `position: [${position.x.toFixed(4)}, ${position.y.toFixed(4)}, ${position.z.toFixed(4)}],\nrotation: { pitch: ${rotation.pitch.toFixed(4)}, yaw: ${rotation.yaw.toFixed(4)}, roll: ${rotation.roll.toFixed(4)} }`;
    navigator.clipboard.writeText(text);
    alert('Camera data copied to clipboard!');
  };

  const copyCinematicFormat = () => {
    // Format for cinematic scenes config
    const text = `position: [${position.x.toFixed(4)}, ${position.y.toFixed(4)}, ${position.z.toFixed(4)}],\nrotation: { pitch: ${rotation.pitch.toFixed(4)}, yaw: ${rotation.yaw.toFixed(4)}, roll: ${rotation.roll.toFixed(4)} },\nfov: ${fov.toFixed(1)}`;
    navigator.clipboard.writeText(text);
    alert('Camera data (cinematic format) copied to clipboard!');
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
          X: {position.x.toFixed(4)}, Y: {position.y.toFixed(4)}, Z: {position.z.toFixed(4)}
        </div>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#aaa', marginBottom: '4px' }}>Rotation:</div>
        <div>
          Pitch: {rotation.pitch.toFixed(4)}
        </div>
        <div>
          Yaw: {rotation.yaw.toFixed(4)}
        </div>
        <div>
          Roll: {rotation.roll.toFixed(4)}
        </div>
      </div>
      
      {/* Camera Scale (FOV) Slider */}
      <div style={{ marginBottom: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '11px' }}>
          Camera Scale (FOV): {fov.toFixed(1)}°
        </div>
        <input
          type="range"
          min="10"
          max="80"
          value={fov}
          step="1"
          onChange={(e) => {
            const newFov = parseFloat(e.target.value);
            setFov(newFov);
            setCameraFov(newFov);
          }}
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: 'rgba(255, 255, 255, 0.1)',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', marginTop: '4px' }}>
          <span>Zoomed In (Bigger)</span>
          <span>Zoomed Out (Wider)</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
          Copy Position & Rotation
        </button>
        <button
          onClick={copyCinematicFormat}
          style={{
            width: '100%',
            padding: '8px',
            background: 'rgba(150, 100, 255, 0.8)',
            border: 'none',
            borderRadius: '5px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(150, 100, 255, 1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(150, 100, 255, 0.8)';
          }}
        >
          Copy Full Config (with FOV)
        </button>
      </div>
    </div>
  );
}
