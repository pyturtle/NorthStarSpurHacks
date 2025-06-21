"use client";

import React from "react";
import { FaWalking, FaCar } from "react-icons/fa";
import { MdDirectionsBike } from "react-icons/md";

type TransportMode = 'walk' | 'bike' | 'car';

interface Props {
  transportMode: TransportMode;
  setTransportMode: React.Dispatch<React.SetStateAction<TransportMode>>;
}

export default function TransportModeSelector({ transportMode, setTransportMode }: Props) {
  const isSelected = (mode: TransportMode) => transportMode === mode;

  const buttonStyle = (selected: boolean): React.CSSProperties => ({
    minWidth: "80px",
    padding: "10px 16px",
    border: selected ? "2px solid #007AFF" : "1px solid rgba(255,255,255,0.3)",
    borderRadius: "100px",
    fontWeight: 600,
    cursor: "pointer",
    background: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    color: "#000",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",      // adjust height from bottom
        right: "10%",        // somewhere between center and right
        zIndex: 2,
        display: "flex",
        gap: "12px",         // spacing between buttons
      }}
    >
      <button
        style={buttonStyle(transportMode === "walk")}
        onClick={() => setTransportMode("walk")}
      >
        <FaWalking />
        <span>Walk</span>
      </button>

      <button
        style={buttonStyle(transportMode === "bike")}
        onClick={() => setTransportMode("bike")}
      >
        <MdDirectionsBike />
        <span>Bike</span>
      </button>

      <button
        style={buttonStyle(transportMode === "car")}
        onClick={() => setTransportMode("car")}
      >
        <FaCar />
        <span>Car</span>
      </button>
    </div>
  );
}
