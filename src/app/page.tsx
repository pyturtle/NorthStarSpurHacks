"use client";
import mapboxgl from 'mapbox-gl';
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import { IconContext } from "react-icons";
import { IoMoon } from "react-icons/io5";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function Home() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map>(null);

    const [isDark, setIsDark] = useState(true);

    // Custom Light and Dark mode
    const darkStyle = "mapbox://styles/delecive/cmc3s07z9014101rx5r1f3brc/draft";
    const lightStyle = "mapbox://styles/delecive/cmc3s3q3101vs01s67ouvbc4c/draft";

    // Initialize map
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

        // mapRef.current.fitBounds(bounds, { padding: 20, duration: 0 });

        return () => mapRef.current?.remove();
    }, []);

    const toggleStyle = () => {
        setIsDark(d => !d);
    };

    return (
        <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
            <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />

            <button
                onClick={toggleStyle}
                style={{
                    position:   'absolute',
                    bottom:     '20px',
                    right:      '20px',
                    background: isDark ? '#1e1e1e' : '#ffffff',
                    border:     'none',
                    borderRadius: '50%',
                    padding:    '12px',
                    boxShadow:  '0 4px 12px rgba(0,0,0,0.3)',
                    cursor:     'pointer',
                    transition: 'all 0.3s ease'
                }}
            >
                <IconContext.Provider value={{
                    color: isDark ? "#ffffff" : "#000000",
                    size:  "20px"
                }}>
                    <IoMoon />
                </IconContext.Provider>
            </button>
        </div>
    );
}