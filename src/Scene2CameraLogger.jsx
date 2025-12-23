import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Euler } from 'three';
import { getCurrentExploreScene } from './SceneNavigator';

// Component to log camera position for Scene 2 (Punta Arenas) when 'L' key is pressed
export function Scene2CameraLogger() {
  const { camera } = useThree();

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Press 'L' key to log camera position (only when on Scene 2)
      if (event.key === 'L' || event.key === 'l') {
        const currentScene = getCurrentExploreScene();
        if (currentScene === 2) {
          const position = camera.position;
          const euler = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
          
          console.log('📷 SCENE 2 CAMERA CONFIG (Punta Arenas):');
          console.log('📍 Current Position:', {
            x: position.x.toFixed(3),
            y: position.y.toFixed(3),
            z: position.z.toFixed(3),
          });
          console.log('🔄 Current Rotation:', {
            pitch: euler.x.toFixed(4),
            yaw: euler.y.toFixed(4),
            roll: euler.z.toFixed(4),
          });
          console.log('📐 FOV:', camera.fov);
          
          console.log('📋 Copy this to cinematicScenes.js Scene 2:');
          console.log(`camera: {
  position: [${position.x.toFixed(3)}, ${position.y.toFixed(3)}, ${position.z.toFixed(3)}],
  rotation: { pitch: ${euler.x.toFixed(4)}, yaw: ${euler.y.toFixed(4)}, roll: ${euler.z.toFixed(4)} },
  fov: ${camera.fov}
}`);
          
          // Also log as JSON for easy copy
          const cameraConfig = {
            position: [parseFloat(position.x.toFixed(3)), parseFloat(position.y.toFixed(3)), parseFloat(position.z.toFixed(3))],
            rotation: {
              pitch: parseFloat(euler.x.toFixed(4)),
              yaw: parseFloat(euler.y.toFixed(4)),
              roll: parseFloat(euler.z.toFixed(4))
            },
            fov: camera.fov
          };
          console.log('📦 JSON format:', JSON.stringify(cameraConfig, null, 2));
        } else {
          console.log('⚠️ Scene 2 camera logger only works when on Scene 2 (Punta Arenas)');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [camera]);

  return null;
}

