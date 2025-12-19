import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Euler, Vector3 } from 'three';

export function CameraAngleLogger({ enabled = true, logInterval = 1000 }) {
  const frameCount = useRef(0);
  const lastLogTime = useRef(0);

  useFrame(({ camera }) => {
    if (!enabled) return;

    frameCount.current++;
    const now = Date.now();

    // Log every logInterval milliseconds
    if (now - lastLogTime.current >= logInterval) {
      // Get camera position
      const position = camera.position;
      
      // Get camera rotation from quaternion
      const euler = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
      
      // Calculate camera angles in degrees
      const pitchDeg = (euler.x * 180) / Math.PI;
      const yawDeg = (euler.y * 180) / Math.PI;
      const rollDeg = (euler.z * 180) / Math.PI;
      
      // Calculate forward direction
      const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      
      console.log('📷 CAMERA INFO:', {
        position: {
          x: position.x.toFixed(3),
          y: position.y.toFixed(3),
          z: position.z.toFixed(3),
        },
        rotation: {
          pitch: pitchDeg.toFixed(2) + '°',
          yaw: yawDeg.toFixed(2) + '°',
          roll: rollDeg.toFixed(2) + '°',
        },
        rotationRadians: {
          pitch: euler.x.toFixed(4),
          yaw: euler.y.toFixed(4),
          roll: euler.z.toFixed(4),
        },
        forward: {
          x: forward.x.toFixed(3),
          y: forward.y.toFixed(3),
          z: forward.z.toFixed(3),
        },
        fov: camera.fov,
      });
      
      lastLogTime.current = now;
    }
  });

  return null;
}
