"use client";
import React, { useState } from "react";
import styles from "../app/page.module.css"; // or "../styles/sidebar.module.css"
import { IoSettingsSharp } from "react-icons/io5";
import Image from "next/image";
import NorthStarIcon from "@/public/NorthStarIcon.svg";

export function MapSettingsSidebar() {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <>
            <button
                className={`${styles.sidebarToggle} ${open ? styles.sidebarToggleOpen : ""}`}
                onClick={() => setOpen(o => !o)}
            >
                <Image src={NorthStarIcon} alt="Settings" width={32} height={32}/>
                <span>Settings</span>
            </button>

            <aside
                className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}
            >

                <h2>Map Settings Working on it </h2>
                {/*TODO add controls*/}
                <div>
                    <label>
                        <input type="checkbox"/> Show crime heatmap
                    </label>
                    <div style={{ marginLeft: "24px", marginTop: "4px" }}>
                        <label>
                            <input type="checkbox" /> Walk: 300m
                        </label>
                        <br />
                        <label>
                            <input type="checkbox" /> Bike: 500m
                        </label>
                        <br />
                        <label>
                            <input type="checkbox" /> Car: 1000m
                        </label>
                    </div>
                </div>
                <div>
                    <label>
                        <input type="checkbox"/> Night mode weighting
                    </label>
                </div>
                <div>
                    <label>
                        <input type="checkbox"/> Satellite map
                    </label>
                </div>
            </aside>
        </>
    );
}
