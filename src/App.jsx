import React from "react";
import { CabonegroHighAltitude } from "./scenes";

// Scene mapping
// For /flight route: sceneNumber 0 = CabonegroHighAltitude
// For /explore route: ExploreScene handles the unified environment with camera angles
const SCENES = {
  0: CabonegroHighAltitude, // Flight scene
  // Note: Explore scenes (1-7) are now handled by ExploreEnvironment component
  // which uses CinematicCameraController to change camera angles, not swap scenes
};

const SCENE_NAMES = {
  0: "cabonegro_high_altitude",
  // Explore scene names are now managed by SceneNavigator
};

function App({ sceneNumber = 0 }) {
  const SceneComponent = SCENES[sceneNumber] || SCENES[0];

  return <SceneComponent />;
}

export default App;
export { SCENES, SCENE_NAMES };
