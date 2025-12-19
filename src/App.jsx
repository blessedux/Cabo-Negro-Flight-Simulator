import React from "react";
import { CabonegroHighAltitude, Scene1, Scene2, Scene3 } from "./scenes";

// Scene mapping
// For /flight route: sceneNumber 0 = CabonegroHighAltitude
// For /explore route: sceneNumber 1 = Scene1 (Default Orbit), 2 = Scene2 (Punta Arenas), 3 = Scene3 (Satellite)
const SCENES = {
  0: CabonegroHighAltitude, // Flight scene
  1: Scene1, // Default Orbit (explore scene 1)
  2: Scene2, // Punta Arenas (explore scene 2)
  3: Scene3, // Satellite (explore scene 3)
};

const SCENE_NAMES = {
  1: "cabonegro_high_altitude",
  2: "scene_2",
  3: "scene_3",
};

function App({ sceneNumber = 0 }) {
  const SceneComponent = SCENES[sceneNumber] || SCENES[0];

  return <SceneComponent />;
}

export default App;
export { SCENES, SCENE_NAMES };
