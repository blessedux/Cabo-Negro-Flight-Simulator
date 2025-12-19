import React from "react";
import { PerspectiveCamera, Environment } from "@react-three/drei";
import { EffectComposer, HueSaturation } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { MountainRoadLandscape } from "../MountainRoadLandscape";
import { SphereEnv } from "../SphereEnv";
import { Airplane } from "../Airplane";
import { Targets } from "../Targets";
import { MotionBlur } from "../MotionBlur";
import { CameraDragControls } from "../CameraDragControls";
import { LocationBeam } from "../LocationBeam";
import { Compass } from "../Compass";
import { CollisionDetector } from "../CollisionDetector";
import { CameraAngleLogger } from "../CameraAngleLogger";
import { CameraStartAnimation, resetCameraStartAnimation } from "../CameraStartAnimation";
import { useTexture } from "@react-three/drei";
import { useEffect } from "react";
import { initializeHeightmap } from "../terrainHeightSampler";

export function CabonegroHighAltitude({ textureRotation = 0 }) {
  // textureRotation prop kept for compatibility but defaults to 0
  const heightmapTexture = useTexture("assets/textures/punta-arenas-cabonegro-heightmap.png");
  
  // Reset camera animation when scene loads/restarts
  useEffect(() => {
    resetCameraStartAnimation();
  }, []);
  
  // Initialize terrain height sampler
  useEffect(() => {
    if (heightmapTexture && heightmapTexture.image) {
      initializeHeightmap(heightmapTexture.image);
    }
  }, [heightmapTexture]);
  
  return (
    <>
      <CameraDragControls />
      <CameraStartAnimation />
      <CameraAngleLogger enabled={true} logInterval={1000} />
      <SphereEnv />
      <Environment background={false} files={"assets/textures/envmap.hdr"} />

      <PerspectiveCamera makeDefault position={[0, 15, 12]} fov={60} />

      <MountainRoadLandscape textureRotation={textureRotation} />
      <Airplane />
      <Targets />
      <LocationBeam />
      <Compass />
      <CollisionDetector />

      <ambientLight intensity={0.6} color="#ffffff" />

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
