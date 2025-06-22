"use client";
import React, {ReactNode, useState} from "react";
import styles from "../app/page.module.css";
import Image from "next/image";
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
import { MapLayers, datasets } from "@/app/map_layers";

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

interface CrimeLayerToggleProps {
    label: string;
    icon: ReactNode;
    color: string;
    selected: boolean;
    onClick: () => void;
}



function CrimeLayerToggle({ label, icon, color, selected, onClick }: CrimeLayerToggleProps) {
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
        transition: "all 0.2s ease"
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

// @ts-ignore
export function MapSettingsSidebar({ map, isDark, visualizationMode, setVisualizationMode }) {
  const [open, setOpen] = useState(false);

  const [layers, setLayers] = useState({
    shootings: false,
    homicides: false,
    assaults: false,
    autoThefts: false,
    bicycleThefts: false,
    robberies: false,
    openData: false,
    motorThefts: false
  });

  const [satellite, setSatellite] = useState(false);
    // @ts-ignore
  const toggleLayer = (key) => {
    setLayers((prev) => {
      // @ts-ignore
        const newValue = !prev[key];
      const datasetMap = {
        shootings: "shootings",
        homicides: "homicides",
        assaults: "assaults",
        autoThefts: "auto_thefts",
        bicycleThefts: "bicycle_thefts",
        robberies: "robberies",
        openData: "thefts_over_open",
        motorThefts: "motor_thefts"
      };
      // @ts-ignore
        const datasetId = datasetMap[key];
      const dataset = datasets.find((d) => d.id === datasetId);
      if (dataset) dataset.enabled = newValue;
      if (map) {
        if (newValue) MapLayers.restoreAllLayers(map, isDark, visualizationMode);
        else MapLayers.removeLayersForId(map, datasetId);
      }
      return { ...prev, [key]: newValue };
    });
  };
    // @ts-ignore
  const styleButton = (key, label, image) => (
    <button
      key={key}
      onClick={() => setVisualizationMode(key === "heatmap" ? "heatmap" : "dotmap")}
      style={{
        width: "80px",
        height: "80px",
        borderRadius: "12px",
        border: visualizationMode === key ? "2px solid #007AFF" : "1px solid #ccc",
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
        transition: "transform 0.2s ease"
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
    >
      <div style={{
        width: "100%",
        background: "rgba(0, 0, 0, 0.6)",
        padding: "4px 0",
        textAlign: "center"
      }}>{label}</div>
    </button>
  );

  return (
    <>
      <button
        className={`${styles.sidebarToggle} ${open ? styles.sidebarToggleOpen : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <Image src={"/NorthStarIcon.svg"} alt="Settings" width={32} height={32} />
      </button>

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <h1 style={{ textAlign: "center", fontWeight: 700 }}>
          Map Settings (Click!)
        </h1>

        <div style={{ marginTop: "12px" }}>
          {CRIME_LAYERS.map(({ key, label, icon, color }) => (
            <CrimeLayerToggle
              key={key}
              label={label}
              icon={icon}
              color={color}
                // @ts-ignore
              selected={layers[key]}
              onClick={() => toggleLayer(key)}
            />
          ))}
        </div>

        <div style={{ marginTop: "16px" }}>
          <CrimeLayerToggle
            label="Satellite Map"
            icon={<FaMapMarkedAlt />}
            color="#007AFF"
            selected={satellite}
            onClick={() => setSatellite(!satellite)}
          />
        </div>

        <div style={{ marginTop: "24px" }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "8px", textAlign: "center" }}>
            Map Visual Style
          </h2>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
            {styleButton("heatmap", "Heatmap", "/icons/heatmap-preview.png")}
            {styleButton("dotmap", "Dotmap", "/icons/dotmap-preview.png")}
            {styleButton("iconmap", "Iconmap", "/icons/iconmap-preview.png")}
          </div>
        </div>
      </aside>
    </>
  );
}