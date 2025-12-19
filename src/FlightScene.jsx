import React, { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import App from "./App.jsx";
import { CompassOverlay } from "./CompassOverlay";
import { PauseMenu } from "./PauseMenu";
import { Navbar } from "./Navbar";
import { AltitudeSpeedUI } from "./AltitudeSpeedUI";
import { RingCounter } from "./RingCounter";
import { subscribeToMenuOpen, isMenuOpen } from "./controls";
import { setBeamHitCallback, setGroundHitCallback, setAltitudeZeroCallback, resetCollisionFlags } from "./CollisionDetector";
import { resetRingCount } from "./RingCounter";
import { planePosition } from "./Airplane";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

export function FlightScene() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(isMenuOpen);
  const sceneKey = useRef(0); // Key to force scene restart

  useEffect(() => {
    // Subscribe to menu state changes
    const unsubscribe = subscribeToMenuOpen((open) => {
      setMenuOpen(open);
    });
    return unsubscribe;
  }, []);

  // Set up collision callbacks
  useEffect(() => {
    // Beam hit -> navigate to explore route
    setBeamHitCallback(() => {
      resetCollisionFlags();
      navigate('/explore');
    });

    // Ground hit or altitude zero -> restart scene
    const restartScene = () => {
      // Reset plane position to north border
      const terrainSize = 34.55;
      const northBorderZ = terrainSize / 2;
      planePosition.set(0, 3, northBorderZ);
      
      // Reset collision flags
      resetCollisionFlags();
      
      // Reset ring counter
      resetRingCount();
      
      // Force scene restart by changing key
      sceneKey.current += 1;
    };

    setGroundHitCallback(restartScene);
    setAltitudeZeroCallback(restartScene);

    // Cleanup
    return () => {
      setBeamHitCallback(null);
      setGroundHitCallback(null);
      setAltitudeZeroCallback(null);
    };
  }, [navigate]);

  return (
    <>
      <Navbar />
      <CompassOverlay />
      <AltitudeSpeedUI />
      <RingCounter />
      {menuOpen && <PauseMenu />}
      <Canvas 
        shadows
        gl={{
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
      >
        <Suspense fallback={null}>
          <App key={sceneKey.current} sceneNumber={0} />
        </Suspense>
      </Canvas>
    </>
  );
}
