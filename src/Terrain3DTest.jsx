import React, { useEffect, useRef, Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, Environment, useGLTF } from "@react-three/drei";
import { EffectComposer, HueSaturation } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { SphereEnv } from "./SphereEnv";
import { MotionBlur } from "./MotionBlur";
import { FreeCameraDragControls } from "./FreeCameraDragControls";
import { Compass } from "./Compass";
import { CollisionDetector } from "./CollisionDetector";
import * as THREE from "three";

// Terrain 3D component
function Terrain3DModel() {
  const { scene } = useGLTF("/assets/textures/terrain-3d.glb");
  const groupRef = useRef();
  
  // Debug logging and scaling
  useEffect(() => {
    if (scene && groupRef.current) {
      console.log('=== Terrain 3D Model Loaded ===');
      console.log('Scene:', scene);
      
      // Log all meshes in the model
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
          
          // Ensure mesh is visible
          child.visible = true;
          
          // Make sure material is visible and has proper settings
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat) {
                  mat.transparent = false;
                  mat.opacity = 1.0;
                  mat.visible = true;
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
      
      // Calculate bounding box BEFORE any transformations
      const box = new THREE.Box3().setFromObject(scene);
      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        console.log('Original bounding box:', { center, size, min: box.min, max: box.max });
        console.log(`Original max dimension: ${maxDim.toFixed(2)} units`);
        
        // Scale down if model is too large (40,000 units = 40km, way too big!)
        // Scale to approximately 40 units to match scene scale
        if (maxDim > 100) {
          const scaleFactor = 40 / maxDim; // Target ~40 units max dimension
          console.log(`Scaling model down by factor: ${scaleFactor.toFixed(6)}`);
          
          // Apply scale to the group, not the scene directly
          groupRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
          
          // Center the model after scaling
          const scaledCenter = center.clone().multiplyScalar(scaleFactor);
          groupRef.current.position.set(-scaledCenter.x, -scaledCenter.y, -scaledCenter.z);
          
          // Recalculate bounding box after scaling
          const newBox = new THREE.Box3().setFromObject(groupRef.current);
          const newSize = newBox.getSize(new THREE.Vector3());
          const newMaxDim = Math.max(newSize.x, newSize.y, newSize.z);
          console.log(`Scaled max dimension: ${newMaxDim.toFixed(2)} units`);
          console.log(`Group position:`, groupRef.current.position);
          console.log(`Group scale:`, groupRef.current.scale);
        } else {
          // Just center if size is reasonable
          groupRef.current.position.set(-center.x, -center.y, -center.z);
        }
      } else {
        console.warn('Bounding box is empty - model might not have geometry');
      }
      
      // Ensure group is visible
      groupRef.current.visible = true;
    }
  }, [scene]);
  
  if (!scene) {
    console.warn('Terrain3DModel: Scene not loaded yet');
    return null;
  }
  
  return (
    <group ref={groupRef} visible={true}>
      <primitive object={scene.clone()} />
    </group>
  );
}

export function Terrain3DTest() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1000,
        color: 'white',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Terrain 3D GLB Test</h2>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>Use mouse to orbit around the model</p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>Scroll to zoom in/out</p>
        <p style={{ margin: '5px 0', fontSize: '14px', color: '#888' }}>Check console for model details</p>
      </div>
      
      <Canvas 
        shadows
        gl={{
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
      >
        <Suspense fallback={null}>
          <FreeCameraDragControls />
          <SphereEnv />
          <Environment background={false} files={"/assets/textures/envmap.hdr"} />
          
          <PerspectiveCamera makeDefault position={[0, 20, 40]} fov={50} />
          
          {/* Terrain 3D Model */}
          <Terrain3DModel />
          
          <Compass />
          <CollisionDetector />
          
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
            shadow-camera-far={100}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
            shadow-camera-left={-50}
            shadow-camera-right={50}
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
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload("/assets/textures/terrain-3d.glb");

