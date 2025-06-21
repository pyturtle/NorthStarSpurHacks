"use client";
import React, { useState } from "react";
import styles from "../app/page.module.css";
import { IoSettingsSharp } from "react-icons/io5";
import Image from "next/image";
import NorthStarIcon from "@/public/NorthStarIcon.svg";

export function MapSettingsSidebar() {
  const [open, setOpen] = useState<boolean>(false);
  const [showCrimeHeatmap, setShowCrimeHeatmap] = useState<boolean>(false);

  return (
    <>
      <button
        className={`${styles.sidebarToggle} ${open ? styles.sidebarToggleOpen : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <Image src={NorthStarIcon} alt="Settings" width={32} height={32} />
        <span>Settings</span>
      </button>

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <h2>Map Settings</h2>

        <div>
          <label>
            <input
              type="checkbox"
              checked={showCrimeHeatmap}
              onChange={(e) => setShowCrimeHeatmap(e.target.checked)}
            />{" "}
            Show Crime Heatmap
          </label>

          {showCrimeHeatmap && (
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
                <input type="checkbox" /> Open data Thefts
              </label>
              <br />
              <label>
                <input type="checkbox" /> Motor Vehicle Thefts
              </label>
            </div>
          )}
        </div>

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
