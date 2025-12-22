import React, { useEffect, Suspense } from "react";
import { PerspectiveCamera, Environment } from "@react-three/drei";
import { EffectComposer, HueSaturation } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { MountainRoadLandscape } from "../MountainRoadLandscape";
import { SphereEnv } from "../SphereEnv";
import { MotionBlur } from "../MotionBlur";
import { FreeCameraDragControls } from "../FreeCameraDragControls";
import { LocationBeam } from "../LocationBeam";
import { Compass } from "../Compass";
import { CollisionDetector } from "../CollisionDetector";
import { CameraPositionLogger } from "../CameraPositionLogger";
import { CameraAnimator } from "../CameraAnimator";
import { CinematicCameraController, startCinematicScene, isCinematicMode } from "../CinematicCameraController";
import { CoordinateRuler } from "../CoordinateRuler";
import { useTexture } from "@react-three/drei";
import { useRef } from "react";
import { getCurrentExploreScene, subscribeToExploreScene } from "../SceneNavigator";

// Maritime Terminal Models
function MaritimeTerminalModels() {
  // Load terminal and ship models
  // Placeholder - models will be loaded when available
  // For now, return null to avoid errors
  // TODO: Uncomment when models are available
  // const terminalModel = useGLTF("assets/models/maritime-terminal.glb");
  // const shipsModel = useGLTF("assets/models/ships.glb");
  
  // return (
  //   <group>
  //     <primitive object={terminalModel.scene} />
  //     <primitive object={shipsModel.scene} />
  //   </group>
  // );
  
  return null; // Models not available yet
}

export function Scene4({ textureRotation = 0 }) {
  // Scene 4: Maritime Terminal - Dolly forward
  const terrainRef = useRef();
  
  // Initialize terrain height sampler
  useEffect(() => {
    // Heightmap initialization removed
  }, []);

  // Start cinematic scene when component mounts or scene changes
  useEffect(() => {
    const checkAndStart = () => {
      const currentScene = getCurrentExploreScene();
      if (currentScene === 4) {
        startCinematicScene(4);
      }
    };
    
    checkAndStart();
    
    // Subscribe to scene changes
    const unsubscribe = subscribeToExploreScene(checkAndStart);
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  return (
    <>
      {!isCinematicMode() && <FreeCameraDragControls />}
      <CinematicCameraController />
      <CameraAnimator />
      <CameraPositionLogger />
      <SphereEnv />
      <Environment background={false} files={"/assets/textures/envmap.hdr"} />

      <PerspectiveCamera makeDefault position={[4.8, 2.1, -6.4]} fov={40} />

      <MountainRoadLandscape ref={terrainRef} textureRotation={textureRotation} />
      
      {/* Maritime Terminal Models */}
      <Suspense fallback={null}>
        <MaritimeTerminalModels />
      </Suspense>
      
      <LocationBeam />
      <Compass />
      <CollisionDetector />
      
      <CoordinateRuler 
        centerX={0} 
        centerZ={0} 
        range={15} 
        markerSpacing={1} 
        showLabels={true} 
      />

      <directionalLight
        castShadow
        color={"#f3d29a"}
        intensity={2}
        position={[10, 5, 4]}
        shadow-bias={-0.0005}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.01}
        shadow-camera-far={20}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-left={-6.2}
        shadow-camera-right={6.4}
      />

      <EffectComposer>
        <MotionBlur />
        <HueSaturation
          blendFunction={BlendFunction.NORMAL}
          hue={-0.15}
          saturation={0.1}
        />
      </EffectComposer>
    </>
  );
}

// Preload models (commented out until models are available)
// useGLTF.preload("assets/models/maritime-terminal.glb");
// useGLTF.preload("assets/models/ships.glb");
