"use client";
import React, { useState } from "react";
import styles from "../app/page.module.css";
import Image from "next/image";
import NorthStarIcon from "@/public/NorthStarIcon.svg";
import { FaDollarSign, FaGun, FaMask } from "react-icons/fa6";
import { FaCarCrash, FaMapMarkedAlt } from "react-icons/fa";
import { GiCarDoor, GiFist, GiChalkOutlineMurder } from "react-icons/gi";
import { GrBike } from "react-icons/gr";
import { ReactNode } from "react";
import { MapLayers, datasets } from "@/app/map_layers";

// Reusable toggle switch
function Toggle({
  label,
  value,
  onToggle,
  icon,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  icon?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {icon}
        <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{label}</span>
      </div>
      <button
        onClick={onToggle}
        style={{
          position: "relative",
          width: "42px",
          height: "24px",
          background: value ? "#4ade80" : "#ccc",
          borderRadius: "999px",
          border: "none",
          cursor: "pointer",
          transition: "background 0.3s ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "3px",
            left: value ? "22px" : "4px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.3s ease",
          }}
        />
      </button>
    </div>
  );
}

interface Props {
  map: mapboxgl.Map | null;
  isDark: boolean;
}

export function MapSettingsSidebar({ map, isDark }: Props) {
  const [open, setOpen] = useState(false);

  const [layers, setLayers] = useState({
    shootings: false,
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

  const toggleLayer = (key: keyof typeof layers) => {
  setLayers((prev) => {
    const newValue = !prev[key];
    
    // Update the corresponding dataset
    const datasetMap: Record<string, string> = {
      shootings: "shootings",
      homicides: "homicides",
      assaults: "assaults",
      autoThefts: "auto_thefts",
      bicycleThefts: "bicycle_thefts",
      robberies: "robberies",
      openData: "thefts_over_open",
      motorThefts: "motor_thefts",
    };

    const datasetId = datasetMap[key];
    const dataset = datasets.find((d) => d.id === datasetId);
    if (dataset) dataset.enabled = newValue;
    if (map) {
      if (newValue) {
        // layer turned ON → re-render all valid layers
        MapLayers.restoreAllLayers(map, isDark);
      } else {
        // layer turned OFF → remove its layers immediately
        MapLayers.removeLayersForId(map, datasetId);
      }
    }
    return { ...prev, [key]: newValue };
  });
};

  return (
    <>
      <button
        className={`${styles.sidebarToggle} ${open ? styles.sidebarToggleOpen : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <Image src={NorthStarIcon} alt="Settings" width={32} height={32} />
      </button>

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <h1><b>Map Settings</b></h1>

        {/* Crime layer toggles */}
        <div style={{ marginTop: "12px" }}>
          <Toggle
            label="Shootings"
            value={layers.shootings}
            onToggle={() => toggleLayer("shootings")}
            icon={<FaGun />}

          />
          <Toggle
            label="Homicides"
            value={layers.homicides}
            onToggle={() => toggleLayer("homicides")}
            icon={<GiChalkOutlineMurder />}
          />
          <Toggle
            label="Assaults"
            value={layers.assaults}
            onToggle={() => toggleLayer("assaults")}
            icon={<GiFist />}
          />
          <Toggle
            label="Auto Thefts"
            value={layers.autoThefts}
            onToggle={() => toggleLayer("autoThefts")}
            icon={<GiCarDoor />}
          />
          <Toggle
            label="Bicycle Thefts"
            value={layers.bicycleThefts}
            onToggle={() => toggleLayer("bicycleThefts")}
            icon={<GrBike />}
          />
          <Toggle
            label="Robberies"
            value={layers.robberies}
            onToggle={() => toggleLayer("robberies")}
            icon={<FaMask />}
          />
          <Toggle
            label="Open Data Thefts"
            value={layers.openData}
            onToggle={() => toggleLayer("openData")}
            icon={<FaDollarSign />}
          />
          <Toggle
            label="Motor Vehicle Thefts"
            value={layers.motorThefts}
            onToggle={() => toggleLayer("motorThefts")}
            icon={<FaCarCrash />}
          />
        </div>

        {/* Satellite toggle */}
        <div style={{ marginTop: "16px" }}>
          <Toggle
            label="Satellite Map"
            value={satellite}
            onToggle={() => setSatellite(!satellite)}
            icon={<FaMapMarkedAlt />}
          />
        </div>

        {/* Map style buttons */}
        <div style={{ marginTop: "24px" }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "8px", textAlign: "center" }}>
            Map Visual Style
          </h2>
        <div
          style={{
            display: "flex",
            justifyContent: "center", // ⬅️ This centers the buttons
            gap: "12px",
          }}
        >
      <button
        onClick={() => setMapStyle("heatmap")}
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "8px",
          border: mapStyle === "heatmap" ? "2px solid #007AFF" : "2px solid #ccc",
          background: "#fff",
          fontWeight: 600,
          fontSize: "0.75rem",
          cursor: "pointer",
        }}
      >
        Heatmap
      </button>
      <button
        onClick={() => setMapStyle("dots")}
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "8px",
          border: mapStyle === "dots" ? "2px solid #007AFF" : "2px solid #ccc",
          background: "#fff",
          fontWeight: 600,
          fontSize: "0.75rem",
          cursor: "pointer",
        }}
      >
        Dotmap
      </button>
      <button
        onClick={() => setMapStyle("alt")}
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "8px",
          border: mapStyle === "alt" ? "2px solid #007AFF" : "2px solid #ccc",
          background: "#fff",
          fontWeight: 600,
          fontSize: "0.75rem",
          cursor: "pointer",
        }}
      >
        Iconmap
      </button>
    </div>
  </div>
        </aside>
      </>
    );
  }
