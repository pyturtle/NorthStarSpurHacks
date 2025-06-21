"use client";
import mapboxgl from 'mapbox-gl';
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import Image from 'next/image';
import { IconContext } from "react-icons";
import { IoMoon } from "react-icons/io5";
import {MapSearchBox} from "@/components/MapSearchBox";
import NorthStarLogo from '@/public/NorthStarLogo.svg'
import styles from "./page.module.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function Home() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map>(null);

    const [mapReady, setMapReady]       = useState(false);
    const [origin, setOrigin]           = useState<[number, number] | null>(null);
    const [destination, setDestination] = useState<[number, number] | null>(null);

    const [isDark, setIsDark] = useState(true);

    // Custom Light and Dark mode Url
    const darkStyle = "mapbox://styles/delecive/cmc3s07z9014101rx5r1f3brc/draft";
    const lightStyle = "mapbox://styles/delecive/cmc3s3q3101vs01s67ouvbc4c/draft";

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
        setMapReady(true);
        return () => mapRef.current?.remove();
    }, []);

    const toggleStyle = () => {
        setIsDark(d => !d);
    };

    return (
        <div className={styles.pageWrapper}>
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