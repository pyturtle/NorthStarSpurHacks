"use client";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import { length, along, circle, booleanPointInPolygon } from "@turf/turf";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {GeocodingCore, SearchBoxRetrieveResponse} from "@mapbox/search-js-core";
import mapboxgl from "mapbox-gl";
import { MapSettingsSidebar } from "@/components/MapSettings";
import { IconContext } from "react-icons";
import { IoMoon } from "react-icons/io5";
import { FaArrowUp } from "react-icons/fa";
import NorthStarLogo from "@/public/NorthStarLogo.svg";
import { MapLayers } from "@/app/map_layers";
import Image from "next/image";
import styles from "./page.module.css";
import InfoPanel from "@/components/InfoPanel";
import TransportModeSelector from "@/components/TransportModeSelector";
import { IoMdSwap } from "react-icons/io";
import dynamic from "next/dynamic";

const SearchBox = dynamic(
    () => import("@mapbox/search-js-react").then((mod) => mod.SearchBox),
    { ssr: false }
);


const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function Home() {
    // Ref to hold the map container and map instance
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map>(undefined);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const endMarkerRef = useRef<mapboxgl.Marker | null>(null);
    // const mapRoute = useState<>(null)
    const [startAddress, setStartAddress] = useState("");
    const [endAddress, setEndAddress] = useState("");
    const [startCoordinates, setStartCoordinates] = useState<[number, number] | null>(null);
    const [endCoordinates, setEndCoordinates] = useState<[number, number] | null>(null);

    // State to hold selected location from map click
    const [selectedLocation, setSelectedLocation] = useState<{
        coords: [number, number];
        feature: any;
    } | null>(null);

    // State to manage map readiness and origin/destination coordinates
    const [mapReady, setMapReady]       = useState(false);

    const [isDark, setIsDark] = useState(true);
    const [transportMode, setTransportMode] = useState<"walking" | "cycling" | "driving-traffic">("walking");

    // Custom Light and Dark mode Url
    const darkStyle = "mapbox://styles/delecive/cmc3s3q3101vs01s67ouvbc4c";
    const lightStyle = "mapbox://styles/delecive/cmc3s07z9014101rx5r1f3brc";

    // Initialize the GeocodingCore with Mapbox access token
    const geocoder = new GeocodingCore({
        accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    });

    const reset_marker = () => {
        if (markerRef.current) {
            markerRef.current.remove();
        }
        markerRef.current = null;
        setSelectedLocation(null);
    }

  // hydrate theme from localStorage
    useLayoutEffect(() => {
        const stored = localStorage.getItem("northstar-dark-mode");
        if (stored !== null) {
          setIsDark(stored === "true");
       }
    }, []);

  // update map style and restore layers when dark mode changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        localStorage.setItem("northstar-dark-mode", isDark.toString());

        // when the new style loads, restore all layers
        map.once("style.load", () => {
            MapLayers.restoreAllLayers(map, isDark); // re-add all crime layers with theme-aware styling
        });

        // switch style (this triggers 'style.load')
        map.setStyle(isDark ? darkStyle : lightStyle);
    }, [isDark]);

    useEffect(() => {
        const bounds = new mapboxgl.LngLatBounds(
            [-79.603709, 43.576155],
            [-79.132967, 43.878211]
        );
        // initialize the map
        mapRef.current = new mapboxgl.Map({
            container: mapContainer.current!,
            style: isDark ? darkStyle : lightStyle,
            zoom: 12,
            center: [-79.38097, 43.64549],
            maxBounds: bounds,
            minZoom: 11,
            maxZoom: 20,
        });

        mapRef.current.on("click", async (e) => {
            // If there is a current marker remove it and set the location to null
            // Double click to remove marker
            if (markerRef.current){
                reset_marker();
                return;
            }

            // Create a new marker at the clicked location
            const lng = e.lngLat.lng;
            const lat = e.lngLat.lat;
            markerRef.current = new mapboxgl.Marker({ color: "#007AFF" })
                .setLngLat([lng, lat])
                .addTo(mapRef.current!);

            // Reverse geocode the clicked location to get address details
            const response = await geocoder.reverse(e.lngLat, {
                types: new Set(["address", "street", "place", "neighborhood"]),
                limit: 1,
            });

            const feat = response.features?.[0];
            console.log(JSON.stringify(feat, null, 2));

            if (feat) {
                setSelectedLocation({
                    coords: [lng, lat] as [number, number],
                    feature: feat
                });
            }
        });

        // initialize layers on first load
        mapRef.current.on("load", () => {
            MapLayers.restoreAllLayers(mapRef.current!, isDark); // load all datasets with brightness depending on theme
        });

        setMapReady(true);
        return () => mapRef.current?.remove();
    }, []);

    // Update marker for start coordinate
    useEffect(() => {
        if (!mapRef.current) return;
        // remove old marker
        startMarkerRef.current?.remove();

        if (startCoordinates) {
            // add a new one
            startMarkerRef.current = new mapboxgl.Marker({ color: "green" })
                .setLngLat(startCoordinates)
                .addTo(mapRef.current);
        }
    }, [startCoordinates]);

    // when endCoordinates changes, update the end marker
    useEffect(() => {
        if (!mapRef.current) return;
        // remove old marker
        endMarkerRef.current?.remove();

        if (endCoordinates) {
            // add a new one
            endMarkerRef.current = new mapboxgl.Marker({ color: "red" })
                .setLngLat(endCoordinates)
                .addTo(mapRef.current);
        }
    }, [endCoordinates]);

    // Always ready to load the path
    useEffect(() => {
            if (!mapReady || !startCoordinates || !endCoordinates) return;
            const map = mapRef.current!;

            (async () => {
                const coordStr = `${startCoordinates[0]},${startCoordinates[1]};` +
                    `${endCoordinates[0]},${endCoordinates[1]}`;
                const { data } = await axios.get(
                    `https://api.mapbox.com/directions/v5/mapbox/${transportMode}/${coordStr}`, {
                        params: {
                            alternatives: true,
                            overview:     "full",
                            geometries:   "geojson",
                            access_token: mapboxgl.accessToken,
                        }
                    }
                );
                const routes: Array<{ geometry: GeoJSON.LineString }> = data.routes;
                if (!routes.length) return;

                // 1) Clear old route, markers, and any prior sources/layers
                map.getStyle().layers
                    .filter(l => l.id.startsWith("route") || l.id === "pins")
                    .forEach(l => {
                        if (map.getLayer(l.id))  map.removeLayer(l.id);
                        if (map.getSource(l.id)) map.removeSource(l.id);
                    });

                // 2) Draw the primary route (id="route0") as before…
                const r = routes[0];
                map.addSource("route0", {
                    type:        "geojson",
                    data:        r.geometry,
                    lineMetrics: true
                });
                const topLayerId = map.getStyle().layers?.find(l => l.type === "symbol")?.id;
                map.addLayer(
                    {
                        id:     "route0",
                        type:   "line",
                        source: "route0",
                        layout: {
                            "line-cap":  "round",
                            "line-join": "round"
                        },
                        paint: {
                            "line-gradient": [
                                "interpolate", ["linear"], ["line-progress"],
                                0,   "#1E90FF",
                                0.5, "#00D4FF",
                                1,   "#1E90FF"
                            ],
                            "line-width":             5,
                            "line-opacity":           0.9,
                            "line-emissive-strength": 1
                        }
                    },
                    topLayerId
                );

                // 3) Add a GeoJSON source for two circle markers
                map.addSource("pins", {
                    type: "geojson",
                    data: {
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: startCoordinates!
                                },
                                properties: {}
                            },
                            {
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: endCoordinates!
                                },
                                properties: {}
                            }
                        ]
                    }
                });

                map.addLayer({
                    id:     "pins",
                    type:   "circle",
                    source: "pins",
                    paint: {
                        "circle-radius":       8,
                        "circle-color":        "#ffffff",
                        "circle-stroke-color": "#007AFF",
                        "circle-stroke-width": 2,
                        "circle-emissive-strength": 1
                    }
                });

                // setStartCoordinates(null);
                // setEndCoordinates(null);
            })();
        }, [mapReady, startCoordinates, endCoordinates, transportMode]);


    // toggle dark/light mode
    const toggleStyle = () => {
        setIsDark((d) => !d);
    };

    return (
        <div className={styles.pageWrapper}>
            <TransportModeSelector
                transportMode={transportMode}
                setTransportMode={setTransportMode}
            />

            <MapSettingsSidebar map={mapRef.current} isDark={isDark}/>

            <aside className={`${styles.infoPanel} ${
                selectedLocation ? styles.infoPanelOpen : ""
            }`}>
                {selectedLocation && (
                    <>
                        <InfoPanel feature={selectedLocation.feature}/>

                        <div className={styles.buttonGroup}>
                            {/* Primary action toggles between Set/Replace Origin */}
                            <button
                                className={styles.actionButton}
                                onClick={() => {
                                    setStartCoordinates(selectedLocation.coords);
                                    setStartAddress(selectedLocation.feature.properties.name);
                                    reset_marker();
                                }}
                            >
                                Set as Start <FaArrowUp />
                            </button>

                            <button
                                className={styles.actionButton}
                                onClick={() => {
                                    setEndCoordinates(selectedLocation.coords);
                                    setEndAddress(selectedLocation.feature.properties.name);
                                    reset_marker();
                                }}
                            >
                                Set as End <FaArrowUp />
                            </button>
                        </div>
                    </>
                )}
            </aside>

            <div ref={mapContainer} className={styles.mapContainer}/>
            {mapReady && (
                <div className={styles.searchRow}>
                    <div className={styles.searchContainer}>
                        <SearchBox
                            accessToken={accessToken? accessToken : ""}
                            options={{
                                language: 'en',
                                bbox:[
                                    [-79.603709, 43.576155],
                                    [-79.132967, 43.878211]],
                                limit: 5,
                                country: 'CA'
                            }}
                            map={mapRef.current}
                            mapboxgl={mapboxgl}
                            value={startAddress}
                            onChange={(d: string) => {
                                setStartAddress(d);
                                setStartCoordinates(null)
                            }}
                            marker={true}
                            placeholder={"Start Address"}
                            onRetrieve={(res: SearchBoxRetrieveResponse) => {
                                const feat = res.features[0];
                                console.log(JSON.stringify(feat, null, 2));
                                setStartCoordinates(feat.geometry.coordinates as [number, number]);
                            }}
                        />
                    </div>
                    <button
                        className={styles.swapButton}
                        onClick={() => {
                            const startA = startAddress;
                            const endA = endAddress;
                            const startC = startCoordinates;
                            const endC = endCoordinates;
                            setEndCoordinates(startC);
                            setStartCoordinates(endC);
                            setEndAddress(startA);
                            setStartAddress(endA);

                        }}
                        >
                        <IconContext value={{
                            color: "#000000",
                            size: "20px",
                        }}>
                            <IoMdSwap/>
                        </IconContext>
                    </button>

                    <div className={`${styles.searchContainer} ${styles.searchContainerEnd}`}>
                        <SearchBox
                            accessToken={accessToken? accessToken : ""}
                            options={{
                                language: 'en',
                                bbox:[
                                    [-79.603709, 43.576155],
                                    [-79.132967, 43.878211]],
                                limit: 5,
                                country: 'CA'
                            }}
                            map={mapRef.current}
                            mapboxgl={mapboxgl}
                            value={endAddress}
                            onChange={(d: string) => {
                                setEndAddress(d);
                                setEndCoordinates(null)
                            }}
                            marker={true}
                            placeholder={"End Address"}
                            onRetrieve={(res: SearchBoxRetrieveResponse) => {
                                const feat = res.features[0];
                                setEndCoordinates(feat.geometry.coordinates as [number, number]);
                            }}
                        />
                    </div>
                </div>
            )}

            <button
                onClick={toggleStyle}
                className={`${styles.toggleButton} ${
                  isDark ? styles.darkToggle : styles.lightToggle
                }`}
            >
            <IconContext.Provider
                value={{
                color: isDark ? "#ffffff" : "#000000",
                size: "20px",
                }}
            >
                <IoMoon />
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
