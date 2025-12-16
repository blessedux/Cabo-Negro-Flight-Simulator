# Map Rendering Analysis

## Overview
The map/landscape is rendered through the `Landscape` component located in `src/Landscape.jsx`. It's a React Three Fiber component that loads and displays a 3D GLTF model.

## Component Structure

### Main Component: `Landscape.jsx`
- **Location**: `src/Landscape.jsx`
- **Model File**: `assets/models/scene.glb`
- **Loading Method**: Uses `useGLTF` hook from `@react-three/drei`

### Integration in App
The Landscape component is imported and rendered in `App.jsx` (line 19):
```jsx
<Landscape />
```

## Map Components Breakdown

The landscape consists of 5 main parts:

### 1. **Main Landscape Mesh**
- **Geometry**: `nodes.landscape_gltf.geometry`
- **Material**: `materials["Material.009"]`
- **Properties**: 
  - `envMapIntensity: 0.75` (set in useEffect)
  - `castShadow: true`
  - `receiveShadow: true`

### 2. **Landscape Borders**
- **Geometry**: `nodes.landscape_borders.geometry`
- **Material**: `materials["Material.010"]`
- **Purpose**: Defines the boundaries of the map

### 3. **Trees**
- **Geometry**: `nodes.trees_light.geometry`
- **Material**: `materials["Material.008"]`
- **Customization**:
  - Color: `#2f2f13`
  - `envMapIntensity: 0.3`
  - `roughness: 1`
  - `metalness: 0`
- **Properties**: `castShadow: true`, `receiveShadow: true`

### 4. **Water Planes** (3 separate water bodies)
Three separate plane geometries with `MeshReflectorMaterial`:
- **Position 1**: `[-2.536, 1.272, 0.79]`, Scale: `[1.285, 1.285, 1]`
- **Position 2**: `[1.729, 0.943, 2.709]`, Scale: `[3, 3, 1]`
- **Position 3**: `[0.415, 1.588, -2.275]`, Scale: `[3.105, 2.405, 1]`
- **Material Properties**:
  - `transparent: true`
  - `opacity: 0.6`
  - `color: "#23281b"`
  - `roughness: 0`
  - `blur: [10, 10]`
  - `mixStrength: 20`
  - `resolution: 512`

### 5. **Lights**
- **Geometry**: `nodes.lights.geometry`
- **Material**: Custom `MeshStandardMaterial` (created in useMemo)
- **Properties**:
  - Color: `#ea6619`
  - Emissive: `#f6390f` (multiplied by 1)
  - `roughness: 0`
  - `metalness: 0`
  - `envMapIntensity: 0`

## Material Customization

### Materials Modified in useEffect:
1. **Material.009** (Landscape): `envMapIntensity = 0.75`
2. **Material.008** (Trees): Color, envMapIntensity, roughness, metalness

### Materials Created in useMemo:
1. **lightsMaterial**: Custom `MeshStandardMaterial` for lights
2. **waterMaterial**: `MeshReflectorMaterial` for water reflections

## Dependencies

- **@react-three/drei**: For `useGLTF` and `MeshReflectorMaterial`
- **three**: For `Color`, `MeshStandardMaterial`
- **React**: For hooks (`useEffect`, `useMemo`)

## How to Replace the Map

### Option 1: Replace the GLTF Model
1. Replace `public/assets/models/scene.glb` with your new model file
2. Ensure the new model has the same node structure (or update the component accordingly)
3. Update material names if they differ

### Option 2: Create a New Landscape Component
1. Create a new component file (e.g., `NewLandscape.jsx`)
2. Load your new model or create geometry procedurally
3. Replace `<Landscape />` with `<NewLandscape />` in `App.jsx`

### Option 3: Modify Existing Component
1. Update the model path in `useGLTF("assets/models/scene.glb")`
2. Adjust node references based on your new model's structure
3. Modify materials and geometry as needed

## Important Notes

- The model is preloaded: `useGLTF.preload("assets/models/scene.glb")`
- The component uses `dispose={null}` to prevent automatic cleanup
- All meshes are wrapped in a `<group>` element
- The landscape interacts with shadows (cast/receive)
- Water uses reflection material for realistic water effects

## Related Components

- **App.jsx**: Main scene that includes Landscape
- **Airplane.jsx**: Flies over the landscape (uses `planePosition`)
- **Targets.jsx**: Targets positioned relative to the landscape
- **SphereEnv.jsx**: Environment sphere for lighting
- **MotionBlur.jsx**: Post-processing effect

