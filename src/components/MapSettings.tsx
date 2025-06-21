"use client";
import React, { useState } from "react";
import styles from "../app/page.module.css";
import { IoSettingsSharp } from "react-icons/io5";
import { FiChevronRight, FiChevronDown } from "react-icons/fi";
import Image from "next/image";
import NorthStarIcon from "@/public/NorthStarIcon.svg";

export function MapSettingsSidebar() {
  const [open, setOpen] = useState(false);
  const [showCrimeOptions, setShowCrimeOptions] = useState(false);

    return (
        <>
            <button
                className={`${styles.sidebarToggle} ${open ? styles.sidebarToggleOpen : ""}`}
                onClick={() => setOpen(o => !o)}
            >
                <Image src={NorthStarIcon} alt="Settings" width={32} height={32}/>
            </button>

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <h2>Map Settings</h2>

        {/* Arrow-based expandable crime heatmap section */}
        <div
          onClick={() => setShowCrimeOptions((prev) => !prev)}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: 600,
            marginBottom: "4px",
          }}
        >
          {showCrimeOptions ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
          <span>Show Crime Heatmap</span>
        </div>

        {showCrimeOptions && (
          <div style={{ marginLeft: "24px", marginTop: "4px" }}>
            <label>
              <input type="checkbox" /> Shootings
            </label>
            <br />
            <label>
              <input type="checkbox" /> Homicides
            </label>
            <br />
            <label>
              <input type="checkbox" /> Assaults
            </label>
            <br />
            <label>
              <input type="checkbox" /> Auto Thefts
            </label>
            <br />
            <label>
              <input type="checkbox" /> Bicycle Thefts
            </label>
            <br />
            <label>
              <input type="checkbox" /> Robberies
            </label>
            <br />
            <label>
              <input type="checkbox" /> Open Data Thefts
            </label>
            <br />
            <label>
              <input type="checkbox" /> Motor Vehicle Thefts
            </label>
          </div>
        )}

        <div>
          <label>
            <input type="checkbox" /> Night Mode Weighting
          </label>
        </div>

        <div>
          <label>
            <input type="checkbox" /> Satellite Map
          </label>
        </div>
      </aside>
    </>
  );
}
