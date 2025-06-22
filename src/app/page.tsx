"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GeocodingCore } from "@mapbox/search-js-core";
import mapboxgl from "mapbox-gl";
import { MapSettingsSidebar } from "@/components/MapSettings";
import { MapSearchBox } from "@/components/MapSearchBox";
import { IconContext } from "react-icons";
import { IoMoon } from "react-icons/io5";
import { FaArrowUp } from "react-icons/fa";
import NorthStarLogo from "@/public/NorthStarLogo.svg";
import { MapLayers } from "@/app/map_layers";
import Image from "next/image";
import styles from "./page.module.css";
import InfoPanel from "@/components/InfoPanel";
import TransportModeSelector from "@/components/TransportModeSelector";
import CrimeLegend from "@/components/CrimeLegend";
import { IoMdSwap } from "react-icons/io";


mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function Home() {
    // Ref to hold the map container and map instance
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
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
  const [transportMode, setTransportMode] = useState<"walk" | "bike" | "car">("walk");

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

            <MapSettingsSidebar/>

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

                        <InfoPanel feature={selectedLocation.feature}/>

                    </>
                )}
            </aside>

            <div ref={mapContainer} className={styles.mapContainer}/>
            {mapReady && (
                <div className={styles.searchRow}>
                    <div className={styles.searchContainer}>
                        <MapSearchBox
                            map={mapRef.current}
                            placeholder="Start address"
                            onRetrieve={(coords) => {
                                setStartCoordinates(coords);
                            }}
                            inputValue={startAddress}
                            setInputValue={setStartAddress}
                            setCoordinate={setStartCoordinates}
                        />
                    </div>
                    <div className={styles.swapContainer}>
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
                    </div>
                    <div className={`${styles.searchContainer} ${styles.searchContainerEnd}`}>
                        <MapSearchBox
                            map={mapRef.current}
                            placeholder="End address"
                            onRetrieve={(coords) => {
                                setEndCoordinates(coords);
                            }}
                            inputValue={endAddress}
                            setInputValue={setEndAddress}
                            setCoordinate={setEndCoordinates}
                        />
                    </div>
                </div>
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
        <CrimeLegend isDark={isDark} />
    </div>
  );
}
