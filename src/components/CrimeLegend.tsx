"use client";
import React from "react";
import { FaDollarSign, FaGun, FaMask } from "react-icons/fa6";
import { FaCarCrash } from "react-icons/fa";
import { GiCarDoor, GiFist, GiChalkOutlineMurder } from "react-icons/gi";
import { GrBike } from "react-icons/gr";

type CrimeType = {
  label: string;
  icon: React.ReactNode;
  colorLight: string;
  colorDark: string;
};

const CRIMES: CrimeType[] = [
  { label: "Shootings", icon: <FaGun />, colorLight: "#ff3333", colorDark: "#ff0000" },
  { label: "Homicides", icon: <GiChalkOutlineMurder />, colorLight: "#333333", colorDark: "#000000" },
  { label: "Assaults", icon: <GiFist />, colorLight: "#ff9933", colorDark: "#e67300" },
  { label: "Auto Thefts", icon: <GiCarDoor />, colorLight: "#ff66ff", colorDark: "#e600e6" },
  { label: "Bicycle Thefts", icon: <GrBike />, colorLight: "#66d9ff", colorDark: "#4dc3ff" },
  { label: "Robberies", icon: <FaMask />, colorLight: "#00b300", colorDark: "#006600" },
  { label: "Open Data Thefts", icon: <FaDollarSign />, colorLight: "#ffd700", colorDark: "#ffcc00" },
  { label: "Motor Vehicle Thefts", icon: <FaCarCrash />, colorLight: "#cc66ff", colorDark: "#9900cc" },
];

function LegendItem({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "3px 8px",
        borderRadius: "8px",
        fontSize: "0.8rem",
        fontWeight: 500,
        color: "#111111",
        cursor: "default",
        transition: "background 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ fontSize: "16px", color }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default function CrimeLegend({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "80px",
        right: "20px",
        zIndex: 3,
        width: "200px",
        padding: "0px 5px",
        background: "rgba(255, 255, 255, 0.2)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        borderRadius: "12px",
        fontFamily: "'Work Sans', sans-serif",
        color: "#111111",
        }
    }   
    >
      <h4
        style={{
          fontSize: "0.9rem",
          fontWeight: 700,
          marginBottom: "10px",
          borderBottom: "2px solid rgba(255,255,255,0.3)",
          paddingBottom: "4px",
          textAlign: "center",
        }}
      >
        Legend
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {CRIMES.map(({ label, icon, colorLight, colorDark }) => (
          <LegendItem
            key={label}
            icon={icon}
            label={label}
            color={isDark ? colorDark : colorLight}
          />
        ))}
      </div>
    </div>
  );
}
