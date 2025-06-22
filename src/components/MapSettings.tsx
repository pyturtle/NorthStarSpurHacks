"use client";
import React, { useState } from "react";
import styles from "../app/page.module.css";
import Image from "next/image";
import NorthStarIcon from "@/public/NorthStarIcon.svg";
import {
  FaDollarSign,
  FaGun,
  FaMask
} from "react-icons/fa6";
import { FaCarCrash, FaMapMarkedAlt } from "react-icons/fa";
import {
  GiCarDoor,
  GiFist,
  GiChalkOutlineMurder
} from "react-icons/gi";
import { GrBike } from "react-icons/gr";
import { ReactNode } from "react";

// Crime layer configuration with color-coding
const CRIME_LAYERS = [
  { key: "shootings", label: "Shootings", icon: <FaGun />, color: "#ff3333" },
  { key: "homicides", label: "Homicides", icon: <GiChalkOutlineMurder />, color: "#333333" },
  { key: "assaults", label: "Assaults", icon: <GiFist />, color: "#ff9933" },
  { key: "autoThefts", label: "Auto Thefts", icon: <GiCarDoor />, color: "#ff66ff" },
  { key: "bicycleThefts", label: "Bicycle Thefts", icon: <GrBike />, color: "#66d9ff" },
  { key: "robberies", label: "Robberies", icon: <FaMask />, color: "#00b300" },
  { key: "openData", label: "Open Data Thefts", icon: <FaDollarSign />, color: "#ffd700" },
  { key: "motorThefts", label: "Motor Vehicle Thefts", icon: <FaCarCrash />, color: "#cc66ff" },
];

function CrimeLayerToggle({
  label,
  icon,
  color,
  selected,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 12px",
        marginBottom: "6px",
        borderRadius: "12px",
        cursor: "pointer",
        background: selected ? "rgba(220, 220, 220, 0.4)" : "transparent",
        fontWeight: selected ? 700 : 500,
        color: selected ? "#000" : "#111",
        borderLeft: selected ? `6px solid ${color}` : "6px solid transparent",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = "rgba(0,0,0,0.05)";
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ fontSize: "16px", color }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export function MapSettingsSidebar() {
  const [open, setOpen] = useState(false);

  const [layers, setLayers] = useState({
    shootings: true,
    homicides: false,
    assaults: false,
    autoThefts: false,
    bicycleThefts: false,
    robberies: false,
    openData: false,
    motorThefts: false,
  });

  const [satellite, setSatellite] = useState(false);
  const [mapStyle, setMapStyle] = useState<"heatmap" | "dots" | "alt">("heatmap");

  const toggleLayer = (key: keyof typeof layers) =>
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  const styleButton = (
    key: "heatmap" | "dots" | "alt",
    label: string,
    image: string
  ) => (
    <button
      key={key}
      onClick={() => setMapStyle(key)}
      style={{
        width: "80px",
        height: "80px",
        borderRadius: "12px",
        border: mapStyle === key ? "2px solid #007AFF" : "1px solid #ccc",
        overflow: "hidden",
        padding: 0,
        position: "relative",
        backgroundImage: `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        color: "#fff",
        fontWeight: 600,
        fontSize: "0.75rem",
        cursor: "pointer",
        transition: "transform 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
    >
      <div
        style={{
          width: "100%",
          background: "rgba(0, 0, 0, 0.6)",
          padding: "4px 0",
          textAlign: "center",
        }}
      >
        {label}
      </div>
    </button>
  );

  return (
    <>
      <button
        className={`${styles.sidebarToggle} ${open ? styles.sidebarToggleOpen : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <Image src={NorthStarIcon} alt="Settings" width={32} height={32} />
      </button>

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <h1 style={{ textAlign: "center", fontWeight: 700 }}>
          Map Settings (Click!)
        </h1>

        {/* Crime layer toggles */}
        <div style={{ marginTop: "12px" }}>
          {CRIME_LAYERS.map(({ key, label, icon, color }) => (
            <CrimeLayerToggle
              key={key}
              label={label}
              icon={icon}
              color={color}
              selected={layers[key as keyof typeof layers]}
              onClick={() => toggleLayer(key as keyof typeof layers)}
            />
          ))}
        </div>

        {/* Satellite toggle remains untouched */}
        <div style={{ marginTop: "16px" }}>
          <CrimeLayerToggle
            label="Satellite Map"
            icon={<FaMapMarkedAlt />}
            color="#007AFF"
            selected={satellite}
            onClick={() => setSatellite(!satellite)}
          />
        </div>

        {/* Map style buttons */}
        <div style={{ marginTop: "24px" }}>
          <h2
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              marginBottom: "8px",
              textAlign: "center",
            }}
          >
            Map Visual Style
          </h2>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            {styleButton("heatmap", "Heatmap", "/icons/heatmap-preview.png")}
            {styleButton("dots", "Dotmap", "/icons/dotmap-preview.png")}
            {styleButton("alt", "Iconmap", "/icons/iconmap-preview.png")}
          </div>
        </div>
      </aside>
    </>
  );
}
