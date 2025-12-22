import React, { useEffect } from 'react';
import { getCurrentExploreScene } from './SceneNavigator';

// Global state for tile modal
let tileModalState = {
  isOpen: false,
  title: '',
  paragraph: '',
  ctaText: '',
  ctaUrl: '#',
  position: 'left', // 'left' or 'right'
  imageUrl: null, // Optional image URL to display
  imageLink: null, // Optional link URL when image is clicked
};

let tileModalCallbacks = [];

export function setTileModalOpen(isOpen, data = {}) {
  // Determine position based on current scene (Scene 2 = right, others = left)
  const currentScene = getCurrentExploreScene();
  const position = currentScene === 2 ? 'right' : (data.position || 'left');
  
  tileModalState = {
    isOpen,
    title: data.title || '',
    paragraph: data.paragraph || '',
    ctaText: data.ctaText || '',
    ctaUrl: data.ctaUrl || '#',
    position: position,
    imageUrl: data.imageUrl || null,
    imageLink: data.imageLink || null,
  };
  tileModalCallbacks.forEach(cb => cb(tileModalState));
  
  // Dispatch event when closing
  if (!isOpen) {
    window.dispatchEvent(new CustomEvent('tileModalClosed'));
  }
}

export function subscribeToTileModal(callback) {
  tileModalCallbacks.push(callback);
  return () => {
    tileModalCallbacks = tileModalCallbacks.filter(cb => cb !== callback);
  };
}

export function TileModal() {
  const [modalState, setModalState] = React.useState(tileModalState);

  useEffect(() => {
    const unsubscribe = subscribeToTileModal((state) => {
      setModalState(state);
    });
    return unsubscribe;
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!modalState.isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        setTileModalOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [modalState.isOpen]);

  if (!modalState.isOpen) {
    return null;
  }

  const handleClose = () => {
    setTileModalOpen(false);
  };

  const handleCTAClick = (e) => {
    e.stopPropagation();
    if (modalState.ctaUrl && modalState.ctaUrl !== '#') {
      window.open(modalState.ctaUrl, '_blank');
    }
  };

  const modalWidth = '30vw'; // 30% of viewport width (max on desktop)
  const modalHeight = '75vh'; // 3/4 of viewport height
  const marginLeft = '80px'; // Left margin
  const marginRight = '80px'; // Right margin
  
  // Determine position based on modal state
  const isRightAligned = modalState.position === 'right';
  const leftStyle = isRightAligned ? 'auto' : marginLeft;
  const rightStyle = isRightAligned ? marginRight : 'auto';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'transparent',
        zIndex: 10000,
        pointerEvents: 'auto',
      }}
      onClick={handleClose}
    >
      {/* Modal container - 45% width and 75% height, aligned left or right with glassmorphism background */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: leftStyle,
          right: rightStyle,
          transform: 'translateY(-50%)',
          width: modalWidth,
          height: modalHeight,
          background: 'rgba(100, 100, 100, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          padding: '25px 35px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button (X icon) in top right of modal */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '40px',
            height: '40px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            zIndex: 10001,
            backdropFilter: 'blur(10px)',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          ×
        </button>
        
        {/* Title */}
        <h1
          style={{
            color: '#ffffff',
            fontSize: '32px',
            fontWeight: 'bold',
            margin: 0,
            marginBottom: '15px',
            textShadow: '2px 2px 8px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
          }}
        >
          {modalState.title}
        </h1>

        {/* Image - displayed if provided */}
        {modalState.imageUrl && (
          <div
            style={{
              width: '100%',
              marginBottom: '15px',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: modalState.imageLink ? 'pointer' : 'default',
              transition: 'transform 0.2s',
            }}
            onClick={(e) => {
              if (modalState.imageLink) {
                e.stopPropagation();
                window.open(modalState.imageLink, '_blank');
              }
            }}
            onMouseEnter={(e) => {
              if (modalState.imageLink) {
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (modalState.imageLink) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <img
              src={modalState.imageUrl}
              alt={modalState.title}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                objectFit: 'cover',
                borderRadius: '8px',
              }}
            />
          </div>
        )}

        {/* Paragraph and CTA button */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            gap: '20px',
          }}
        >
          <p
            style={{
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: '400',
              margin: 0,
              lineHeight: '1.6',
              textShadow: '2px 2px 8px rgba(0, 0, 0, 0.5)',
            }}
          >
            {modalState.paragraph}
          </p>
          
          {/* Regular CTA button (show for all modals) */}
          {modalState.ctaText && (
            <button
              onClick={handleCTAClick}
              style={{
                padding: '12px 24px',
                background: 'rgba(100, 150, 255, 0.9)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                alignSelf: 'flex-start',
                textShadow: '1px 1px 4px rgba(0, 0, 0, 0.3)',
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
              {modalState.ctaText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
