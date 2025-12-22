import React, { useEffect } from "react";
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
import { initializeHeightmap } from "../terrainHeightSampler";
import { getCurrentExploreScene, subscribeToExploreScene } from "../SceneNavigator";

export function Scene1({ textureRotation = 0 }) {
  // Scene 1: Cabo Negro Terrain - Orbit around terrain
  const heightmapTexture = useTexture("/assets/textures/punta-arenas-cabonegro-heightmap.png");
  const terrainRef = useRef();
  
  // Initialize terrain height sampler
  useEffect(() => {
    if (heightmapTexture && heightmapTexture.image) {
      initializeHeightmap(heightmapTexture.image);
    }
  }, [heightmapTexture]);

  // Start cinematic scene when component mounts or scene changes
  useEffect(() => {
    const checkAndStart = () => {
      const currentScene = getCurrentExploreScene();
      if (currentScene === 1) {
        startCinematicScene(1);
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

      <PerspectiveCamera makeDefault position={[0, 3.5, 6.5]} fov={40} />

      <MountainRoadLandscape ref={terrainRef} textureRotation={textureRotation} />
      <LocationBeam />
      <Compass />
      <CollisionDetector />
      
      {/* Coordinate Ruler - helps visualize coordinate system */}
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
          blendFunction={BlendFunction.NORMAL} // blend mode
          hue={-0.15} // hue in radians
          saturation={0.1} // saturation in radians
        />
      </EffectComposer>
    </>
  );
}
