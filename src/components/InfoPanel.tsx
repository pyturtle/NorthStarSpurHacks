import React from "react";
import styles from "../app/page.module.css";  // adjust path as needed

export interface InfoPanelProps {
    feature: {
        text:       string;
        place_name: string;
    };
}

export default function InfoPanel({ feature }: InfoPanelProps) {
    return (
        <aside className={styles.infoPanel}>
            <h3>{feature.text}</h3>
            <p>{feature.place_name}</p>
        </aside>
    );
}