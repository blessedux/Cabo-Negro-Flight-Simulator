import { useTexture } from "@react-three/drei";
import { BackSide, SRGBColorSpace } from "three";
import { TEXTURES } from "./config/assets";

export function SphereEnv() {
  const map = useTexture(TEXTURES.envmapJpg);
  
  // Fix deprecation: use colorSpace instead of encoding
  if (map) {
    map.colorSpace = SRGBColorSpace;
  }

  // Terrain size is 34.55 units (3.455 km * 0.01 scene scale)
  // Set sphere radius to match terrain diameter (~18 units)
  const SPHERE_RADIUS = 18;
  
  return <mesh>
    <sphereGeometry args={[SPHERE_RADIUS, 50, 50]} />
    <meshBasicMaterial 
      side={BackSide}
      map={map}
    />
  </mesh>
}