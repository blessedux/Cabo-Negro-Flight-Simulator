import React, { useState, useRef, useEffect } from 'react';
import { getFreeExplorationMode } from './FreeExplorationMode';
import { getCargoShipPosition, setCargoShipPosition } from './CargoShip';
import { beamPosition } from './LocationBeam';

// Model position state (temporary - for positioning only)
const modelPositions = {
  // Wind Turbines (4 turbines)
  windTurbine1: { x: 0.045, y: 0, z: 0.402 },
  windTurbine2: { x: 0.165, y: 0, z: 0.462 },
  windTurbine3: { x: 0.205, y: 0, z: 0.402 },
  windTurbine4: { x: 0.245, y: 0, z: 0.502 },
  
  // Server Room (Data Center) - initialized from beamPosition calculation
  serverRoom: { x: 0, y: 0, z: 0 }, // Will be initialized on first access
  
  // Cargo Ship
  cargoShip: { x: 0, y: 0, z: 0 }, // Will be synced from CargoShip
};

// Initialize serverRoom position from beamPosition if not set
function initializeServerRoomPosition() {
  if (modelPositions.serverRoom.x === 0 && modelPositions.serverRoom.z === 0) {
    const baseX = beamPosition.x + -0.2;
    const baseZ = beamPosition.z + 0.1;
    const scaledDiameter = 1000 * 0.00125; // Approximate model diameter
    modelPositions.serverRoom = {
      x: baseX - (scaledDiameter * 5),
      y: 0,
      z: baseZ - (scaledDiameter * 3)
    };
  }
}

// Export functions to get/set positions
export function getModelPosition(modelName) {
  if (modelName === 'serverRoom') {
    initializeServerRoomPosition();
    return modelPositions.serverRoom;
  }
  if (modelName === 'cargoShip') {
    const pos = getCargoShipPosition();
    return { x: pos.x, y: pos.y, z: pos.z };
  }
  return modelPositions[modelName] || { x: 0, y: 0, z: 0 };
}

export function setModelPosition(modelName, axis, value) {
  if (modelName === 'cargoShip') {
    const currentPos = getCargoShipPosition();
    const newPos = { ...currentPos };
    newPos[axis] = value;
    setCargoShipPosition(newPos);
    return;
  }
  
  if (modelName === 'serverRoom') {
    initializeServerRoomPosition();
    modelPositions[modelName] = { ...modelPositions[modelName], [axis]: value };
  } else if (modelName.startsWith('windTurbine')) {
    modelPositions[modelName] = { ...modelPositions[modelName], [axis]: value };
  }
  
  // Trigger re-render by dispatching event
  window.dispatchEvent(new CustomEvent('modelPositionChanged', { 
    detail: { modelName, axis, value } 
  }));
}

export function ModelPositionEditor() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const isFreeMode = getFreeExplorationMode();
  
  // Only show in free exploration mode
  if (!isFreeMode) {
    return null;
  }
  
  const models = [
    { id: 'windTurbine1', name: 'Wind Turbine 1' },
    { id: 'windTurbine2', name: 'Wind Turbine 2' },
    { id: 'windTurbine3', name: 'Wind Turbine 3' },
    { id: 'windTurbine4', name: 'Wind Turbine 4' },
    { id: 'serverRoom', name: 'Server Room (Data Center)' },
    { id: 'cargoShip', name: 'Cargo Ship' },
  ];
  
  const handleMove = (modelName, axis, delta) => {
    const current = getModelPosition(modelName);
    const newValue = current[axis] + delta;
    setModelPosition(modelName, axis, newValue);
    console.log(`${modelName} ${axis}: ${newValue.toFixed(4)}`);
  };
  
  const getCurrentPosition = (modelName) => {
    return getModelPosition(modelName);
  };
  
  // Don't show the button - removed per user request
  if (!isVisible) {
    return null;
  }
  
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '20px',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        maxWidth: '400px',
        maxHeight: '80vh',
        overflowY: 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#ffffff', margin: 0, fontSize: '18px' }}>Model Position Editor</h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '4px 12px',
            fontSize: '12px',
          }}
        >
          ✕
        </button>
      </div>
      
      {models.map((model) => {
        const pos = getCurrentPosition(model.id);
        return (
          <div
            key={model.id}
            style={{
              marginBottom: '15px',
              padding: '15px',
              background: selectedModel === model.id ? 'rgba(100, 150, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: selectedModel === model.id ? '1px solid rgba(100, 150, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>
              {model.name}
            </div>
            
            {['x', 'y', 'z'].map((axis) => (
              <div key={axis} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#aaa', fontSize: '12px', width: '20px', textTransform: 'uppercase' }}>
                  {axis}:
                </span>
                <button
                  onClick={() => handleMove(model.id, axis, -0.01)}
                  style={{
                    background: 'rgba(255, 100, 100, 0.8)',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontSize: '12px',
                    margin: '0 5px',
                    minWidth: '30px',
                  }}
                >
                  ←
                </button>
                <span style={{ color: '#ffffff', fontSize: '12px', fontFamily: 'monospace', minWidth: '80px', textAlign: 'center' }}>
                  {pos[axis].toFixed(4)}
                </span>
                <button
                  onClick={() => handleMove(model.id, axis, 0.01)}
                  style={{
                    background: 'rgba(100, 255, 100, 0.8)',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontSize: '12px',
                    margin: '0 5px',
                    minWidth: '30px',
                  }}
                >
                  →
                </button>
                <button
                  onClick={() => handleMove(model.id, axis, -0.1)}
                  style={{
                    background: 'rgba(255, 100, 100, 0.6)',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    fontSize: '10px',
                    margin: '0 2px',
                  }}
                  title="Move -0.1"
                >
                  ⏪
                </button>
                <button
                  onClick={() => handleMove(model.id, axis, 0.1)}
                  style={{
                    background: 'rgba(100, 255, 100, 0.6)',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    fontSize: '10px',
                    margin: '0 2px',
                  }}
                  title="Move +0.1"
                >
                  ⏩
                </button>
              </div>
            ))}
          </div>
        );
      })}
      
      <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ color: '#aaa', fontSize: '11px', lineHeight: '1.4' }}>
          <div>← → : Move ±0.01</div>
          <div>⏪ ⏩ : Move ±0.1</div>
          <div style={{ marginTop: '10px', color: '#888' }}>
            Check console for position values
          </div>
        </div>
      </div>
    </div>
  );
}

