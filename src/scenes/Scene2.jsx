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
import { ClickableTerrainTile } from "../ClickableTerrainTile";
import { CoordinateRuler } from "../CoordinateRuler";
import { useTexture } from "@react-three/drei";
import { useRef } from "react";
import { getCurrentExploreScene, subscribeToExploreScene } from "../SceneNavigator";

export function Scene2({ textureRotation = 0 }) {
  // Scene 2: Punta Arenas Context - Slow pan orbit
  const terrainRef = useRef();
  
  // Initialize terrain height sampler
  useEffect(() => {
    // Heightmap initialization removed
  }, []);

  // Start cinematic scene when component mounts or scene changes
  useEffect(() => {
    const checkAndStart = () => {
      const currentScene = getCurrentExploreScene();
      if (currentScene === 2) {
        startCinematicScene(2);
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

      <PerspectiveCamera makeDefault position={[-12.0, 4.2, 9.0]} fov={40} />

      <MountainRoadLandscape ref={terrainRef} textureRotation={textureRotation} />
      {/* Only show LocationBeam in cinematic mode (NOT free exploration) */}
      {isCinematicMode() && <LocationBeam />}
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
      
      {/* Clickable terrain tile - only show in free exploration mode */}
      {!isCinematicMode() && (
        <ClickableTerrainTile
        terrainGroupRef={terrainRef}
        tilePosition={[0, 0.0009, -0.33]} // X, Z position - moved -5 tiles north (5 * 11.48 * 0.01 = 0.574, north is negative Z) - Y will be calculated from terrain height
        squareSize={0.05} // 1/4 of original size (0.2 / 4 = 0.05)
        cameraTarget={{
          position: [-0.072, 0.68, -1.175],
          rotation: { pitch: -0.6719, yaw: -2.876, roll: 0 }
        }}
        title="Placeholder Title"
        paragraph="This is a placeholder paragraph. Replace this with your actual content. The camera will animate to the specified position and angle when this tile is clicked."
        ctaText="Learn More"
        ctaUrl="https://example.com"
        tagText="Click Me"
        />
      )}

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
