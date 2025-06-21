"use client";

import React from "react";
import styles from "../app/page.module.css";
import { FaWalking } from "react-icons/fa";
import { MdDirectionsBike } from "react-icons/md";
import { FaCar } from "react-icons/fa";

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
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: "10px",
        right: "100px",
        zIndex: 2,
        display: "flex",
        gap: "12px",
        background: "rgba(255, 255, 255, 0.1)",
        padding: "10px 12px",
        borderRadius: "16px",
        backdropFilter: "blur(6px)",
      }}
    >
      <button
  style={buttonStyle(isSelected("walk"))}
  onClick={() => setTransportMode("walk")}
>
  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
    <FaWalking />
    <span>Walk</span>
  </span>
</button>

<button
  style={buttonStyle(isSelected("bike"))}
  onClick={() => setTransportMode("bike")}
>
  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
    <MdDirectionsBike />
    <span>Bike</span>
  </span>
</button>
      <button
  style={buttonStyle(isSelected("car"))}
  onClick={() => setTransportMode("car")}
>
  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
    <FaCar />
    <span>Car</span>
  </span>
</button>
    </div>
  );
}
