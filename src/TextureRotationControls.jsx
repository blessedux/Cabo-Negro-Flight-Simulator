import React, { useState } from "react";

export function TextureRotationControls({ onRotationChange }) {
  const [rotation, setRotation] = useState(0); // Rotation in degrees

  const rotate = (degrees) => {
    const newRotation = rotation + degrees;
    setRotation(newRotation);
    // Convert to radians and pass to parent
    const radians = (newRotation * Math.PI) / 180;
    onRotationChange(radians);
  };

  const reset = () => {
    setRotation(0);
    onRotationChange(0);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        background: "rgba(0, 0, 0, 0.7)",
        padding: "15px",
        borderRadius: "8px",
        color: "white",
        fontFamily: "Arial, sans-serif",
        zIndex: 1000,
        minWidth: "200px",
      }}
    >
      <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
        Texture Rotation
      </div>
      <div style={{ marginBottom: "10px", fontSize: "14px" }}>
        Current: {rotation.toFixed(1)}°
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          onClick={() => rotate(-45)}
          style={{
            padding: "8px 12px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          ← 45°
        </button>
        <button
          onClick={() => rotate(-15)}
          style={{
            padding: "8px 12px",
            background: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          ← 15°
        </button>
        <button
          onClick={() => rotate(15)}
          style={{
            padding: "8px 12px",
            background: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          15° →
        </button>
        <button
          onClick={() => rotate(45)}
          style={{
            padding: "8px 12px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          45° →
        </button>
        <button
          onClick={reset}
          style={{
            padding: "8px 12px",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            width: "100%",
            marginTop: "5px",
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

