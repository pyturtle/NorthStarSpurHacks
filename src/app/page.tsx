"use client";
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import { GeocodingCore } from "@mapbox/search-js-core";
import mapboxgl from 'mapbox-gl';
import { MapSettingsSidebar } from "@/components/MapSettings";
import {MapSearchBox} from "@/components/MapSearchBox";
import { IconContext } from "react-icons";
import { IoMoon } from "react-icons/io5";
import NorthStarLogo from '@/public/NorthStarLogo.svg'
import Image from 'next/image';
import styles from "./page.module.css";
import InfoPanel from "@/components/InfoPanel";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function Home() {
    // Ref to hold the map container and map instance
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map>(null);

    // State to hold selected location from map click
    const [selectedLocation, setSelectedLocation] = useState<{
        coords: [number,number];
        feature: any;
    } | null>(null);

    // State to manage map readiness and origin/destination coordinates
    const [mapReady, setMapReady]       = useState(false);
    const [origin, setOrigin]           = useState<[number, number] | null>(null);
    const [destination, setDestination] = useState<[number, number] | null>(null);

    const [isDark, setIsDark] = useState(true);

    // Custom Light and Dark mode Url
    const darkStyle = "mapbox://styles/delecive/cmc3s3q3101vs01s67ouvbc4c";
    const lightStyle = "mapbox://styles/delecive/cmc3s07z9014101rx5r1f3brc";

    // Initialize the GeocodingCore with Mapbox access token
    const geocoder = new GeocodingCore({
        accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    });

    // hydrate theme
    useLayoutEffect(() => {
        const stored = localStorage.getItem("northstar-dark-mode");
        if (stored !== null) {
            setIsDark(stored === "true");
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("northstar-dark-mode", isDark.toString());
        mapRef.current?.setStyle(
            isDark
                ? darkStyle
                : lightStyle
        );
    }, [isDark]);

    useEffect(() => {
        const bounds = new mapboxgl.LngLatBounds(
            [-79.603709, 43.576155],
            [-79.132967, 43.878211]
        );

        mapRef.current = new mapboxgl.Map({
            container: mapContainer.current!,
            style: isDark ? darkStyle : lightStyle,
            zoom: 12,
            center: [-79.380970, 43.645490],
            maxBounds: bounds,
            minZoom: 11,
            maxZoom: 20
        });

        mapRef.current.on("click", async (e) => {
            const lng = e.lngLat.lng;
            const lat = e.lngLat.lat;
            const response = await geocoder.reverse(e.lngLat, {
                types: new Set([
                    "address",
                    "street",
                    "place",
                    "neighborhood"
                ]),
                limit: 1,
            });

            const feat = response.features?.[0];
            if (feat) {
                setSelectedLocation({
                    coords: [lng, lat] as [number, number],
                    feature: feat
                });
            }
        });

        setMapReady(true);
        return () => mapRef.current?.remove();
    }, []);

    const toggleStyle = () => {
        setIsDark(d => !d);
    };

    return (
        <div className={styles.pageWrapper}>
            <MapSettingsSidebar/>

            <aside
                className={`${styles.infoPanel} ${
                    selectedLocation ? styles.infoPanelOpen : ""
                }`}
            >
                <button
                    className={styles.closeButton}
                    onClick={() => setSelectedLocation(null)}
                    aria-label="Close"
                >
                    ×
                </button>

                {selectedLocation && (
                    <>
                        <button
                            className={styles.actionButton}
                            onClick={() => {
                                setOrigin(selectedLocation.coords);
                                setSelectedLocation(null);
                            }}
                        >
                            Set as Start
                        </button>
                        <button
                            className={styles.actionButton}
                            onClick={() => {
                                setDestination(selectedLocation.coords);
                                setSelectedLocation(null);
                            }}
                        >
                            Set as End
                        </button>
                        <InfoPanel feature={selectedLocation.feature} />
                    </>

                )}
            </aside>

            <div ref={mapContainer} className={styles.mapContainer}/>
            {mapReady && (
                <>
                    <div className={styles.searchContainer}>
                        <MapSearchBox
                            map={mapRef.current}
                            placeholder="Start address"
                            onRetrieve={(coords) => setOrigin(coords)}
                        />
                    </div>
                    <div className={`${styles.searchContainer} ${styles.searchContainerEnd}`}>
                        <MapSearchBox
                            map={mapRef.current}
                            placeholder="End address"
                            onRetrieve={(coords) => setDestination(coords)}
                        />
                    </div>
                </>
            )}

            {/*<button*/}
            {/*    disabled={!origin || !destination}*/}
            {/*    onClick={() => console.log({origin, destination})}*/}
            {/*    className={styles.goButton}*/}
            {/*>*/}
            {/*    Go*/}
            {/*</button>*/}

            <button
                onClick={toggleStyle}
                className={`${styles.toggleButton} ${isDark ? styles.darkToggle : styles.lightToggle}`}
            >
                <IconContext.Provider
                    value={{
                        color: isDark ? "#ffffff" : "#000000",
                        size: "20px",
                    }}
                >
                    <IoMoon/>
                </IconContext.Provider>
            </button>
            <Image
                src={NorthStarLogo}
                alt="NorthStar Logo"
                width={100}
                height={100}
                className={styles.logo}
            />
        </div>
    );
}