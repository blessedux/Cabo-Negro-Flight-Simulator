import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTileDebugEnabled, setTileDebugEnabled } from './TileDebugToggle';

export function ExplorerControlMenu() {
  const navigate = useNavigate();
  
  const handleNextScene = () => {
    // Navigate to flight scene
    navigate('/flight');
  };
  
  const [tileDebugEnabled, setTileDebugEnabledValue] = useState(getTileDebugEnabled());
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync with global state
  useEffect(() => {
    const handleToggle = (event) => {
      setTileDebugEnabledValue(event.detail.enabled);
    };
    window.addEventListener('tileDebugToggle', handleToggle);
    // Check initial state
    setTileDebugEnabledValue(getTileDebugEnabled());
    return () => window.removeEventListener('tileDebugToggle', handleToggle);
  }, []);

  const handleTileDebugToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = !tileDebugEnabled;
    console.log('🔄 ExplorerControlMenu: Toggling wireframe:', { 
      currentValue: tileDebugEnabled, 
      newValue,
      buttonClicked: true 
    });
    setTileDebugEnabledValue(newValue);
    setTileDebugEnabled(newValue);
    console.log('✅ ExplorerControlMenu: setTileDebugEnabled called with:', newValue);
  };

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
          {/* Wireframe Toggle */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
            }}
          >
            <span style={{ color: '#ffffff', fontSize: '14px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Wireframe + Tags
            </span>
            <button
              type="button"
              onClick={handleTileDebugToggle}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: '50px',
                height: '26px',
                borderRadius: '13px',
                border: 'none',
                backgroundColor: tileDebugEnabled ? 'rgba(100, 150, 255, 0.8)' : 'rgba(100, 100, 100, 0.5)',
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
                  transform: tileDebugEnabled ? 'translateX(24px)' : 'translateX(0)',
                  transition: 'transform 0.2s',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                }}
              />
            </button>
          </div>

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
