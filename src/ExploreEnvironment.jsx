import React, { useEffect, useRef, Suspense, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Environment, useTexture, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, HueSaturation } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { MountainRoadLandscape } from "./MountainRoadLandscape";
import { SphereEnv } from "./SphereEnv";
import { MotionBlur } from "./MotionBlur";
import { FreeCameraDragControls } from "./FreeCameraDragControls";
import { LocationBeam } from "./LocationBeam";
import { Compass } from "./Compass";
import { CollisionDetector } from "./CollisionDetector";
import { CameraPositionLogger } from "./CameraPositionLogger";
import { CameraAnimator } from "./CameraAnimator";
import { CinematicCameraController, isCinematicMode } from "./CinematicCameraController";
import { getFreeExplorationMode } from "./FreeExplorationMode";
import { setCameraTarget } from "./CameraAnimator";
import { setOrbitPaused } from "./controls";
import { ExploreCameraDataUpdater } from "./ExploreCameraDataUpdater";
import { Satellites } from "./Satellites";
import { CargoShip } from "./CargoShip";
import { sampleTerrainHeight } from "./terrainHeightSampler";
import { ClickableTerrainTile } from "./ClickableTerrainTile";
import { AnimatedTile } from "./AnimatedTile";
import { getCurrentExploreScene, subscribeToExploreScene } from "./SceneNavigator";
import { beamPosition } from "./LocationBeam";
import { setTileModalOpen } from "./TileModal";

// Single Wind Turbine instance
function WindTurbineInstance({ scene, position, scale, index }) {
  const instanceRef = useRef();
  const isFreeMode = getFreeExplorationMode();
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    if (!scene || !instanceRef.current) return;
    
    console.log(`Setting up wind turbine ${index} at position:`, position);
    
    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    console.log(`Turbine ${index} bounding box:`, { center, size });
    
    const scaledCenter = center.clone().multiplyScalar(scale);
    const scaledBottomY = box.min.y * scale;
    
    // Sample terrain height at this position
    const terrainHeight = sampleTerrainHeight(position.x, position.z);
    const adjustedY = terrainHeight - scaledBottomY;
    
    // Apply scale
    instanceRef.current.scale.set(scale, scale, scale);
    
    // Position at target location, centered horizontally
    const finalPosition = new THREE.Vector3(
      position.x - scaledCenter.x,
      adjustedY,
      position.z - scaledCenter.z
    );
    
    instanceRef.current.position.copy(finalPosition);
    instanceRef.current.visible = true;
    
    // Ensure all children are visible
    instanceRef.current.traverse((child) => {
      if (child.isMesh) {
        child.visible = true;
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if (mat) {
                mat.visible = true;
                mat.opacity = 1.0;
                mat.transparent = false;
              }
            });
          } else {
            child.material.visible = true;
            child.material.opacity = 1.0;
            child.material.transparent = false;
          }
        }
      }
    });
    
    console.log(`Turbine ${index} positioned at:`, finalPosition, `terrain height:`, terrainHeight);
  }, [scene, position.x, position.y, position.z, scale, index]);
  
  // Handle click on wind turbine
  const handleClick = (e) => {
    if (!isFreeMode) return;
    e.stopPropagation();
    setOrbitPaused(true);
    
    // Get turbine world position
    const turbineWorldPos = new THREE.Vector3();
    if (instanceRef.current) {
      instanceRef.current.getWorldPosition(turbineWorldPos);
    } else {
      // Fallback to calculated position
      const terrainHeight = sampleTerrainHeight(position.x, position.z);
      turbineWorldPos.set(position.x, terrainHeight, position.z);
    }
    
    // Scene 6 camera position: [0.344, 0.061, 0.296] with rotation { pitch: 0.1461, yaw: 2.7192, roll: 0 }
    const scene6Position = [0.344, 0.061, 0.296];
    const scene6Rotation = { pitch: 0.1461, yaw: 2.7192, roll: 0 };
    
    // Animate camera to Scene 6 position, looking at the turbine during movement
    setCameraTarget(
      scene6Position,
      scene6Rotation,
      1500, // Default duration
      [turbineWorldPos.x, turbineWorldPos.y, turbineWorldPos.z] // Look at turbine during movement
    );
    
    // Open modal with information about wind energy potential
    setTileModalOpen(true, {
      title: "Wind Energy Potential",
      paragraph: "This region offers exceptional wind energy potential with average wind speeds exceeding 8-10 meters per second and over 300 windy days per year. The consistent and strong wind patterns in Patagonia create ideal conditions for wind power generation, with capacity factors that can reach 50% or higher—significantly above the global average of 35-40%. These favorable conditions translate into highly reliable and cost-effective operations, with lower operational costs and higher energy output per installed capacity. The area's wind resources make wind energy projects highly profitable, with faster payback periods and superior returns on investment. Development permits for wind energy projects are already in place, facilitating the development of this renewable energy resource.",
      ctaText: "Learn More",
      ctaUrl: "#",
    });
  };
  
  // Handle hover
  const handlePointerOver = (e) => {
    if (!isFreeMode) return;
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = (e) => {
    if (!isFreeMode) return;
    e.stopPropagation();
    setIsHovered(false);
    document.body.style.cursor = '';
  };
  
  if (!scene) return null;
  
  return (
    <group 
      ref={instanceRef} 
      visible={true}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <primitive object={scene.clone()} />
    </group>
  );
}

// Wind Turbines for Scene 6 (4 turbines total)
function WindTurbineModel({ currentScene }) {
  // Hooks must ALWAYS be called in the same order - call them unconditionally
  const { scene } = useGLTF(MODELS.windTurbine);
  
  // Scale: half of current size (0.0025 / 2 = 0.00125)
  const turbineScale = 0.00125;
  
  // Final turbine positions (from dev UI positioning)
  const turbinePositions = useMemo(() => {
    // Final positions - these are absolute positions from the UI
    // The UI showed positions relative to origin, not beam position
    // Turbine 1: X: 0.045, Z: 0.402
    // Turbine 2: X: 0.165, Z: 0.462
    // Turbine 3: X: 0.205, Z: 0.402
    // Turbine 4: X: 0.245, Z: 0.502
    return [
      new THREE.Vector3(0.045, 0, 0.402),
      new THREE.Vector3(0.165, 0, 0.462),
      new THREE.Vector3(0.205, 0, 0.402),
      new THREE.Vector3(0.245, 0, 0.502),
    ];
  }, []);
  
  // Debug logging
  useEffect(() => {
    if (currentScene === 6 && scene) {
      console.log('=== Wind Turbine Model Setup ===');
      console.log('Scene:', scene);
      console.log('Turbine scale:', turbineScale);
      console.log('Number of turbines:', turbinePositions.length);
      console.log('Turbine positions:', turbinePositions);
    }
  }, [currentScene, scene, turbineScale, turbinePositions]);
  
  // Conditionally render AFTER all hooks are called
  // Show in Scene 6 or in free exploration mode
  const isFreeMode = getFreeExplorationMode();
  if ((currentScene !== 6 && !isFreeMode) || !scene) {
    return null;
  }
  
  return (
    <>
      <group visible={true}>
        {turbinePositions.map((pos, index) => (
          <WindTurbineInstance
            key={index}
            scene={scene}
            position={pos}
            scale={turbineScale}
            index={index}
          />
        ))}
      </group>
      
    </>
  );
}

// Server Room Model for Scene 7
function ServerRoomModel({ currentScene, dataCenterModalOpenRef, dataCenterCameraPositionRef }) {
  const { scene } = useGLTF(MODELS.serverRoom);
  const groupRef = useRef();
  const clonedSceneRef = useRef(null);
  const ceilingMeshRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [ceilingHidden, setCeilingHidden] = useState(currentScene === 7); // Hide ceiling in Scene 7 by default
  const ceilingOpacityRef = useRef(currentScene === 7 ? 0.0 : 1.0); // Start hidden in Scene 7
  const fadeSpeed = 0.05; // Fade speed per frame
  const isFreeMode = getFreeExplorationMode();
  
  // Calculate model diameter for positioning
  const modelDiameter = useMemo(() => {
    if (!scene) return 0;
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    // Use the largest dimension as diameter
    return Math.max(size.x, size.y, size.z);
  }, [scene]);
  
  // Position the server room close to the light beam at terrain height
  // Move it south (negative Z) by 3 times and east (positive X) by 5 times its current diameter
  const serverRoomPosition = useMemo(() => {
    // Start near beam position
    const baseX = beamPosition.x + -0.2;
    const baseZ = beamPosition.z + 0.1;
    
    // Current scale is 0.00125, so diameter at current scale
    const scaledDiameter = modelDiameter * 0.00125;
    
    // Move east (positive X) by 5 times and south (negative Z) by 3 times the scaled diameter
    const x = baseX + (scaledDiameter * 5);
    const z = baseZ - (scaledDiameter * 3); // South is negative Z
    
    // Sample terrain height at this position
    const terrainHeight = sampleTerrainHeight(x, z);
    
    return new THREE.Vector3(x, terrainHeight, z);
  }, [modelDiameter]);
  
  const serverRoomScale = 0.00125; // Half of previous size (0.0025 / 2 = 0.00125)
  
  // Function to find and store reference to the ceiling mesh
  const findCeiling = (sceneToModify) => {
    if (!sceneToModify || ceilingMeshRef.current) return;
    
    // Find the ceiling mesh - check by name first, then by position
    let ceilingMesh = null;
    let highestY = -Infinity;
    
    sceneToModify.traverse((child) => {
      if (child.isMesh) {
        // Check if name contains ceiling-related keywords
        const name = child.name.toLowerCase();
        if (name.includes('ceiling') || name.includes('roof') || name.includes('top')) {
          ceilingMesh = child;
          return;
        }
        
        // Also track the highest mesh as fallback
        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);
        if (worldPos.y > highestY) {
          highestY = worldPos.y;
          if (!ceilingMesh) {
            ceilingMesh = child;
          }
        }
      }
    });
    
    if (ceilingMesh) {
      ceilingMeshRef.current = ceilingMesh;
      
      // Ensure material supports transparency
      if (ceilingMesh.material) {
        const materials = Array.isArray(ceilingMesh.material) ? ceilingMesh.material : [ceilingMesh.material];
        materials.forEach(mat => {
          if (mat) {
            mat.transparent = true;
            mat.opacity = 1.0;
          }
        });
      }
      
      console.log('Ceiling found:', ceilingMesh.name || 'unnamed mesh');
    } else {
      console.warn('Could not find ceiling mesh');
    }
  };
  
  // Animate ceiling fade in/out (ceiling is removed in Scene 7, so this won't run there)
  useFrame(() => {
    if (!ceilingMeshRef.current) return;
    
    // Keep ceiling hidden if state says so (Scene 7 removes it completely, so this is for other scenes)
    const targetOpacity = ceilingHidden ? 0.0 : 1.0;
    const currentOpacity = ceilingOpacityRef.current;
    
    // Smoothly interpolate opacity
    if (Math.abs(currentOpacity - targetOpacity) > 0.01) {
      ceilingOpacityRef.current += (targetOpacity - currentOpacity) * fadeSpeed;
      
      // Update material opacity
      const mesh = ceilingMeshRef.current;
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach(mat => {
          if (mat) {
            mat.opacity = ceilingOpacityRef.current;
            // Hide completely when opacity is very low
            mesh.visible = ceilingOpacityRef.current > 0.01;
          }
        });
      }
    }
  });
  
  // Update ceiling state when scene changes
  useEffect(() => {
    if (currentScene === 7) {
      setCeilingHidden(true);
      ceilingOpacityRef.current = 0.0;
    } else {
      setCeilingHidden(false);
      ceilingOpacityRef.current = 1.0;
    }
  }, [currentScene]);
  
  // Listen for modal close events to restore ceiling if needed
  useEffect(() => {
    const handleModalClose = () => {
      // Only restore ceiling if we're not in Scene 7
      if (currentScene !== 7) {
        setCeilingHidden(false);
        ceilingOpacityRef.current = 1.0;
      }
      // Reset modal tracking
      dataCenterModalOpenRef.current = false;
      dataCenterCameraPositionRef.current = null;
    };
    
    window.addEventListener('tileModalClosed', handleModalClose);
    return () => {
      window.removeEventListener('tileModalClosed', handleModalClose);
    };
  }, [currentScene]);
  
  // Handle click on server room model
  const handleClick = (e) => {
    if (!isFreeMode) return;
    e.stopPropagation();
    setOrbitPaused(true);
    
    // Always hide ceiling when clicking on data center (same as Scene 7)
    setCeilingHidden(true);
    ceilingOpacityRef.current = 0.0;
    
    // Store camera position and modal state for tracking
    const targetCamPos = [0.002, 0.05, 0.519];
    dataCenterCameraPositionRef.current = new THREE.Vector3(...targetCamPos);
    dataCenterModalOpenRef.current = true;
    
    // Position camera to look inside the data center model (same as Scene 7 ending)
    // Pass the data center position as lookAtTarget so camera looks at it during movement
    setCameraTarget(
      targetCamPos,
      { pitch: -0.8815, yaw: 1.5609, roll: 0 },
      1500, // Default duration
      [serverRoomPosition.x, serverRoomPosition.y, serverRoomPosition.z] // Look at data center during movement
    );
    
    setTileModalOpen(true, {
      title: "Data Center Potential",
      paragraph: "This region's exceptional temperature and land conditions make it an ideal location for data center operations. The cool climate significantly reduces cooling costs, one of the largest operational expenses for data centers. Combined with stable land conditions, reliable energy infrastructure, and strategic connectivity, the area offers optimal conditions for large-scale data center development. These advantages have attracted interest from major global data providers who recognize the potential for real estate development in this strategic location, positioning the region as a key destination for next-generation data infrastructure.",
      ctaText: "Learn More",
      ctaUrl: "#",
      imageUrl: "/datacenter.webp",
    });
  };
  
  // Handle hover
  const handlePointerOver = (e) => {
    if (!isFreeMode) return;
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = (e) => {
    if (!isFreeMode) return;
    e.stopPropagation();
    setIsHovered(false);
    document.body.style.cursor = '';
  };
  
  // Clone the scene and make it clickable - MUST be called before early return (Rules of Hooks)
  const clonedScene = useMemo(() => {
    // Show in Scene 7 or in free exploration mode
    if (!scene || (currentScene !== 7 && !isFreeMode)) return null;
    const cloned = scene.clone();
    clonedSceneRef.current = cloned;
    
    // Reset ceiling ref to find it in the new cloned scene
    ceilingMeshRef.current = null;
    
    // Find the ceiling mesh in the cloned scene
    let ceilingMesh = null;
    let highestY = -Infinity;
    
    cloned.traverse((child) => {
      if (child.isMesh) {
        // Check if name contains ceiling-related keywords
        const name = child.name.toLowerCase();
        if (name.includes('ceiling') || name.includes('roof') || name.includes('top')) {
          ceilingMesh = child;
        }
        
        // Also track the highest mesh as fallback
        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);
        if (worldPos.y > highestY) {
          highestY = worldPos.y;
          if (!ceilingMesh) {
            ceilingMesh = child;
          }
        }
      }
    });
    
    // In Scene 7, completely remove the ceiling mesh instead of just hiding it
    if (currentScene === 7 && ceilingMesh) {
      // Remove the ceiling mesh from its parent
      if (ceilingMesh.parent) {
        ceilingMesh.parent.remove(ceilingMesh);
        console.log('Ceiling removed in Scene 7');
      }
    } else if (ceilingMesh) {
      // Store reference for fade animation in other scenes
      ceilingMeshRef.current = ceilingMesh;
      
      // Ensure material supports transparency
      if (ceilingMesh.material) {
        const materials = Array.isArray(ceilingMesh.material) ? ceilingMesh.material : [ceilingMesh.material];
        materials.forEach(mat => {
          if (mat) {
            mat.transparent = true;
            mat.opacity = 1.0;
          }
        });
      }
    }
    
    // Make all meshes in the scene clickable
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.userData.clickable = isFreeMode;
        child.userData.hoverable = isFreeMode;
      }
    });
    
    return cloned;
  }, [scene, isFreeMode, currentScene]);
  
  useEffect(() => {
    if (currentScene === 7 && scene && groupRef.current) {
      console.log('=== Server Room Model Setup ===');
      console.log('Scene:', scene);
      console.log('Server room position:', serverRoomPosition);
      console.log('Server room scale:', serverRoomScale);
      console.log('Beam position:', beamPosition);
      console.log('Free mode:', isFreeMode);
    }
  }, [currentScene, scene, serverRoomPosition, serverRoomScale, isFreeMode]);
  
  // Early return AFTER all hooks are called
  // Show in Scene 7 or in free exploration mode
  if ((currentScene !== 7 && !isFreeMode) || !scene || !clonedScene) {
    return null;
  }
  
  if (!clonedScene) {
    return null;
  }
  
  return (
    <group 
      ref={groupRef} 
      position={serverRoomPosition} 
      scale={serverRoomScale}
      rotation={[0, Math.PI / 4, 0]} // Rotate 45 degrees around Y axis
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          userData={{ isDataCenter: true }}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

// All models that might be shown across different camera angles
function ExploreModels({ currentScene }) {
  // Maritime Terminal Models (Scene 4)
  // TODO: Uncomment when models are available
  // const terminalModel = useGLTF("assets/models/maritime-terminal.glb");
  // const shipsModel = useGLTF("assets/models/ships.glb");
  
  // Wind Turbine Models (Scene 5)
  // const turbinesModel = useGLTF("assets/models/wind-turbines.glb");
  
  // Data Center Models (Scene 7)
  // const dataCenterModel = useGLTF("assets/models/data-center.glb");
  
  // Synthesis Models (Scene 8) - All infrastructure visible
  // return (
  //   <group>
  //     {/* Maritime Terminal */}
  //     <primitive object={terminalModel.scene} />
  //     <primitive object={shipsModel.scene} />
  //     
  //     {/* Wind Turbines */}
  //     <primitive object={turbinesModel.scene} />
  //     
  //     {/* Data Center */}
  //     <primitive object={dataCenterModel.scene} />
  //   </group>
  // );
  
  return null; // Models not available yet
}

// Terrain 3D component for Scene 6
function Terrain3D({ terrainRef }) {
  const { scene } = useGLTF(MODELS.terrain3d);
  const groupRef = useRef();
  
  // Debug logging and visibility fixes
  useEffect(() => {
    if (scene && groupRef.current) {
      console.log('=== Terrain 3D Model Loaded ===');
      console.log('Scene:', scene);
      
      // Log all meshes in the model and ensure visibility
      let meshCount = 0;
      let totalVertices = 0;
      scene.traverse((child) => {
        if (child.isMesh) {
          meshCount++;
          const vertices = child.geometry?.attributes?.position?.count || 0;
          totalVertices += vertices;
          console.log(`Mesh ${meshCount}:`, {
            name: child.name,
            vertices: vertices,
            material: child.material?.name || 'unnamed',
            position: child.position,
            scale: child.scale,
            visible: child.visible
          });
          
          // Force visibility
          child.visible = true;
          
          // Ensure material is visible and properly configured
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat) {
                  mat.transparent = false;
                  mat.opacity = 1.0;
                  mat.visible = true;
                  // Ensure material has proper color
                  if (mat.color) {
                    mat.color.setRGB(1, 1, 1);
                  }
                }
              });
            } else {
              child.material.transparent = false;
              child.material.opacity = 1.0;
              child.material.visible = true;
              if (child.material.color) {
                child.material.color.setRGB(1, 1, 1);
              }
            }
          }
        }
      });
      
      console.log(`Total meshes: ${meshCount}, Total vertices: ${totalVertices.toLocaleString()}`);
      
      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(scene);
      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        console.log('Bounding box:', { center, size, min: box.min, max: box.max });
        
        // Center the model if needed
        if (Math.abs(center.x) > 0.1 || Math.abs(center.z) > 0.1) {
          console.log('Centering terrain model...');
          scene.position.set(-center.x, -center.y, -center.z);
        }
        
        // Check model size
        const maxDim = Math.max(size.x, size.y, size.z);
        console.log(`Max dimension: ${maxDim.toFixed(2)} units`);
        
        // Scale down if model is too large (terrain models are often in meters/km)
        // Scale to approximately 40 units to match scene scale
        if (maxDim > 100) {
          const scaleFactor = 40 / maxDim; // Target ~40 units max dimension
          console.log(`Scaling terrain model down by factor: ${scaleFactor.toFixed(6)}`);
          scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
          
          // Recalculate after scaling
          const newBox = new THREE.Box3().setFromObject(scene);
          const newSize = newBox.getSize(new THREE.Vector3());
          const newMaxDim = Math.max(newSize.x, newSize.y, newSize.z);
          console.log(`Scaled max dimension: ${newMaxDim.toFixed(2)} units`);
        } else if (maxDim < 0.1) {
          console.warn('Model is very small, might need scaling up');
        }
      } else {
        console.warn('Bounding box is empty - model might not have geometry');
      }
      
      // Ensure group is visible
      groupRef.current.visible = true;
    }
  }, [scene]);
  
  // Set terrainRef to the group so ClickableTerrainTile can use it
  useEffect(() => {
    if (terrainRef && groupRef.current) {
      terrainRef.current = groupRef.current;
    }
  }, [terrainRef]);
  
  if (!scene) {
    console.warn('Terrain3D: Scene not loaded yet');
    return null;
  }
  
  return (
    <group ref={groupRef} visible={true}>
      <primitive object={scene.clone()} />
    </group>
  );
}

export function ExploreEnvironment({ textureRotation = 0 }) {
  const terrainRef = useRef();
  const [currentScene, setCurrentScene] = useState(getCurrentExploreScene());
  const dataCenterModalOpenRef = useRef(false);
  const dataCenterCameraPositionRef = useRef(null);
  
  // Subscribe to scene changes
  useEffect(() => {
    const unsubscribe = subscribeToExploreScene((scene) => {
      setCurrentScene(scene);
    });
    return unsubscribe;
  }, []);
  
  // Initialize terrain height sampler once
  useEffect(() => {
    // Heightmap initialization removed
  }, []);
  
  // Monitor tile modal state to track when data center modal is open
  useEffect(() => {
    const checkModalState = () => {
      // Check if modal is open by subscribing to modal state
      const modalCheck = setInterval(() => {
        // We'll use a custom event or check the modal state
        // For now, we'll track it via the click handler
      }, 100);
      return () => clearInterval(modalCheck);
    };
    
    const unsubscribe = subscribeToExploreScene(() => {
      // Reset modal tracking on scene change
      dataCenterModalOpenRef.current = false;
      dataCenterCameraPositionRef.current = null;
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Handle terrain click to close modal
  const handleTerrainClick = (e) => {
    // Only close modal if clicking on terrain (not on data center model)
    if (e.object && !e.object.userData?.isDataCenter) {
      if (dataCenterModalOpenRef.current) {
        setTileModalOpen(false);
        dataCenterModalOpenRef.current = false;
        dataCenterCameraPositionRef.current = null;
      }
    }
  };
  
  // Monitor camera movement to close modal if user moves away
  useFrame((state) => {
    if (!dataCenterModalOpenRef.current || !dataCenterCameraPositionRef.current) return;
    if (!getFreeExplorationMode()) return;
    
    const { camera } = state;
    const currentPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
    const distance = currentPos.distanceTo(dataCenterCameraPositionRef.current);
    
    // If camera moved more than 0.5 units away, close the modal
    if (distance > 0.5) {
      setTileModalOpen(false);
      dataCenterModalOpenRef.current = false;
      dataCenterCameraPositionRef.current = null;
    }
  });
  
  // Check if we're on Scene 6
  const isScene6 = currentScene === 6;
  
  // Debug logging for scene changes
  useEffect(() => {
    console.log(`Current scene: ${currentScene}, Using terrain-3d: ${isScene6}`);
  }, [currentScene, isScene6]);
  
  
  return (
    <>
      {/* Camera Controls */}
      {/* Show free camera controls in free exploration mode, or when cinematic mode is off */}
      {(getFreeExplorationMode() || !isCinematicMode()) && <FreeCameraDragControls />}
      {/* Only show cinematic controller when not in free mode */}
      {!getFreeExplorationMode() && <CinematicCameraController />}
      {/* Update camera data for UI components */}
      <ExploreCameraDataUpdater />
      <CameraAnimator />
      <CameraPositionLogger />
      
      {/* Environment */}
      <SphereEnv />
      <Environment background={false} files={TEXTURES.envmapHdr} />
      
      {/* Camera - position will be controlled by CinematicCameraController */}
      {/* Initial position matches Scene 1, but will be overridden by CinematicCameraController */}
      {/* Set near plane to prevent seeing through terrain at minimum altitude (0.05 units = 5m) */}
      <PerspectiveCamera makeDefault position={[0, 3.5, 6.5]} fov={40} near={0.01} />
      
      {/* Terrain - the main 3D environment */}
      {/* Use regular terrain for all scenes (including Scene 6) */}
      <MountainRoadLandscape 
        ref={terrainRef} 
        textureRotation={textureRotation}
        onClick={handleTerrainClick}
      />
      
      {/* All Models - loaded once, visible from all camera angles */}
      <Suspense fallback={null}>
        <ExploreModels currentScene={currentScene} />
        <WindTurbineModel currentScene={currentScene} />
        <ServerRoomModel 
          currentScene={currentScene} 
          dataCenterModalOpenRef={dataCenterModalOpenRef}
          dataCenterCameraPositionRef={dataCenterCameraPositionRef}
        />
      </Suspense>
      
      {/* Cargo Ship at terrain level */}
      <Suspense fallback={null}>
        <CargoShip />
      </Suspense>
      
      {/* Satellites moving across the sphere */}
      <Satellites />
      
      {/* UI Elements */}
      {/* Only show LocationBeam in cinematic mode (NOT free exploration) and NOT in Scene 2, Scene 6, or Scene 7 */}
      {!getFreeExplorationMode() && currentScene !== 2 && currentScene !== 6 && currentScene !== 7 && <LocationBeam />}
      
      {/* Animated blue tile on Punta Arenas for Scene 2 (visible but not clickable) */}
      {!getFreeExplorationMode() && currentScene === 2 && (
        <AnimatedTile
          terrainGroupRef={terrainRef}
          tilePosition={[0, 0, -0.33]} // Punta Arenas position (same as Scene 2's clickable tile)
          squareSize={0.05}
        />
      )}
      <Compass />
      <CollisionDetector />
      
      {/* Clickable terrain tile - only show in free exploration mode */}
      {getFreeExplorationMode() && (
        <ClickableTerrainTile
          terrainGroupRef={terrainRef}
          tilePosition={[0, 0.0009, -0.33]}
          squareSize={0.05}
          cameraTarget={{
            position: [-0.072, 0.68, -1.175],
            rotation: { pitch: -0.6719, yaw: -2.876, roll: 0 }
          }}
          title="Punta Arenas"
          paragraph="Southern Chile's strategic logistics gateway and port city, playing a crucial role in global trade routes. Punta Arenas serves as a vital connection point between the Pacific and Atlantic oceans, facilitating international commerce and serving as a key hub for shipping between Asia, the Americas, and Europe. The city's strategic location provides easy access to the rest of continental Chile, making it an essential node in the country's transportation and logistics network."
          ctaText="Learn More"
          ctaUrl="https://www.cabonegro.cl/en/contact"
          tagText="Click Me"
          imageUrl="/punta-arenas.webp"
          imageLink="https://maps.app.goo.gl/pd6yvwQHaq3Y4hTV6"
        />
      )}
      
      {/* Lighting */}
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
      
      {/* Post-processing */}
      <EffectComposer>
        <MotionBlur />
        <HueSaturation
          blendFunction={BlendFunction.NORMAL}
          hue={-0.15}
          saturation={0.1}
        />
      </EffectComposer>
    </>
  );
}

// Preload models when available
// useGLTF.preload("assets/models/maritime-terminal.glb");
// useGLTF.preload("assets/models/ships.glb");
// useGLTF.preload("assets/models/wind-turbines.glb");
// useGLTF.preload("assets/models/data-center.glb");
useGLTF.preload(MODELS.terrain3d);
useGLTF.preload(MODELS.windTurbine);
useGLTF.preload(MODELS.serverRoom);

