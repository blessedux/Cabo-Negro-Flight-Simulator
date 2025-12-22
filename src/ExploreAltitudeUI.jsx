import React, { useState, useEffect, useRef } from 'react';
import { getCameraData } from './FreeCameraDragControls';
import { sampleTerrainHeight } from './terrainHeightSampler';

// Global camera data for explore mode (updated by ExploreCameraDataUpdater)
let exploreCameraData = {
  position: { x: 0, y: 0, z: 0 }
};

export function setExploreCameraData(data) {
  exploreCameraData = data;
}

export function ExploreAltitudeUI() {
  const [altitude, setAltitude] = useState(0);
  const animationFrameRef = useRef();

  useEffect(() => {
    const updateUI = () => {
      // Try to get camera data from FreeCameraDragControls first
      let cameraPos = null;
      try {
        const data = getCameraData();
        cameraPos = data.position;
      } catch (e) {
        // Fallback to explore camera data
        cameraPos = exploreCameraData.position;
      }
      
      if (cameraPos && (cameraPos.x !== 0 || cameraPos.y !== 0 || cameraPos.z !== 0)) {
        // Sample terrain height at camera's position
        const terrainHeight = sampleTerrainHeight(cameraPos.x, cameraPos.z);
        const currentAltitude = Math.max(0, cameraPos.y - terrainHeight);
        setAltitude(currentAltitude);
      }
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
        maxWidth: '200px',
        boxSizing: 'border-box',
      }}
    >
      {/* Altitude Display */}
      <div style={{ 
        flex: '1 1 50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        minHeight: 0,
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
          height: '30px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '3px',
          marginLeft: '8px',
          flexShrink: 0,
          overflow: 'visible',
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

      {/* Click to explore hint */}
      <div style={{ 
        flex: '1 1 50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '10px',
        color: '#aaa',
        fontStyle: 'italic',
      }}>
        Click tiles to explore
      </div>
    </div>
  );
}
