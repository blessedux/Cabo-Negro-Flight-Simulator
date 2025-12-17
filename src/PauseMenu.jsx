import React from 'react';
import { setMenuOpen, setPaused } from './controls';

const controlsList = [
  { key: 'W / S', description: 'Pitch up / Pitch down' },
  { key: 'A / D', description: 'Yaw left / Yaw right' },
  { key: 'Shift', description: 'Turbo boost' },
  { key: 'R', description: 'Reset position' },
  { key: 'Space', description: 'Pause (camera still movable)' },
  { key: 'Escape', description: 'Open/Close menu' },
  { key: 'Mouse Drag', description: 'Rotate camera around plane' },
  { key: 'N / B', description: 'Next scene / Previous scene' },
];

export function PauseMenu() {
  const handleClose = () => {
    setMenuOpen(false);
    setPaused(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(5px)',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(20, 20, 30, 0.95)',
          padding: '40px',
          borderRadius: '15px',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h2
          style={{
            color: '#fff',
            marginTop: 0,
            marginBottom: '30px',
            textAlign: 'center',
            fontSize: '28px',
            fontWeight: 'bold',
            textShadow: '0 2px 10px rgba(255, 255, 255, 0.2)',
          }}
        >
          Controls
        </h2>

        <div
          style={{
            marginBottom: '30px',
          }}
        >
          {controlsList.map((control, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: index < controlsList.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
              }}
            >
              <span
                style={{
                  color: '#aaa',
                  fontSize: '14px',
                }}
              >
                {control.description}
              </span>
              <kbd
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '5px',
                  padding: '6px 12px',
                  color: '#fff',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
                }}
              >
                {control.key}
              </kbd>
            </div>
          ))}
        </div>

        <button
          onClick={handleClose}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: 'rgba(100, 150, 255, 0.8)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 15px rgba(100, 150, 255, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(100, 150, 255, 1)';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(100, 150, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(100, 150, 255, 0.8)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(100, 150, 255, 0.3)';
          }}
        >
          Resume (ESC)
        </button>
      </div>
    </div>
  );
}
