"use client";
import React, { useEffect, useState } from "react";
import styles from "./InfoPanel.module.css";

export interface InfoPanelProps {
    feature: {
        geometry: {
            coordinates: [number, number]; // [longitude, latitude]
        };
        properties: {
            name: string;
            place_formatted: string;
            context: {
                neighborhood?: { name: string };
                locality?:     { name: string };
                region?:       { name: string };
                country?:      { name: string };
            };
        };
    };
}

export default function InfoPanel({ feature }: InfoPanelProps) {
    const { name, place_formatted, context } = feature.properties;
    const [hazardScore, setHazardScore] = useState<number | null>(null);

    // simulate API fetch
    useEffect(() => {
        let mounted = true;
        setTimeout(() => {
            if (!mounted) return;
            setHazardScore(Math.floor(Math.random() * 101));
        }, 1000);
        return () => { mounted = false; };
    }, []);

    const getHazardClass = () => {
        if (hazardScore === null) return styles.hazardBadgeLoading;
        if (hazardScore >= 75) return styles.hazardHigh;
        if (hazardScore >= 50) return styles.hazardMedium;
        if (hazardScore >= 25) return styles.hazardLow;
        return styles.hazardVeryLow;
    };

    return (
        <div className={styles.infoContent}>
            <div className={styles.infoBox}>
                <h3 className={styles.infoTitle}>{name}</h3>
                <p className={styles.infoPlace}>{place_formatted}</p>
                <hr className={styles.divider}/>

                <ul className={styles.contextList}>
                    {context.neighborhood && <li><strong>Neighborhood:</strong> {context.neighborhood.name}</li>}
                    {context.locality && <li><strong>Locality:</strong> {context.locality.name}</li>}
                    {context.region && <li><strong>Region:</strong> {context.region.name}</li>}
                    {context.country && <li><strong>Country:</strong> {context.country.name}</li>}
                </ul>

                <div className={styles.streetViewWrapper}>
                    <iframe
                        width="100%"
                        height="200"
                        src={`https://www.google.com/maps/embed/v1/streetview?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}` +
                            `&location=${feature.geometry.coordinates[1]},${feature.geometry.coordinates[0]}` +
                            `&heading=210&pitch=10&fov=80`}
                        allowFullScreen
                    />
                </div>

                <div className={styles.hazardBadgeWrapper}>
                    {/* STAR rating label on the left */}
                    <span className={styles.hazardLabel}>HAZARD SCORE: </span>
                    <div className={`${styles.hazardBadge} ${getHazardClass()}`}>
                        <span>{hazardScore === null ? "--" : hazardScore}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}