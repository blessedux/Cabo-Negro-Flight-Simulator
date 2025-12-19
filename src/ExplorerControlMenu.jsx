import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setOrbitSpeed } from './FreeCameraDragControls';
import { setHeightExaggeration, getHeightExaggeration } from './terrainHeightUtils';
import { AdvancedTerrainControls } from './AdvancedTerrainControls';

export function ExplorerControlMenu() {
  const navigate = useNavigate();
  
  const handleNextScene = () => {
    // Navigate to flight scene
    navigate('/flight');
  };
  const [orbitSpeed, setOrbitSpeedValue] = useState(0.3); // Default 30% speed (0.15 / 0.5)
  const [heightExaggeration, setHeightExaggerationValue] = useState(getHeightExaggeration()); // Default 1.0
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Update orbit speed when slider changes
    setOrbitSpeed(orbitSpeed);
  }, [orbitSpeed]);

  useEffect(() => {
    // Update height exaggeration when slider changes
    setHeightExaggeration(heightExaggeration);
  }, [heightExaggeration]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'flex-end',
      }}
    >
      {isExpanded && (
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '20px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            minWidth: '250px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Orbit Speed Control */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <label
              style={{
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Orbit Speed: {Math.round(orbitSpeed * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={orbitSpeed}
              onChange={(e) => setOrbitSpeedValue(parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.2)',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Height Exaggeration Control */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <label
              style={{
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Height Exaggeration: {heightExaggeration.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={heightExaggeration}
              onChange={(e) => setHeightExaggerationValue(parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.2)',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              <span>0.1x</span>
              <span>5.0x</span>
              <span>10x</span>
            </div>
          </div>

          {/* Advanced Terrain Controls */}
          <AdvancedTerrainControls />

          {/* Flight Scene Button */}
          <button
            onClick={handleNextScene}
            style={{
              padding: '12px 24px',
              background: 'rgba(100, 150, 255, 0.9)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(100, 150, 255, 1)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(100, 150, 255, 0.9)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Flight Scene →
          </button>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '50px',
          height: '50px',
          background: isExpanded ? 'rgba(100, 150, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          color: '#ffffff',
          cursor: 'pointer',
          fontSize: '20px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.background = 'rgba(100, 150, 255, 1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.background = isExpanded ? 'rgba(100, 150, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)';
        }}
      >
        {isExpanded ? '×' : '⚙'}
      </button>
    </div>
  );
}
