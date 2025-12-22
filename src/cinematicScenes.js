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
      position: [0.052, 0.425, -0.934],
      rotation: { pitch: -0.6844, yaw: -3.0242, roll: 0 },
      fov: 40
    },
    movement: {
      type: 'pullBack',
      axis: 'vertical',
      startY: 0.425, // Start at new altitude
      endY: 4.2, // Smoothly rise to higher altitude
      speed: 0.015,
      duration: 20000, // 20 seconds for slower, smoother ascent
      easing: 'easeInOutSine',
      lookAtCenter: true // Always look at center while moving
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
    name: "Global Trade Route",
    purpose: "Maritime trade and Panama Canal alternative",
    camera: {
      position: [-8.227, 0.24, 2.612], // Starting position
      rotation: { pitch: -0.3023, yaw: -0.5289, roll: 0 }, // Starting rotation
      fov: 27
    },
    movement: {
      type: 'keyframePan',
      keyframes: [
        {
          position: [-8.227, 0.24, 2.612],
          rotation: { pitch: -0.3023, yaw: -0.5289, roll: 0 }
        },
        {
          position: [-10.942, 1.37, 5.16],
          rotation: { pitch: -0.2796, yaw: -0.8471, roll: 0 }
        }
      ],
      duration: 20000, // 20 seconds for smooth transition
      easing: 'easeInOutSine',
      loop: false
    },
    text: {
      title: "Global Trade Routes",
      subtitle: "An efficient alternative to the Panama Canal, offering new opportunities for cargo ships and maritime routes"
    },
    visualCues: {
      maritimeView: true,
      cargoShips: true,
      terrainVisible: true
    }
  },
  5: {
    name: "Maritime Port Potential",
    purpose: "Motion, sustainability, power",
    camera: {
      position: [0.651, 0.185, 0.658],
      rotation: { pitch: -0.2446, yaw: 1.4952, roll: 0 },
      fov: 49
    },
    movement: {
      type: 'orbit',
      center: [0, 0, 0], // Orbit around origin/beam
      radiusStart: 0.926, // Distance from center (sqrt(0.651^2 + 0.658^2))
      radiusEnd: 0.926, // Keep same radius for smooth orbit
      speed: 0.008, // Slow orbit speed for smooth movement
      duration: 20000, // 20 seconds
      easing: 'easeInOutSine',
      direction: 'clockwise'
    },
    text: {
      title: "Maritime Port Potential",
      subtitle: "Strategic coastal infrastructure for global trade"
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
    name: "Wind Energy",
    purpose: "Wind turbine close-up view",
    camera: {
      position: [0.344, 0.061, 0.296], // Starting position
      rotation: { pitch: 0.1461, yaw: 2.7192, roll: 0 }, // Starting rotation
      fov: 18 // Starting FOV
    },
    movement: {
      type: 'keyframePan',
      keyframes: [
        {
          position: [0.344, 0.061, 0.296],
          rotation: { pitch: 0.1461, yaw: 2.7192, roll: 0 },
          fov: 18
        },
        {
          position: [0.535, 0.275, 0.18],
          rotation: { pitch: -0.3854, yaw: 2.1985, roll: 0 },
          fov: 31
        }
      ],
      duration: 20000, // 20 seconds for smooth transition
      easing: 'easeInOutSine',
      loop: false
    },
    text: {
      title: "Wind Energy Investment Opportunity",
      subtitle: "50%+ capacity factors, 300+ windy days annually, and permits in place. High profitability with faster payback periods."
    },
    visualCues: {
      turbines: true,
      naturalLight: true,
      closeUp: true
    },
    models: {
      turbine: "assets/models/wind_turbine.glb"
    }
  },
  7: {
    name: "Data Center Potential",
    purpose: "Precision, future value, silence",
    camera: {
      position: [2.428, 2.223, 4.111], // Starting position
      rotation: { pitch: -0.255, yaw: -0.005, roll: 0 }, // Starting rotation
      fov: 38
    },
    movement: {
      type: 'keyframePan',
      keyframes: [
        {
          position: [2.428, 2.223, 4.111],
          rotation: { pitch: -0.255, yaw: -0.005, roll: 0 }
        },
        {
          position: [2.428, 2.223, 4.111],
          rotation: { pitch: -0.255, yaw: 0.3, roll: 0 } // Pan left (increase yaw) - happens in first 3 seconds
        },
        {
          position: [0.002, 0.05, 0.519],
          rotation: { pitch: -0.8815, yaw: 1.5609, roll: 0 } // Cut to data center position at 3 seconds
        },
        {
          position: [0.002, 0.05, 0.519],
          rotation: { pitch: -0.8815, yaw: 1.5609, roll: 0 } // Hold at data center position
        }
      ],
      duration: 15000, // 15 seconds total
      // Keyframe timing: 0-20% (0-3s): pan left, 20-25% (3-3.75s): cut transition, 25-100% (3.75-15s): hold
      easing: 'easeInOutSine',
      loop: false
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
  8: {
    name: "Synthesis / Investable Land",
    purpose: "Mental closure & conviction",
    camera: {
      position: [4.012, 2.63, 8.023], // Starting position
      rotation: { pitch: -0.405, yaw: 6.61, roll: 0 }, // Starting rotation
      fov: 68 // Starting FOV
    },
    movement: {
      type: 'keyframePan',
      keyframes: [
        {
          position: [4.012, 2.63, 8.023],
          rotation: { pitch: -0.405, yaw: 6.61, roll: 0 },
          fov: 68
        },
        {
          position: [4.012, 2.63, 8.023],
          rotation: { pitch: -0.405, yaw: 6.61, roll: 0 },
          fov: 28
        }
      ],
      duration: 20000, // 20 seconds for smooth FOV transition
      easing: 'easeInOutSine',
      loop: false
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
