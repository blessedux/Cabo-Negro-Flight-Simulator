import { useFrame, useThree } from '@react-three/fiber';
import { setExploreCameraData } from './ExploreAltitudeUI';

// Component that runs inside Canvas to update camera data for UI
export function ExploreCameraDataUpdater() {
  const { camera } = useThree();

  useFrame(() => {
    if (camera) {
      setExploreCameraData({
        position: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z
        }
      });
    }
  });

  return null;
}
