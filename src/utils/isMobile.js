import { useState, useEffect } from 'react';

// Mobile detection utility
export function isMobile() {
  // Check for touch device and small screen
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;
  
  return hasTouch && isSmallScreen;
}

export function useIsMobile() {
  const [mobile, setMobile] = useState(isMobile());
  
  useEffect(() => {
    const handleResize = () => {
      setMobile(isMobile());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return mobile;
}

