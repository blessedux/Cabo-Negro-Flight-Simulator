// This component is now just a data updater inside the Canvas
// The actual UI is rendered outside in CameraPositionLoggerUI
import { useFrame, useThree } from '@react-three/fiber';
import { Euler } from 'three';
import { cameraData } from './FreeCameraDragControls';

export function CameraPositionLogger() {
  const { camera } = useThree();

  useFrame(() => {
    // Always update exported camera data from the actual camera
    // This ensures the UI outside Canvas always has the latest camera state
    cameraData.position = {
      x: parseFloat(camera.position.x.toFixed(3)),
      y: parseFloat(camera.position.y.toFixed(3)),
      z: parseFloat(camera.position.z.toFixed(3)),
    };

    // Update rotation (Euler angles)
    const euler = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    cameraData.rotation = {
      pitch: parseFloat(euler.x.toFixed(4)),
      yaw: parseFloat(euler.y.toFixed(4)),
      roll: parseFloat(euler.z.toFixed(4)),
    };
  });

  return null; // This component doesn't render anything
}
