import React, { useState } from 'react';
import { setMenuOpen, setPaused } from './controls';

// Global state for toggles (can be moved to a context/store later)
let fogEnabled = true;
let musicEnabled = true;

export function setFogEnabled(enabled) {
  fogEnabled = enabled;
  // Dispatch event for scene components to listen to
  window.dispatchEvent(new CustomEvent('fogToggle', { detail: { enabled } }));
}

export function setMusicEnabled(enabled) {
  musicEnabled = enabled;
  // Dispatch event for audio components to listen to
  window.dispatchEvent(new CustomEvent('musicToggle', { detail: { enabled } }));
}

export function getFogEnabled() {
  return fogEnabled;
}

export function getMusicEnabled() {
  return musicEnabled;
}

export function PauseMenu() {
  const [fogOn, setFogOn] = useState(fogEnabled);
  const [musicOn, setMusicOn] = useState(musicEnabled);

  const handleClose = () => {
    setMenuOpen(false);
    setPaused(false);
  };

  const handleFogToggle = () => {
    const newValue = !fogOn;
    setFogOn(newValue);
    setFogEnabled(newValue);
  };

  const handleMusicToggle = () => {
    const newValue = !musicOn;
    setMusicOn(newValue);
    setMusicEnabled(newValue);
  };

  const handleBackToLanding = () => {
    // Navigate back to landing page
    window.location.href = '/';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        justifyContent: 'center', // Center horizontally
        alignItems: 'center', // Center vertically
        zIndex: 10000,
        backdropFilter: 'blur(3px)',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(20, 20, 30, 0.95)',
          padding: '30px',
          borderRadius: '12px',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h2
          style={{
            color: '#fff',
            marginTop: 0,
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
          }}
        >
          Controls
        </h2>

        {/* Keyboard Visualization */}
        <div
          style={{
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* WASD Keys - Fixed layout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>
              Movement
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
              {/* W on top center */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <KeyBox label="W" />
              </div>
              {/* A, S, D in bottom row */}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                <KeyBox label="A" />
                <KeyBox label="S" />
                <KeyBox label="D" />
              </div>
            </div>
          </div>

          {/* Q and E for height (explore mode) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>
              Height (Explore Mode)
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <KeyBox label="Q" />
              <KeyBox label="E" />
            </div>
          </div>

          {/* Other controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            <ControlRow label="Rotate Camera" keyLabel="Mouse Drag" />
            <ControlRow label="Restart" keyLabel="R" />
            <ControlRow label="Pause" keyLabel="Spacebar" />
          </div>
        </div>

        {/* Toggle Buttons */}
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ToggleButton
            label="Fog"
            enabled={fogOn}
            onChange={handleFogToggle}
          />
          <ToggleButton
            label="Music"
            enabled={musicOn}
            onChange={handleMusicToggle}
          />
        </div>

        {/* Back to Landing Page Button */}
        <button
          onClick={handleBackToLanding}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: 'rgba(150, 150, 150, 0.6)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '12px',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(150, 150, 150, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(150, 150, 150, 0.6)';
          }}
        >
          Back to Landing Page
        </button>

        {/* Resume Button */}
        <button
          onClick={handleClose}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'rgba(100, 150, 255, 0.8)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(100, 150, 255, 1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(100, 150, 255, 0.8)';
          }}
        >
          Resume (ESC)
        </button>
      </div>
    </div>
  );
}

function KeyBox({ label }) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '6px',
        padding: '8px 12px',
        color: '#fff',
        fontSize: '13px',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        minWidth: '40px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      }}
    >
      {label}
    </div>
  );
}

function ControlRow({ label, keyLabel }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
      }}
    >
      <span style={{ color: '#aaa', fontSize: '13px' }}>{label}</span>
      <KeyBox label={keyLabel} />
    </div>
  );
}

function ToggleButton({ label, enabled, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
      }}
    >
      <span style={{ color: '#aaa', fontSize: '13px' }}>{label}</span>
      <button
        onClick={onChange}
        style={{
          width: '50px',
          height: '26px',
          borderRadius: '13px',
          border: 'none',
          backgroundColor: enabled ? 'rgba(100, 150, 255, 0.8)' : 'rgba(100, 100, 100, 0.5)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s',
          padding: '2px',
        }}
      >
        <div
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            transform: enabled ? 'translateX(24px)' : 'translateX(0)',
            transition: 'transform 0.2s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        />
      </button>
    </div>
  );
}
