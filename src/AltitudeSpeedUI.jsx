import React, { useState, useEffect, useRef } from 'react';
import { planePosition } from './Airplane';
import { sampleTerrainHeight } from './terrainHeightSampler';

// Listen for speed updates from controls
if (typeof window !== 'undefined') {
  window.updateSpeedTracking = updateSpeedTracking;
}

// Export functions to get altitude and speed
export let getCurrentAltitude = () => 0;
export let getCurrentSpeed = () => 0;
export let getAverageSpeed = () => 0;

// Speed tracking
let currentSpeed = 0;
let speedHistory = [];
let averageSpeed = 0;
let maxSpeedHistoryLength = 60; // Track last 60 frames (~1 second at 60fps)

// Update speed tracking
export function updateSpeedTracking(speed) {
  currentSpeed = speed;
  speedHistory.push(speed);
  if (speedHistory.length > maxSpeedHistoryLength) {
    speedHistory.shift();
  }
  if (speedHistory.length > 0) {
    averageSpeed = speedHistory.reduce((a, b) => a + b, 0) / speedHistory.length;
  }
}

export function AltitudeSpeedUI() {
  const [altitude, setAltitude] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [avgSpeed, setAvgSpeed] = useState(0);

  // Update getter functions
  useEffect(() => {
    getCurrentAltitude = () => altitude;
    getCurrentSpeed = () => speed;
    getAverageSpeed = () => avgSpeed;
  }, [altitude, speed, avgSpeed]);

  const animationFrameRef = useRef();

  useEffect(() => {
    const updateUI = () => {
      // Sample terrain height at plane's position for accurate altitude
      const terrainHeight = sampleTerrainHeight(planePosition.x, planePosition.z);
      const currentAltitude = Math.max(0, planePosition.y - terrainHeight);
      setAltitude(currentAltitude);
      
      // Update speed displays
      setSpeed(currentSpeed);
      setAvgSpeed(averageSpeed);
      
      animationFrameRef.current = requestAnimationFrame(updateUI);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateUI);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Convert scene units to meters (sceneScale = 0.01, so 1 unit = 100m)
  const altitudeMeters = altitude * 100;
  
  // Convert speed to km/h (scene units per frame to km/h)
  // Assuming 60fps: speed in units/frame * 60 frames/sec * 3600 sec/hour * 0.1 km/unit = km/h
  const speedKmh = speed * 60 * 3600 * 0.1;
  const avgSpeedKmh = avgSpeed * 60 * 3600 * 0.1;

  // Altitude ruler marks (every 0.5 units = 50 meters)
  const rulerMarks = [];
  const maxRulerHeight = 10; // Show up to 10 units (1000m)
  for (let i = 0; i <= maxRulerHeight * 2; i += 1) {
    const markHeight = i * 0.5;
    rulerMarks.push(markHeight);
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: 110, // Position to the right of the compass (20px + 80px + 10px gap)
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '10px 14px',
        borderRadius: '10px',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
        height: '80px', // Same height as compass
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minWidth: '200px',
        maxWidth: '200px', // Fixed width to prevent breaking
        boxSizing: 'border-box',
      }}
    >
      {/* Altitude Display */}
      <div style={{ 
        flex: '1 1 50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        minHeight: 0, // Prevent overflow
        overflow: 'hidden',
      }}>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <div style={{ fontSize: '9px', color: '#aaa', marginBottom: '2px' }}>ALTITUDE</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00ffff', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
            {altitudeMeters.toFixed(0)}<span style={{ fontSize: '10px', color: '#aaa' }}>m</span>
          </div>
        </div>
        
        {/* Ruler - compact version */}
        <div style={{ 
          position: 'relative',
          width: '20px',
          height: '30px', // Smaller to fit better
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '3px',
          marginLeft: '8px',
          flexShrink: 0,
          overflow: 'visible', // Allow marks to show at top
        }}>
          {rulerMarks.filter((_, i) => i % 4 === 0).map((mark, i) => {
            const markPosition = (mark / maxRulerHeight) * 30;
            const isActive = altitude >= mark && altitude < mark + 1;
            
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  bottom: `${markPosition}px`,
                  left: 0,
                  width: '20px',
                  height: '1px',
                  background: isActive ? '#00ffff' : 'rgba(255, 255, 255, 0.5)',
                  transition: 'all 0.1s',
                }}
              />
            );
          })}
          
          {/* Current altitude indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: `${Math.min((altitude / maxRulerHeight) * 30, 30)}px`,
              left: '-3px',
              width: '26px',
              height: '2px',
              background: '#00ffff',
              boxShadow: '0 0 8px #00ffff',
            }}
          />
        </div>
      </div>

      {/* Speed Display */}
      <div style={{ 
        flex: '1 1 50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        minHeight: 0, // Prevent overflow
        overflow: 'hidden',
      }}>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <div style={{ fontSize: '9px', color: '#aaa', marginBottom: '2px' }}>SPEED</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffff00', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
            {speedKmh.toFixed(0)}<span style={{ fontSize: '10px', color: '#aaa' }}> km/h</span>
          </div>
        </div>
        <div style={{ fontSize: '9px', color: '#888', marginLeft: '8px', flexShrink: 0, whiteSpace: 'nowrap' }}>
          Avg: {avgSpeedKmh.toFixed(0)}
        </div>
      </div>
    </div>
  );
}
