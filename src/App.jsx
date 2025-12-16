import React from "react";
import { CabonegroHighAltitude, Scene2, Scene3 } from "./scenes";

const SCENES = {
  1: CabonegroHighAltitude,
  2: Scene2,
  3: Scene3,
};

const SCENE_NAMES = {
  1: "cabonegro_high_altitude",
  2: "scene_2",
  3: "scene_3",
};

function App({ sceneNumber = 1 }) {
  const SceneComponent = SCENES[sceneNumber] || SCENES[1];

  return <SceneComponent />;
}

export default App;
export { SCENES, SCENE_NAMES };
