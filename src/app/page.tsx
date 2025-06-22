"use client";

import axios from "axios";
import { length, along, circle, booleanPointInPolygon } from "@turf/turf";
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
import { IoMdSwap } from "react-icons/io";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function Home() {
  // Refs for map and markers
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const endMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // States for user-selected locations and coordinates
  const [startAddress, setStartAddress] = useState("");
  const [endAddress, setEndAddress] = useState("");
  const [startCoordinates, setStartCoordinates] = useState<[number, number] | null>(null);
  const [endCoordinates, setEndCoordinates] = useState<[number, number] | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ coords: [number, number]; feature: any; } | null>(null);

  // UI and map state
  const [mapReady, setMapReady] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [transportMode, setTransportMode] = useState<"walking" | "cycling" | "driving-traffic">("walking");
  const [visualizationMode, setVisualizationMode] = useState<"dotmap" | "heatmap">("dotmap");

  // Map styles
  const darkStyle = "mapbox://styles/delecive/cmc3s3q3101vs01s67ouvbc4c";
  const lightStyle = "mapbox://styles/delecive/cmc3s07z9014101rx5r1f3brc";

  const geocoder = new GeocodingCore({ accessToken: mapboxgl.accessToken });

  // Clears selected marker on map
  const reset_marker = () => {
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = null;
    setSelectedLocation(null);
  };

  // Hydrate dark mode and visualization mode from local storage
  useLayoutEffect(() => {
    const storedDark = localStorage.getItem("northstar-dark-mode");
    if (storedDark !== null) setIsDark(storedDark === "true");

    const storedViz = localStorage.getItem("northstar-visualization-mode");
    if (storedViz === "heatmap" || storedViz === "dotmap") setVisualizationMode(storedViz);
  }, []);

  // Update map style and restore layers when dark mode changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    localStorage.setItem("northstar-dark-mode", isDark.toString());

    map.once("style.load", () => {
      MapLayers.restoreAllLayers(map, isDark, visualizationMode);
    });

    map.setStyle(isDark ? darkStyle : lightStyle);
  }, [isDark]);

  // Re-render layers when visualization mode changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    localStorage.setItem("northstar-visualization-mode", visualizationMode);
    MapLayers.restoreAllLayers(mapRef.current, isDark, visualizationMode);
  }, [visualizationMode]);

  // Initialize map instance and set click handler
  useEffect(() => {
    const bounds = new mapboxgl.LngLatBounds(
      [-79.603709, 43.576155],
      [-79.132967, 43.878211]
    );

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: isDark ? darkStyle : lightStyle,
      zoom: 12,
      center: [-79.38097, 43.64549],
      maxBounds: bounds,
      minZoom: 11,
      maxZoom: 20,
    });

    // Handle map click for reverse geocoding
    mapRef.current.on("click", async (e) => {
      if (markerRef.current) {
        reset_marker();
        return;
      }

      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;
      markerRef.current = new mapboxgl.Marker({ color: "#007AFF" })
        .setLngLat([lng, lat])
        .addTo(mapRef.current!);

      const response = await geocoder.reverse(e.lngLat, {
        types: new Set(["address", "street", "place", "neighborhood"]),
        limit: 1,
      });

      const feat = response.features?.[0];
      if (feat) {
        setSelectedLocation({ coords: [lng, lat], feature: feat });
      }
    });

    mapRef.current.on("load", () => {
      MapLayers.restoreAllLayers(mapRef.current!, isDark, visualizationMode);
    });

    setMapReady(true);
    return () => mapRef.current?.remove();
  }, []);

  // Update start/end markers
  useEffect(() => {
    if (!mapRef.current) return;
    startMarkerRef.current?.remove();
    if (startCoordinates) {
      startMarkerRef.current = new mapboxgl.Marker({ color: "green" })
        .setLngLat(startCoordinates)
        .addTo(mapRef.current);
    }
  }, [startCoordinates]);

  useEffect(() => {
    if (!mapRef.current) return;
    endMarkerRef.current?.remove();
    if (endCoordinates) {
      endMarkerRef.current = new mapboxgl.Marker({ color: "red" })
        .setLngLat(endCoordinates)
        .addTo(mapRef.current);
    }
  }, [endCoordinates]);

  // Route drawing logic
  useEffect(() => {
    if (!mapReady || !startCoordinates || !endCoordinates) return;
    const map = mapRef.current!;
    (async () => {
      const coordStr = `${startCoordinates[0]},${startCoordinates[1]};${endCoordinates[0]},${endCoordinates[1]}`;
      const { data } = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/${transportMode}/${coordStr}`,
        {
          params: {
            alternatives: true,
            overview: "full",
            geometries: "geojson",
            access_token: mapboxgl.accessToken,
          },
        }
      );

      const routes: Array<{ geometry: GeoJSON.LineString }> = data.routes;
      if (routes.length > 0) {
        const r = routes[0];
        const id = `route0`;

        map.getStyle().layers?.filter(l => l.id.startsWith("route"))
          .forEach(l => {
            if (map.getLayer(l.id)) map.removeLayer(l.id);
            if (map.getSource(l.id)) map.removeSource(l.id);
          });

        const topLayerId = map.getStyle().layers?.find(l => l.type === "symbol")?.id;

        map.addSource(id, { type: "geojson", data: r.geometry, lineMetrics: true });

        map.addLayer({
          id,
          type: "line",
          source: id,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-gradient": [
              "interpolate",
              ["linear"],
              ["line-progress"],
              0, "#1E90FF",
              0.5, "#00D4FF",
              1, "#1E90FF"
            ],
            "line-width": 5,
            "line-opacity": 0.9,
            "line-emissive-strength": 1
          }
        }, topLayerId);
      }
    })();
  }, [mapReady, startCoordinates, endCoordinates, transportMode]);

  // Toggle dark/light mode
  const toggleStyle = () => {
    setIsDark((d) => !d);
  };

  return (
    <div className={styles.pageWrapper}>
      <TransportModeSelector transportMode={transportMode} setTransportMode={setTransportMode} />

      <MapSettingsSidebar
        map={mapRef.current}
        isDark={isDark}
        visualizationMode={visualizationMode}
        setVisualizationMode={setVisualizationMode}
      />

      <aside className={`${styles.infoPanel} ${selectedLocation ? styles.infoPanelOpen : ""}`}>
        {selectedLocation && (
          <>
            <InfoPanel feature={selectedLocation.feature} />
            <div className={styles.buttonGroup}>
              <button
                className={styles.actionButton}
                onClick={() => {
                  setStartCoordinates(selectedLocation.coords);
                  setStartAddress(selectedLocation.feature.properties.name);
                  reset_marker();
                }}
              >Set as Start <FaArrowUp /></button>

              <button
                className={styles.actionButton}
                onClick={() => {
                  setEndCoordinates(selectedLocation.coords);
                  setEndAddress(selectedLocation.feature.properties.name);
                  reset_marker();
                }}
              >Set as End <FaArrowUp /></button>
            </div>
          </>
        )}
      </aside>

      <div ref={mapContainer} className={styles.mapContainer} />

      {mapReady && (
        <div className={styles.searchRow}>
          <div className={styles.searchContainer}>
            <MapSearchBox
              map={mapRef.current}
              placeholder="Start address"
              onRetrieve={setStartCoordinates}
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
              <IconContext value={{ color: "#000000", size: "20px" }}>
                <IoMdSwap />
              </IconContext>
            </button>
          </div>
          <div className={`${styles.searchContainer} ${styles.searchContainerEnd}`}>
            <MapSearchBox
              map={mapRef.current}
              placeholder="End address"
              onRetrieve={setEndCoordinates}
              inputValue={endAddress}
              setInputValue={setEndAddress}
              setCoordinate={setEndCoordinates}
            />
          </div>
        </div>
      )}

      <button
        onClick={toggleStyle}
        className={`${styles.toggleButton} ${isDark ? styles.darkToggle : styles.lightToggle}`}
      >
        <IconContext.Provider value={{ color: isDark ? "#ffffff" : "#000000", size: "20px" }}>
          <IoMoon />
        </IconContext.Provider>
      </button>

      <Image src={NorthStarLogo} alt="NorthStar Logo" width={100} height={100} className={styles.logo} />
    </div>
  );
}