import React, { useState, useEffect } from 'react';
import { 
  getColorMappings, 
  addColorMapping, 
  removeColorMapping, 
  updateColorMapping,
  subscribeToColorMappings,
  loadColorMappings,
  addPresetMappings,
  getPresetMappings,
  TERRAIN_CATEGORIES
} from './colorHeightMapping';
import { ColorHeightMapper } from './ColorHeightMapper';

export function AdvancedTerrainControls() {
  const [mappings, setMappings] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPresets, setShowPresets] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadColorMappings();
    setMappings(getColorMappings());

    const unsubscribe = subscribeToColorMappings((updatedMappings) => {
      setMappings(updatedMappings);
    });

    return unsubscribe;
  }, []);

  const handleApplyPreset = (presetName) => {
    const added = addPresetMappings(presetName);
    if (added.length > 0) {
      alert(`Applied preset "${presetName}" with ${added.length} terrain mappings!`);
    }
  };

  const handleClearCategory = (category) => {
    if (confirm(`Remove all ${TERRAIN_CATEGORIES[category.toUpperCase()]?.name || category} mappings?`)) {
      const toRemove = mappings.filter(m => m.category === category);
      toRemove.forEach(m => removeColorMapping(m.id));
    }
  };

  const handleClearAll = () => {
    if (confirm('Remove all terrain mappings? This cannot be undone.')) {
      mappings.forEach(m => removeColorMapping(m.id));
    }
  };

  const filteredMappings = selectedCategory === 'all' 
    ? mappings 
    : mappings.filter(m => m.category === selectedCategory);

  const categoryCounts = Object.keys(TERRAIN_CATEGORIES).reduce((acc, key) => {
    const catId = TERRAIN_CATEGORIES[key].id;
    acc[catId] = mappings.filter(m => m.category === catId).length;
    return acc;
  }, {});

  const presets = getPresetMappings();

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
            fontSize: '16px',
            fontWeight: '600',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Advanced Terrain Modeling
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
            gap: '16px',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Preset Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
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
                Andes Terrain Presets
              </label>
              <button
                onClick={() => setShowPresets(!showPresets)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {showPresets ? 'Hide' : 'Show'} Presets
              </button>
            </div>

            {showPresets && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px',
                }}
              >
                {Object.keys(presets).map((presetName) => (
                  <div
                    key={presetName}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      background: 'rgba(100, 150, 255, 0.1)',
                      borderRadius: '4px',
                      border: '1px solid rgba(100, 150, 255, 0.3)',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: '500',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          textTransform: 'capitalize',
                        }}
                      >
                        {presetName.replace(/-/g, ' ')}
                      </div>
                      <div
                        style={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '10px',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                        }}
                      >
                        {presets[presetName].length} terrain types
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyPreset(presetName)}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(100, 255, 100, 0.3)',
                        border: '1px solid #64ff64',
                        borderRadius: '4px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                      }}
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Filter */}
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
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Filter by Category
            </label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
              }}
            >
              <button
                onClick={() => setSelectedCategory('all')}
                style={{
                  padding: '6px 12px',
                  background: selectedCategory === 'all' ? 'rgba(100, 150, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                  border: `1px solid ${selectedCategory === 'all' ? '#6496ff' : 'rgba(255, 255, 255, 0.2)'}`,
                  borderRadius: '4px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                All ({mappings.length})
              </button>
              {Object.values(TERRAIN_CATEGORIES).map((category) => {
                const count = categoryCounts[category.id] || 0;
                if (count === 0 && selectedCategory !== category.id) return null;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    style={{
                      padding: '6px 12px',
                      background: selectedCategory === category.id ? category.color + '80' : 'rgba(255, 255, 255, 0.1)',
                      border: `1px solid ${selectedCategory === category.id ? category.color : 'rgba(255, 255, 255, 0.2)'}`,
                      borderRadius: '4px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        background: category.color,
                        borderRadius: '50%',
                      }}
                    />
                    {category.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Management */}
          {selectedCategory !== 'all' && categoryCounts[selectedCategory] > 0 && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                padding: '8px',
                background: 'rgba(255, 100, 100, 0.1)',
                borderRadius: '4px',
                border: '1px solid rgba(255, 100, 100, 0.3)',
              }}
            >
              <button
                onClick={() => handleClearCategory(selectedCategory)}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(255, 100, 100, 0.3)',
                  border: '1px solid rgba(255, 100, 100, 0.5)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  flex: 1,
                }}
              >
                Clear {TERRAIN_CATEGORIES[selectedCategory.toUpperCase()]?.name || selectedCategory}
              </button>
            </div>
          )}

          {/* Bulk Operations */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '6px',
            }}
          >
            <label
              style={{
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '500',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Bulk Operations
            </label>
            <div
              style={{
                display: 'flex',
                gap: '8px',
              }}
            >
              <button
                onClick={handleClearAll}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 100, 100, 0.3)',
                  border: '1px solid rgba(255, 100, 100, 0.5)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  flex: 1,
                }}
              >
                Clear All Mappings
              </button>
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(mappings, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'terrain-mappings.json';
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(100, 150, 255, 0.3)',
                  border: '1px solid rgba(100, 150, 255, 0.5)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  flex: 1,
                }}
              >
                Export Mappings
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
            }}
          >
            <div
              style={{
                color: '#ffffff',
                fontSize: '11px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Total Mappings: {mappings.length}
            </div>
            <div
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '10px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Height Range: {mappings.length > 0 
                ? `${Math.min(...mappings.map(m => m.height)).toFixed(1)} to ${Math.max(...mappings.map(m => m.height)).toFixed(1)}`
                : 'N/A'}
            </div>
          </div>

          {/* Color Picker (from ColorHeightMapper) */}
          <ColorHeightMapper />
        </div>
      )}
    </div>
  );
}
