import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Vector3 } from 'three';
import { setCameraTarget } from './CameraAnimator';

export function ClickableTile({
  position,
  size = [2, 0.1, 2],
  cameraTarget,
  title = 'Placeholder Title',
  paragraph = 'Placeholder paragraph text goes here.',
  ctaText = 'Learn More',
  ctaUrl = '#',
  tagText = 'Click Me',
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const meshRef = useRef();
  const tagRef = useRef();
  
  // Animate tag floating
  useFrame((state) => {
    if (tagRef.current) {
      tagRef.current.position.y = position[1] + size[1] / 2 + 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (cameraTarget) {
      setIsClicked(true);
      setCameraTarget(cameraTarget.position, cameraTarget.rotation);
    }
  };
  
  const handleClose = () => {
    setIsClicked(false);
  };
  
  const handleCTAClick = (e) => {
    e.stopPropagation();
    if (ctaUrl && ctaUrl !== '#') {
      window.open(ctaUrl, '_blank');
    }
  };
  
  return (
    <>
      {/* The clickable tile mesh */}
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setIsHovered(false);
          document.body.style.cursor = '';
        }}
        onClick={handleClick}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color="#ffffff"
          opacity={0.1}
          transparent
          wireframe={false}
        />
      </mesh>
      
      {/* Floating tag above the tile */}
      <mesh
        ref={tagRef}
        position={[position[0], position[1] + size[1] / 2 + 0.5, position[2]]}
      >
        <Html
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              background: isHovered ? 'rgba(100, 150, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)',
              color: isHovered ? 'white' : '#333',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {tagText}
          </div>
        </Html>
      </mesh>
      
      {/* Content overlay when clicked */}
      {isClicked && (
        <Html
          center
          style={{
            width: '100%',
            height: '100%',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10000,
              backdropFilter: 'blur(5px)',
            }}
            onClick={handleClose}
          >
            <div
              style={{
                background: 'rgba(20, 20, 30, 0.95)',
                padding: '40px',
                borderRadius: '15px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                maxWidth: '600px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                pointerEvents: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  color: '#fff',
                  marginTop: 0,
                  marginBottom: '20px',
                  fontSize: '28px',
                  fontWeight: 'bold',
                }}
              >
                {title}
              </h2>
              <p
                style={{
                  color: '#ccc',
                  marginBottom: '30px',
                  fontSize: '16px',
                  lineHeight: '1.6',
                }}
              >
                {paragraph}
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '15px',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={handleClose}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  Continue Exploring
                </button>
                <button
                  onClick={handleCTAClick}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(100, 150, 255, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
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
                  {ctaText}
                </button>
              </div>
            </div>
          </div>
        </Html>
      )}
    </>
  );
}
