// Cinematic scene configurations based on production script
// All 7 scenes with camera positions, movements, and text overlays

export const CINEMATIC_SCENES = {
  1: {
    name: "Cabo Negro Terrain",
    purpose: "Establish land, scale, calm authority",
    camera: {
      position: [0.0, 3.5, 6.5],
      rotation: { pitch: -0.55, yaw: 3.14, roll: 0 },
      fov: 40
    },
    movement: {
      type: 'orbit',
      center: [0, 0, 0],
      radiusStart: 6.5,
      radiusEnd: 6.2,
      speed: 0.015,
      duration: 13500, // 12-15s average
      easing: 'easeInOutSine',
      direction: 'clockwise'
    },
    text: {
      title: "Cabo Negro, Chile",
      subtitle: "A strategic coastal territory"
    },
    visualCues: {
      terrainVisible: true,
      ambientLight: true,
      overlays: false
    }
  },
  2: {
    name: "Punta Arenas Context",
    purpose: "Geographic & human scale",
    camera: {
      position: [-12.0, 4.2, 9.0],
      rotation: { pitch: -0.42, yaw: -2.2, roll: 0 },
      fov: 40
    },
    movement: {
      type: 'pan',
      direction: 'leftToRight',
      yawStart: -2.2,
      yawEnd: -1.6,
      speed: 0.012,
      duration: 11000, // 10-12s average
      easing: 'linear'
    },
    text: {
      title: "Punta Arenas",
      subtitle: "Southern Chile's logistics gateway"
    },
    visualCues: {
      cityAbstraction: true,
      roadsVisible: true,
      atmosphericHaze: true
    }
  },
  3: {
    name: "Satellite View",
    purpose: "Macro understanding & credibility",
    camera: {
      position: [0.0, 35.0, 0.0],
      rotation: { pitch: -1.57, yaw: 0.0, roll: 0 },
      fov: 35
    },
    movement: {
      type: 'pullBack',
      axis: 'vertical',
      startY: 18,
      endY: 35,
      speed: 0.02,
      duration: 9000, // 8-10s average
      easing: 'linear'
    },
    text: {
      title: "At the edge of the Pacific",
      subtitle: "Connecting South America to global trade"
    },
    visualCues: {
      earthCurvature: true,
      clouds: true,
      highlighted: true
    }
  },
  4: {
    name: "Maritime Terminal",
    purpose: "Infrastructure anchor",
    camera: {
      position: [4.8, 2.1, -6.4],
      rotation: { pitch: -0.32, yaw: 0.85, roll: 0 },
      fov: 40
    },
    movement: {
      type: 'dolly',
      direction: 'forward',
      distance: 1.5,
      yawStart: 0.85,
      yawEnd: 0.65,
      speed: 0.02,
      duration: 11000, // 10-12s average
      easing: 'easeInOutSine'
    },
    text: {
      title: "Maritime Terminal",
      subtitle: "A protected port for regional and global operations"
    },
    visualCues: {
      dockOutlines: true,
      shipSilhouettes: true,
      waterReflections: true
    },
    models: {
      terminal: "assets/models/maritime-terminal.glb",
      ships: "assets/models/ships.glb"
    }
  },
  5: {
    name: "Wind Energy Potential",
    purpose: "Motion, sustainability, power",
    camera: {
      position: [-6.2, 3.0, 2.5],
      rotation: { pitch: -0.38, yaw: -0.9, roll: 0 },
      fov: 42
    },
    movement: {
      type: 'tracking',
      direction: 'rightToLeft',
      speed: 0.018,
      duration: 10000, // 9-11s average
      easing: 'linear'
    },
    text: {
      title: "Wind Energy Potential",
      subtitle: "Local power for long-term infrastructure"
    },
    visualCues: {
      windLines: true,
      turbines: true,
      naturalLight: true,
      highContrast: true
    },
    models: {
      turbines: "assets/models/wind-turbines.glb"
    }
  },
  6: {
    name: "Data Center Potential",
    purpose: "Precision, future value, silence",
    camera: {
      position: [2.4, 2.2, 4.1],
      rotation: { pitch: -0.28, yaw: -2.6, roll: 0 },
      fov: 38
    },
    movement: {
      type: 'staticHold',
      drift: 0.05,
      speed: 0.005,
      duration: 11000, // 10-12s average
      easing: 'easeInOutSine'
    },
    text: {
      title: "Data Center Potential",
      subtitle: "Climate, energy, and connectivity aligned"
    },
    visualCues: {
      dataStreams: true,
      rectilinearVolumes: true,
      coolerColorTemp: true
    },
    models: {
      dataCenter: "assets/models/data-center.glb"
    }
  },
  7: {
    name: "Synthesis / Investable Land",
    purpose: "Mental closure & conviction",
    camera: {
      position: [0.0, 6.5, 10.0],
      rotation: { pitch: -0.6, yaw: 3.14, roll: 0 },
      fov: 40
    },
    movement: {
      type: 'pullBackRise',
      pullBackDistance: 2.0,
      riseDistance: 1.5,
      speed: 0.015,
      duration: 13500, // 12-15s average
      easing: 'easeInOutSine'
    },
    text: {
      title: "From land to infrastructure",
      subtitle: "A long-term strategic asset"
    },
    visualCues: {
      allLayersVisible: true,
      parcelsOutlined: true
    }
  }
};

// Easing functions
export const EASING_FUNCTIONS = {
  easeInOutSine: (t) => {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  },
  linear: (t) => t,
  easeInOutCubic: (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
};

// Get scene by ID
export function getScene(sceneId) {
  return CINEMATIC_SCENES[sceneId];
}

// Get all scene IDs
export function getAllSceneIds() {
  return Object.keys(CINEMATIC_SCENES).map(Number).sort((a, b) => a - b);
}

// Get total number of scenes
export function getTotalScenes() {
  return Object.keys(CINEMATIC_SCENES).length;
}
