import React, { useState, useEffect, useRef } from 'react';
import { 
  getColorMappings, 
  addColorMapping, 
  removeColorMapping, 
  updateColorMapping,
  subscribeToColorMappings,
  loadColorMappings,
  TERRAIN_CATEGORIES
} from './colorHeightMapping';
import { TEXTURES } from './config/assets';

export function ColorHeightMapper() {
  const [mappings, setMappings] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [newHeight, setNewHeight] = useState(1.0);
  const [newTolerance, setNewTolerance] = useState(0.2);
  const [selectedCategory, setSelectedCategory] = useState('custom');
  const colorPickerCanvasRef = useRef(null);
  const [terrainTextureImage, setTerrainTextureImage] = useState(null);

  // Load terrain texture for color picking
  // Use high-res if available, otherwise low-res
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setTerrainTextureImage(img);
    };
    img.onerror = () => {
      console.error('Failed to load terrain texture for color picking');
      // Fallback to low-res if high-res fails
      if (TEXTURES.terrainTexture !== TEXTURES.terrainTextureLow) {
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.onload = () => setTerrainTextureImage(fallbackImg);
        fallbackImg.src = TEXTURES.terrainTextureLow;
      }
    };
    // Try high-res first if available
    img.src = TEXTURES.terrainTexture;
  }, []);

  // Subscribe to mapping changes
  useEffect(() => {
    // Load initial mappings
    loadColorMappings();
    setMappings(getColorMappings());

    // Subscribe to changes
    const unsubscribe = subscribeToColorMappings((updatedMappings) => {
      setMappings(updatedMappings);
    });

    return unsubscribe;
  }, []);

  // Handle color picking from canvas
  const handleCanvasClick = (e) => {
    if (!isPickingColor || !colorPickerCanvasRef.current || !terrainTextureImage) return;

    const canvas = colorPickerCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b] = imageData.data;

    setSelectedColor({ r, g, b });
    setIsPickingColor(false);
  };

  // Setup color picker canvas
  useEffect(() => {
    if (terrainTextureImage && colorPickerCanvasRef.current) {
      const canvas = colorPickerCanvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      const maxSize = 300;
      const aspectRatio = terrainTextureImage.width / terrainTextureImage.height;
      if (aspectRatio > 1) {
        canvas.width = maxSize;
        canvas.height = maxSize / aspectRatio;
      } else {
        canvas.height = maxSize;
        canvas.width = maxSize * aspectRatio;
      }

      ctx.drawImage(terrainTextureImage, 0, 0, canvas.width, canvas.height);
    }
  }, [terrainTextureImage]);

  const handleAddMapping = () => {
    if (selectedColor) {
      const category = TERRAIN_CATEGORIES[selectedCategory.toUpperCase()];
      const defaultHeight = category ? category.defaultHeight : 1.0;
      const defaultTolerance = category ? category.defaultTolerance : 0.2;
      
      addColorMapping(
        selectedColor.r, 
        selectedColor.g, 
        selectedColor.b, 
        newHeight || defaultHeight, 
        newTolerance || defaultTolerance,
        selectedCategory,
        ''
      );
      setSelectedColor(null);
      setNewHeight(defaultHeight);
      setNewTolerance(defaultTolerance);
    }
  };

  const handleRemoveMapping = (id) => {
    removeColorMapping(id);
  };

  const handleUpdateHeight = (id, height) => {
    updateColorMapping(id, { height });
  };

  const handleUpdateTolerance = (id, tolerance) => {
    updateColorMapping(id, { tolerance });
  };

  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <label
          style={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Color-Height Mapping
        </label>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '12px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Color Picker */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <label
              style={{
                color: '#ffffff',
                fontSize: '12px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Pick Color from Terrain:
            </label>
            {terrainTextureImage && (
              <div style={{ position: 'relative' }}>
                <canvas
                  ref={colorPickerCanvasRef}
                  onClick={handleCanvasClick}
                  style={{
                    width: '100%',
                    height: 'auto',
                    cursor: isPickingColor ? 'crosshair' : 'pointer',
                    border: isPickingColor ? '2px solid #64ff64' : '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={() => {
                    if (!isPickingColor) {
                      colorPickerCanvasRef.current.style.cursor = 'pointer';
                    }
                  }}
                />
                {isPickingColor && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      color: '#64ff64',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  >
                    Click to pick color
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setIsPickingColor(!isPickingColor)}
              style={{
                padding: '6px 12px',
                background: isPickingColor ? 'rgba(100, 255, 100, 0.3)' : 'rgba(100, 150, 255, 0.3)',
                border: `1px solid ${isPickingColor ? '#64ff64' : 'rgba(255, 255, 255, 0.3)'}`,
                borderRadius: '4px',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {isPickingColor ? 'Cancel Picking' : 'Start Picking Color'}
            </button>

            {/* Selected Color Display */}
            {selectedColor && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    background: `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '4px',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#ffffff', fontSize: '11px', fontFamily: 'monospace' }}>
                    RGB: ({selectedColor.r}, {selectedColor.g}, {selectedColor.b})
                  </div>
                  <div style={{ color: '#ffffff', fontSize: '11px', fontFamily: 'monospace' }}>
                    Hex: {rgbToHex(selectedColor.r, selectedColor.g, selectedColor.b)}
                  </div>
                </div>
              </div>
            )}

            {/* Add Mapping Controls */}
            {selectedColor && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '8px',
                  background: 'rgba(100, 150, 255, 0.1)',
                  borderRadius: '4px',
                }}
              >
                {/* Category Selection */}
                <div>
                  <label
                    style={{
                      color: '#ffffff',
                      fontSize: '11px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Terrain Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      const category = TERRAIN_CATEGORIES[e.target.value.toUpperCase()];
                      if (category) {
                        setNewHeight(category.defaultHeight);
                        setNewTolerance(category.defaultTolerance);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '6px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  >
                    {Object.values(TERRAIN_CATEGORIES).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      color: '#ffffff',
                      fontSize: '11px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Height: {newHeight.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="-2"
                    max="5"
                    step="0.1"
                    value={newHeight}
                    onChange={(e) => setNewHeight(parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      height: '4px',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      color: '#ffffff',
                      fontSize: '11px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Color Tolerance: {newTolerance.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.5"
                    step="0.05"
                    value={newTolerance}
                    onChange={(e) => setNewTolerance(parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      height: '4px',
                    }}
                  />
                </div>
                <button
                  onClick={handleAddMapping}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(100, 255, 100, 0.3)',
                    border: '1px solid #64ff64',
                    borderRadius: '4px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                >
                  Add Mapping
                </button>
              </div>
            )}
          </div>

          {/* Existing Mappings List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            <label
              style={{
                color: '#ffffff',
                fontSize: '12px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Active Mappings ({mappings.length}):
            </label>
            {mappings.length === 0 ? (
              <div
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '11px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontStyle: 'italic',
                }}
              >
                No mappings yet. Pick a color above to create one.
              </div>
            ) : (
              mappings.map((mapping) => (
                <div
                  key={mapping.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      background: `rgb(${mapping.r}, ${mapping.g}, ${mapping.b})`,
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '3px',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          background: TERRAIN_CATEGORIES[mapping.category?.toUpperCase()]?.color || '#9C27B0',
                          borderRadius: '50%',
                        }}
                      />
                      <div style={{ color: '#ffffff', fontSize: '10px', fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: '500' }}>
                        {mapping.name || TERRAIN_CATEGORIES[mapping.category?.toUpperCase()]?.name || 'Custom'}
                      </div>
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '9px', fontFamily: 'monospace' }}>
                      RGB: ({mapping.r}, {mapping.g}, {mapping.b})
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '4px' }}>
                      <input
                        type="range"
                        min="-2"
                        max="5"
                        step="0.1"
                        value={mapping.height}
                        onChange={(e) => handleUpdateHeight(mapping.id, parseFloat(e.target.value))}
                        style={{ flex: 1, height: '3px' }}
                      />
                      <span style={{ color: '#ffffff', fontSize: '10px', minWidth: '40px' }}>
                        {mapping.height.toFixed(1)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '9px' }}>Tol:</span>
                      <input
                        type="range"
                        min="0.05"
                        max="0.5"
                        step="0.05"
                        value={mapping.tolerance}
                        onChange={(e) => handleUpdateTolerance(mapping.id, parseFloat(e.target.value))}
                        style={{ flex: 1, height: '3px' }}
                      />
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '9px', minWidth: '30px' }}>
                        {mapping.tolerance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMapping(mapping.id)}
                    style={{
                      padding: '4px 8px',
                      background: 'rgba(255, 100, 100, 0.3)',
                      border: '1px solid rgba(255, 100, 100, 0.5)',
                      borderRadius: '4px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
