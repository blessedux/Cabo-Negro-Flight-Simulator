// Color-height mapping system for terrain
// Allows users to select colors from terrain texture and assign specific heights

// Color mapping structure: { id, r, g, b, height, tolerance, category, name }
// tolerance is the color matching threshold (0-1)
// category: 'water', 'valley', 'foothill', 'mountain', 'peak', 'cloud', 'custom'
// name: optional descriptive name

let colorMappings = [];
let colorMappingsListeners = [];

// Terrain categories for Andes modeling
export const TERRAIN_CATEGORIES = {
  WATER: { id: 'water', name: 'Water', color: '#4A90E2', defaultHeight: -0.5, defaultTolerance: 0.15 },
  VALLEY: { id: 'valley', name: 'Valley', color: '#7CB342', defaultHeight: 0.2, defaultTolerance: 0.2 },
  FOOTHILL: { id: 'foothill', name: 'Foothills', color: '#8D6E63', defaultHeight: 0.8, defaultTolerance: 0.2 },
  MOUNTAIN: { id: 'mountain', name: 'Mountains', color: '#9E9E9E', defaultHeight: 1.5, defaultTolerance: 0.2 },
  PEAK: { id: 'peak', name: 'Peaks', color: '#FFFFFF', defaultHeight: 2.5, defaultTolerance: 0.15 },
  CLOUD: { id: 'cloud', name: 'Clouds', color: '#E0E0E0', defaultHeight: 1.8, defaultTolerance: 0.1 },
  CUSTOM: { id: 'custom', name: 'Custom', color: '#9C27B0', defaultHeight: 1.0, defaultTolerance: 0.2 },
};

// Load mappings from localStorage
export function loadColorMappings() {
  try {
    const stored = localStorage.getItem('terrainColorMappings');
    if (stored) {
      colorMappings = JSON.parse(stored);
      notifyListeners();
      return colorMappings;
    }
  } catch (error) {
    console.error('Failed to load color mappings:', error);
  }
  return [];
}

// Save mappings to localStorage
export function saveColorMappings(mappings) {
  try {
    colorMappings = mappings;
    localStorage.setItem('terrainColorMappings', JSON.stringify(mappings));
    notifyListeners();
  } catch (error) {
    console.error('Failed to save color mappings:', error);
  }
}

// Get current mappings
export function getColorMappings() {
  return [...colorMappings];
}

// Add a color mapping
export function addColorMapping(r, g, b, height, tolerance = 0.2, category = 'custom', name = '') {
  const newMapping = {
    id: Date.now() + Math.random(), // Unique ID
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b),
    height: height,
    tolerance: tolerance,
    category: category,
    name: name || (() => {
      const catKey = Object.keys(TERRAIN_CATEGORIES).find(k => TERRAIN_CATEGORIES[k].id === category);
      const catName = catKey ? TERRAIN_CATEGORIES[catKey].name : 'Custom';
      const count = colorMappings.filter(m => m.category === category).length + 1;
      return `${catName} ${count}`;
    })()
  };
  
  const updated = [...colorMappings, newMapping];
  saveColorMappings(updated);
  return newMapping;
}

// Add multiple mappings from a preset
export function addPresetMappings(presetName) {
  const presets = getPresetMappings();
  const preset = presets[presetName];
  if (!preset) return [];

  const added = [];
  preset.forEach(({ r, g, b, height, tolerance, category, name }) => {
    const mapping = addColorMapping(r, g, b, height, tolerance, category, name);
    added.push(mapping);
  });
  return added;
}

// Get preset mappings for Andes terrain
export function getPresetMappings() {
  return {
    'andes-basic': [
      // Water (blue tones)
      { r: 50, g: 100, b: 200, height: -0.5, tolerance: 0.2, category: 'water', name: 'Deep Water' },
      { r: 100, g: 150, b: 220, height: -0.3, tolerance: 0.2, category: 'water', name: 'Shallow Water' },
      
      // Valleys (green tones)
      { r: 50, g: 120, b: 50, height: 0.1, tolerance: 0.25, category: 'valley', name: 'Low Valley' },
      { r: 80, g: 150, b: 80, height: 0.3, tolerance: 0.25, category: 'valley', name: 'Valley Floor' },
      
      // Foothills (brown/earth tones)
      { r: 120, g: 100, b: 80, height: 0.6, tolerance: 0.2, category: 'foothill', name: 'Lower Foothills' },
      { r: 140, g: 110, b: 90, height: 0.9, tolerance: 0.2, category: 'foothill', name: 'Upper Foothills' },
      
      // Mountains (gray/rock tones)
      { r: 120, g: 120, b: 120, height: 1.2, tolerance: 0.2, category: 'mountain', name: 'Lower Mountains' },
      { r: 150, g: 150, b: 150, height: 1.8, tolerance: 0.2, category: 'mountain', name: 'Mid Mountains' },
      { r: 180, g: 180, b: 180, height: 2.2, tolerance: 0.2, category: 'mountain', name: 'Upper Mountains' },
      
      // Peaks (white/light gray)
      { r: 220, g: 220, b: 220, height: 2.8, tolerance: 0.15, category: 'peak', name: 'Mountain Peaks' },
      { r: 240, g: 240, b: 240, height: 3.2, tolerance: 0.1, category: 'peak', name: 'Snow Peaks' },
      
      // Clouds (very light/white)
      { r: 250, g: 250, b: 250, height: 1.5, tolerance: 0.08, category: 'cloud', name: 'Clouds' },
    ],
    'andes-detailed': [
      // More detailed preset with more color variations
      // Water variations
      { r: 30, g: 80, b: 180, height: -0.6, tolerance: 0.15, category: 'water', name: 'Deep Ocean' },
      { r: 60, g: 120, b: 210, height: -0.4, tolerance: 0.18, category: 'water', name: 'Coastal Water' },
      { r: 90, g: 140, b: 230, height: -0.2, tolerance: 0.2, category: 'water', name: 'Shallow Water' },
      
      // Valley variations
      { r: 40, g: 100, b: 40, height: 0.0, tolerance: 0.25, category: 'valley', name: 'River Valley' },
      { r: 60, g: 130, b: 60, height: 0.2, tolerance: 0.25, category: 'valley', name: 'Grassland Valley' },
      { r: 80, g: 160, b: 80, height: 0.4, tolerance: 0.25, category: 'valley', name: 'Forested Valley' },
      
      // Foothill variations
      { r: 100, g: 85, b: 70, height: 0.5, tolerance: 0.2, category: 'foothill', name: 'Low Foothills' },
      { r: 130, g: 105, b: 85, height: 0.7, tolerance: 0.2, category: 'foothill', name: 'Mid Foothills' },
      { r: 150, g: 120, b: 100, height: 0.9, tolerance: 0.2, category: 'foothill', name: 'High Foothills' },
      
      // Mountain variations
      { r: 100, g: 100, b: 100, height: 1.0, tolerance: 0.2, category: 'mountain', name: 'Mountain Base' },
      { r: 130, g: 130, b: 130, height: 1.5, tolerance: 0.2, category: 'mountain', name: 'Lower Slopes' },
      { r: 160, g: 160, b: 160, height: 2.0, tolerance: 0.2, category: 'mountain', name: 'Mid Slopes' },
      { r: 190, g: 190, b: 190, height: 2.5, tolerance: 0.2, category: 'mountain', name: 'Upper Slopes' },
      
      // Peak variations
      { r: 200, g: 200, b: 200, height: 2.8, tolerance: 0.15, category: 'peak', name: 'Rocky Peaks' },
      { r: 230, g: 230, b: 230, height: 3.0, tolerance: 0.12, category: 'peak', name: 'Snow Line' },
      { r: 250, g: 250, b: 250, height: 3.5, tolerance: 0.08, category: 'peak', name: 'Snow Peaks' },
    ]
  };
}

// Remove a color mapping
export function removeColorMapping(id) {
  const updated = colorMappings.filter(m => m.id !== id);
  saveColorMappings(updated);
}

// Update a color mapping
export function updateColorMapping(id, updates) {
  const updated = colorMappings.map(m => 
    m.id === id ? { ...m, ...updates } : m
  );
  saveColorMappings(updated);
}

// Calculate color distance (Euclidean distance in RGB space)
function colorDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Normalize color distance to 0-1 range (max distance is sqrt(3 * 255^2))
const MAX_COLOR_DISTANCE = Math.sqrt(3 * 255 * 255);

// Check if a color matches a mapping
function colorMatches(r, g, b, mapping) {
  const distance = colorDistance(r, g, b, mapping.r, mapping.g, mapping.b);
  const normalizedDistance = distance / MAX_COLOR_DISTANCE;
  return normalizedDistance <= mapping.tolerance;
}

// Get height for a color based on mappings
export function getHeightForColor(r, g, b, baseHeightScale = 5.0, exaggeration = 1.0) {
  // Check all mappings in order (first match wins)
  for (const mapping of colorMappings) {
    if (colorMatches(r, g, b, mapping)) {
      // Apply base scale and exaggeration
      return mapping.height * baseHeightScale * exaggeration;
    }
  }
  
  // No match found - return null to use default calculation
  return null;
}

// Subscribe to mapping changes
export function subscribeToColorMappings(callback) {
  colorMappingsListeners.push(callback);
  return () => {
    colorMappingsListeners = colorMappingsListeners.filter(cb => cb !== callback);
  };
}

// Notify all listeners of changes
function notifyListeners() {
  colorMappingsListeners.forEach(callback => {
    try {
      callback([...colorMappings]);
    } catch (error) {
      console.error('Error in color mapping listener:', error);
    }
  });
}

// Initialize on load
if (typeof window !== 'undefined') {
  loadColorMappings();
}
