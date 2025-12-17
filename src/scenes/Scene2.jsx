import React from "react";
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
import { ClickableTerrainTile } from "../ClickableTerrainTile";
import { useTexture } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { initializeHeightmap } from "../terrainHeightSampler";

export function Scene2({ textureRotation = 0 }) {
  // textureRotation prop kept for compatibility but defaults to 0
  const heightmapTexture = useTexture("assets/textures/punta-arenas-cabonegro-heightmap.png");
  const terrainRef = useRef();
  
  // Initialize terrain height sampler
  useEffect(() => {
    if (heightmapTexture && heightmapTexture.image) {
      initializeHeightmap(heightmapTexture.image);
    }
  }, [heightmapTexture]);
  
  return (
    <>
      <FreeCameraDragControls />
      <CameraAnimator />
      <CameraPositionLogger />
      <SphereEnv />
      <Environment background={false} files={"assets/textures/envmap.hdr"} />

      <PerspectiveCamera makeDefault position={[0, 8, 8]} fov={60} />

      <MountainRoadLandscape ref={terrainRef} textureRotation={textureRotation} />
      <LocationBeam />
      <Compass />
      <CollisionDetector />
      
      {/* Clickable terrain tile - uses an existing tile from the map */}
      <ClickableTerrainTile
        terrainGroupRef={terrainRef}
        tilePosition={[2, 0, 2]} // X, Z position (Y will be calculated from terrain height)
        cameraTarget={{
          position: [3, 3, 3],
          rotation: { pitch: -0.3, yaw: 0.785, roll: 0 }
        }}
        title="Placeholder Title"
        paragraph="This is a placeholder paragraph. Replace this with your actual content. The camera will animate to the specified position and angle when this tile is clicked."
        ctaText="Learn More"
        ctaUrl="https://example.com"
        tagText="Click Me"
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
