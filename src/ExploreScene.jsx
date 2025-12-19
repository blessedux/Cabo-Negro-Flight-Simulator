import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import App from "./App.jsx";
import { PauseMenu } from "./PauseMenu";
import { Navbar } from "./Navbar";
import { CameraPositionLoggerUI } from "./CameraPositionLoggerUI";
import { ExplorerControlMenu } from "./ExplorerControlMenu";
import { SceneNavigator, getCurrentExploreScene, subscribeToExploreScene } from "./SceneNavigator";
import { TileModal } from "./TileModal";
import { subscribeToMenuOpen, isMenuOpen } from "./controls";
import * as THREE from "three";

export function ExploreScene() {
  const [menuOpen, setMenuOpen] = React.useState(isMenuOpen);
  const [currentScene, setCurrentScene] = React.useState(getCurrentExploreScene());

  React.useEffect(() => {
    // Subscribe to menu state changes
    const unsubscribeMenu = subscribeToMenuOpen((open) => {
      setMenuOpen(open);
    });
    
    // Subscribe to explore scene changes
    const unsubscribeScene = subscribeToExploreScene((scene) => {
      setCurrentScene(scene);
    });
    
    return () => {
      unsubscribeMenu();
      unsubscribeScene();
    };
  }, []);

  // Map explore scene numbers to App scene numbers
  // Explore Scene 1 = Default Orbit (App Scene 1)
  // Explore Scene 2 = Punta Arenas (App Scene 2)
  // Explore Scene 3 = Satellite (App Scene 3)
  const appSceneNumber = currentScene;

  return (
    <>
      <Navbar />
      <CameraPositionLoggerUI />
      <ExplorerControlMenu />
      <SceneNavigator />
      <TileModal />
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
          <App sceneNumber={appSceneNumber} />
        </Suspense>
      </Canvas>
    </>
  );
}
