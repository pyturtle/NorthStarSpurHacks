"use client";

import React from "react";
import { FaWalking, FaCar } from "react-icons/fa";
import { MdDirectionsBike } from "react-icons/md";

type TransportMode = 'walking' | 'cycling' | 'driving-traffic';

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
        style={buttonStyle(transportMode === "walking")}
        onClick={() => setTransportMode("walking")}
      >
        <FaWalking />
        <span>Walk</span>
      </button>

      <button
        style={buttonStyle(transportMode === "cycling")}
        onClick={() => setTransportMode("cycling")}
      >
        <MdDirectionsBike />
        <span>Bike</span>
      </button>

      <button
        style={buttonStyle(transportMode === "driving-traffic")}
        onClick={() => setTransportMode("driving-traffic")}
      >
        <FaCar />
        <span>Car</span>
      </button>
    </div>
  );
}
