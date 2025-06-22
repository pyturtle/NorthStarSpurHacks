"use client";
import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import styles from "./InfoPanel.module.css";

export interface InfoPanelProps {
    feature: {
        geometry: {
            coordinates: [number, number]; // [lng, lat]
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
    const [hasStreetView, setHasStreetView] = useState<boolean | null>(null);
    const panoramaRef = useRef<HTMLDivElement>(null);

    const [lng, lat] = feature.geometry.coordinates;

    // simulate API fetch for hazard score
    useEffect(() => {
        let mounted = true;
        setTimeout(() => {
            if (mounted) setHazardScore(Math.floor(Math.random() * 101));
        }, 1000);
        return () => { mounted = false; };
    }, []);

    // initialize Google Street View Panorama if available
    useEffect(() => {
        if (!panoramaRef.current) return;
        const loader = new Loader({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
            version: "weekly",
        });
        loader.importLibrary("maps").then(() => {
            const service = new google.maps.StreetViewService();
            // search within 50m radius for panorama
            service.getPanorama({ location: { lat, lng }, radius: 50 }, (data, status) => {
                if (status === google.maps.StreetViewStatus.OK && data && data.location) {
                    setHasStreetView(true);
                    new google.maps.StreetViewPanorama(panoramaRef.current!, {
                        pano: data.location.pano,
                        pov: { heading: 210, pitch: 10 },
                        zoom: 1,
                        addressControl: false,
                        linksControl: false,
                        disableDefaultUI: true,
                        controlSize: 20,
                        fullscreenControl: true,
                        motionTracking: false,
                    });
                } else {
                    setHasStreetView(false);
                }
            });
        });
    }, [lat, lng]);

    const getHazardClass = () => {
        if (hazardScore === null) return styles.hazardBadgeLoading;
        if (hazardScore >= 75)     return styles.hazardHigh;
        if (hazardScore >= 50)     return styles.hazardMedium;
        if (hazardScore >= 25)     return styles.hazardLow;
        return                        styles.hazardVeryLow;
    };

    return (
        <div className={styles.infoContent}>
            <div className={styles.infoBox}>
                <h3 className={styles.infoTitle}>{name}</h3>
                <p className={styles.infoPlace}>{place_formatted}</p>
                <hr className={styles.divider} />

                <ul className={styles.contextList}>
                    {context.neighborhood && <li><strong>Neighborhood:</strong> {context.neighborhood.name}</li>}
                    {context.locality     && <li><strong>Locality:</strong> {context.locality.name}</li>}
                    {context.region       && <li><strong>Region:</strong> {context.region.name}</li>}
                    {context.country      && <li><strong>Country:</strong> {context.country.name}</li>}
                </ul>

                {/* Street View or fallback */}
                {hasStreetView === false ? (
                    <div className={styles.noStreetView}>
                        Street View not available for this location.
                    </div>
                ) : <div ref={panoramaRef} className={styles.streetViewWrapper}/>}


                <div className={styles.hazardBadgeWrapper}>
                    <span className={styles.hazardLabel}>RISK</span>
                    <div className={`${styles.hazardBadge} ${getHazardClass()} pop`}>
                        <span>{hazardScore === null ? "--" : hazardScore}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
