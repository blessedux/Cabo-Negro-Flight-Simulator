import React from "react";
import { PerspectiveCamera, Environment } from "@react-three/drei";
import { EffectComposer, HueSaturation } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { MountainRoadLandscape } from "../MountainRoadLandscape";
import { SphereEnv } from "../SphereEnv";
import { Airplane } from "../Airplane";
import { CameraDragControls } from "../CameraDragControls";

export function Scene2({ textureRotation = 0 }) {
  return (
    <>
      <CameraDragControls />
      <SphereEnv />
      <Environment background={false} files={"assets/textures/envmap.hdr"} />

      <PerspectiveCamera makeDefault position={[0, 8, 8]} fov={60} />

      <MountainRoadLandscape textureRotation={textureRotation} />
      <Airplane />

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
        <HueSaturation
          blendFunction={BlendFunction.NORMAL}
          hue={-0.15}
          saturation={0.1}
        />
      </EffectComposer>
    </>
  );
}
