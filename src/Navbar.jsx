import React, { useState, useEffect, useRef, useCallback } from 'react';

export function Navbar() {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const navbarRef = useRef(null);

  // Check if desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768); // Adjust breakpoint as needed
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleMouseDown = useCallback((e) => {
    // Allow dragging from anywhere on the navbar except buttons/links
    const target = e.target;
    if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
      return; // Don't drag if clicking on interactive elements
    }
    
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    document.body.style.cursor = 'grabbing';
    e.preventDefault();
  }, [position]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStartPos.current.x;
    const newY = e.clientY - dragStartPos.current.y;
    
    // Constrain X to stay centered (only allow Y movement)
    setPosition({ x: 0, y: newY });
    
    // Hide if dragged up off screen
    const navbarHeight = navbarRef.current?.offsetHeight || 60;
    if (newY < -navbarHeight + 10) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, [isDragging, position]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
  }, []);

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (isDragging && isDesktop) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, isDesktop, handleMouseMove, handleMouseUp]);

  const handleBackToLanding = () => {
    window.location.href = '/';
  };

  // Show navbar if hidden and user hovers near top of screen
  const handleTopHover = () => {
    if (!isVisible) {
      setIsVisible(true);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Don't render on mobile - but all hooks must be called first
  if (!isDesktop) {
    return null;
  }

  return (
    <>
      {/* Invisible hover area at top to show navbar */}
      {!isVisible && (
        <div
          onMouseEnter={handleTopHover}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '20px',
            zIndex: 10000,
            cursor: 'grab',
          }}
        />
      )}
      <div
        ref={navbarRef}
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          top: isVisible ? Math.max(0, position.y) : -80,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 9999,
          transition: isDragging ? 'none' : 'top 0.3s ease',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            width: '100%',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none', // Allow clicking through except on button
          }}
        >
          <button
            onClick={handleBackToLanding}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'auto', // Button is clickable
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <img
              src="/CaboNegro_logo_white.png"
              alt="Cabo Negro"
              style={{
                height: '40px',
                width: 'auto',
                objectFit: 'contain',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                const textSpan = e.target.nextElementSibling;
                if (textSpan) {
                  textSpan.style.display = 'block';
                }
              }}
            />
            <span style={{ display: 'none' }}>Cabo Negro</span>
          </button>
        </div>
      </div>
    </>
  );
}
