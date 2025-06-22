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
import { MapLayers } from "@/app/map_layers";
import Image from "next/image";
import styles from "./page.module.css";
import styles2 from "@/components/InfoPanel.module.css";
import InfoPanel from "@/components/InfoPanel";
import TransportModeSelector from "@/components/TransportModeSelector";
import { IoMdSwap } from "react-icons/io";
import dynamic from "next/dynamic";

const SearchBox = dynamic(
    // @ts-ignore
    () => import("@mapbox/search-js-react").then((mod) => mod.SearchBox),
    { ssr: false }
);

function getRiskClass(score: number) {
    if (score >= 75) return styles2.hazardHigh;
    if (score >= 50) return styles2.hazardMedium;
    if (score >= 25) return styles2.hazardLow;
    return styles2.hazardVeryLow;
}

const accessToken: string | undefined = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function Home() {
    // Ref to hold the map container and map instance
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map>(undefined);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const endMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const [activeRoute, setActiveRoute] = useState<GeoJSON.LineString | null>(null);
    const [activePins, setActivePins] = useState<[number, number][] | null>(null);
    const [routeInfo, setRouteInfo] = useState<{
        distance: number;
        duration: number;
        riskScore: number;
    } | null>(null);
    const [startAddress, setStartAddress] = useState("");
    const [endAddress, setEndAddress] = useState("");
    const [startCoordinates, setStartCoordinates] = useState<[number, number] | null>(null);
    const [endCoordinates, setEndCoordinates] = useState<[number, number] | null>(null);

    // State to hold selected location from map click
    const [selectedLocation, setSelectedLocation] = useState<{
        coords: [number, number];
        feature: any;
    } | null>(null);

  // UI and map state
  const [mapReady, setMapReady] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [transportMode, setTransportMode] = useState<"walking" | "cycling" | "driving-traffic">("walking");
  const [visualizationMode, setVisualizationMode] = useState<"dotmap" | "heatmap">("dotmap");
  const [satellite, setSatellite] = useState(false);

  // Map styles
  const darkStyle = "mapbox://styles/delecive/cmc3s3q3101vs01s67ouvbc4c";
  const lightStyle = "mapbox://styles/delecive/cmc3s07z9014101rx5r1f3brc";

  const geocoder = new GeocodingCore({ accessToken: accessToken });

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

  // Satellite effect
  useEffect(() => {
    if (!mapRef.current) return;
  
    const map = mapRef.current;
  
    const styleToUse = satellite
      ? "mapbox://styles/mapbox/satellite-streets-v12"
      : isDark
        ? darkStyle
        : lightStyle;
  
    map.once("style.load", () => {
      if (satellite) {
        map.addSource("mapbox-dem", {
          "type": "raster-dem",
          "url": "mapbox://mapbox.mapbox-terrain-dem-v1",
          "tileSize": 512,
          "maxzoom": 14,
        });
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
        map.setPitch(60);
        map.setBearing(-30);
      } else {
        map.setTerrain(null);
        map.setPitch(0);
        map.setBearing(0);
      }
      MapLayers.restoreAllLayers(map, isDark, visualizationMode);
        if (activeRoute && activePins) {
            restoreRouteAndPins(map, activeRoute, activePins);
        }

        // You can also restore route/pins here if needed
    });
    map.setStyle(styleToUse);
  }, [satellite]);

  // Dark/Light effect
  useEffect(() => {
    if (!mapRef.current) return;
  
    const map = mapRef.current;
  
    // Don't setStyle if satellite is ON
    if (satellite) {
      // Just adjust layers' paint properties
      MapLayers.restoreAllLayers(map, isDark, visualizationMode);
        if (activeRoute && activePins) {
            restoreRouteAndPins(map, activeRoute, activePins);
        }
        return;
    }
  
    // When NOT satellite, just switch the style
    map.once("style.load", () => {
      MapLayers.restoreAllLayers(map, isDark, visualizationMode);
        if (activeRoute && activePins) {
            restoreRouteAndPins(map, activeRoute, activePins);
        }
    });
    map.setStyle(isDark ? darkStyle : lightStyle);
  }, [isDark]);

  // Re-render layers when visualization mode changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    localStorage.setItem("northstar-visualization-mode", visualizationMode);
    MapLayers.restoreAllLayers(mapRef.current, isDark, visualizationMode);
      if (activeRoute && activePins) {
          restoreRouteAndPins(mapRef.current, activeRoute, activePins);
      }
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

    mapRef.current.on("load", () => {
        if (satellite) {
          mapRef.current?.addSource("mapbox-dem", {
            "type": "raster-dem",
            "url": "mapbox://mapbox.mapbox-terrain-dem-v1",
            "tileSize": 512,
            "maxzoom": 14
          });
          mapRef.current?.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
          mapRef.current?.setPitch(60);
          mapRef.current?.setBearing(-30);
        }
      
        MapLayers.restoreAllLayers(mapRef.current!, isDark, visualizationMode);
        if (activeRoute && activePins) {
            restoreRouteAndPins(mapRef.current!, activeRoute, activePins);
        }
    });

    mapRef.current.on("load", () => {
      MapLayers.restoreAllLayers(mapRef.current!, isDark, visualizationMode);
        if (activeRoute && activePins) {
            restoreRouteAndPins(mapRef.current!, activeRoute, activePins);
        }
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

    // Always ready to load the path
    useEffect(() => {
        if (!mapReady || !startCoordinates || !endCoordinates) return;
        const map = mapRef.current!;

        (async () => {
            // Build origin/destination as "lat,lng"
            const origin      = `${startCoordinates[1]},${startCoordinates[0]}`;
            const destination = `${endCoordinates[1]},${endCoordinates[0]}`;

            const originCoords = [startCoordinates[0], startCoordinates[1]] as [number, number];
            const destinationCoords = [endCoordinates[0], endCoordinates[1]] as [number, number];

            // 1) Fetch scored routes from your server, including transportMode
            const resp = await fetch(
                `/api/pathfinding?` +
                `origin=${origin}&` +
                `destination=${destination}&` +
                `mode=${transportMode}`
            );
            const { routes }: {
                routes: Array<{
                    geometry:  GeoJSON.LineString;
                    riskScore: number;
                    distance:  number;
                    duration:  number;
                }>;
            } = await resp.json();

            if (!routes.length) return;

            // 2) Clear any old route or pin layers & sources
            map.getStyle().layers
                .filter(l => l.id.startsWith("route") || l.id === "pins")
                .forEach(l => {
                    if (map.getLayer(l.id))  map.removeLayer(l.id);
                    if (map.getSource(l.id)) map.removeSource(l.id);
                });

            // 3) Draw the primary route (route0), color‐coded by riskScore
            const r = routes[0];
            setRouteInfo({
                distance:  r.distance,      // meters
                duration:  r.duration,      // seconds
                riskScore: r.riskScore
            });
            map.addSource("route0", {
                type:        "geojson",
                data:        r.geometry,
                lineMetrics: true
            });
            const topLayerId = map.getStyle().layers
                ?.find(layer => layer.type === "symbol")?.id;
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

            // 4) Re-add start/end pins as white circles with blue stroke
            map.addSource("pins", {
                type: "geojson",
                data: {
                    type: "FeatureCollection",
                    features: [
                        {
                            type:       "Feature",
                            geometry:   { type: "Point", coordinates: originCoords },
                            properties: {}
                        },
                        {
                            type:       "Feature",
                            geometry:   { type: "Point", coordinates: destinationCoords },
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
                    "circle-radius":            8,
                    "circle-color":             "#ffffff",
                    "circle-stroke-color":      "#007AFF",
                    "circle-stroke-width":      2,
                    "circle-emissive-strength": 1
                }},
                topLayerId
            );
            setActiveRoute(r.geometry);
            setActivePins([originCoords, destinationCoords]);
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
        satellite={satellite}
        setSatellite={setSatellite}
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
        className={`${styles.toggleButton} ${isDark ? styles.darkToggle : styles.lightToggle}`}
      >
        <IconContext.Provider value={{ color: isDark ? "#ffffff" : "#000000", size: "20px" }}>
          <IoMoon />
        </IconContext.Provider>
      </button>
        {routeInfo && (
            <div className={`${styles2.infoContent} ${styles.routeSummary}`}>
                <div className={styles2.infoBox}>
                    <h3 className={styles2.infoTitle}>Route Summary</h3>

                    {/* Row: left = Distance/ETA, right = Badge */}
                    <div
                        style={{
                            display:       "flex",
                            justifyContent:"space-between",
                            alignItems:    "center",
                            gap:           "12px"
                        }}
                    >
                        {/* Left: vertical list */}
                        <ul
                            className={styles2.contextList}
                            style={{ margin: 0, padding: 0, listStyle: "none" }}
                        >
                            <li>
                                <strong>Distance:</strong>{" "}
                                {(routeInfo.distance / 1000).toFixed(1)} km
                            </li>
                            <li>
                                <strong>ETA:</strong>{" "}
                                {Math.round(routeInfo.duration / 60)} min
                            </li>
                        </ul>

                        {/* Right: inline badge */}
                        <div
                            className={`${styles2.hazardBadge} ${getRiskClass(
                                routeInfo.riskScore
                            )} pop`}
                            style={{ minWidth: "36px", textAlign: "center" }}
                        >
                            <span>{routeInfo.riskScore}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
      <Image src={"/NorthStarLogo.svg"} alt="NorthStar Logo" width={100} height={100} className={styles.logo} />
    </div>
  );
}

function restoreRouteAndPins(
    map: mapboxgl.Map,
    route: GeoJSON.LineString,
    pins: [number, number][]
) {
    map.addSource("route0", {
        type: "geojson",
        data: route,
        lineMetrics: true,
    });

    const topLayerId = map.getStyle().layers?.find(l => l.type === "symbol")?.id;

    map.addLayer(
        {
            id: "route0",
            type: "line",
            source: "route0",
            layout: {
                "line-cap": "round",
                "line-join": "round",
            },
            paint: {
                "line-gradient": [
                    "interpolate", ["linear"], ["line-progress"],
                    0, "#1E90FF",
                    0.5, "#00D4FF",
                    1, "#1E90FF"
                ],
                "line-width": 5,
                "line-opacity": 0.9,
                "line-emissive-strength": 1
            },
        },
        topLayerId
    );

    map.addSource("pins", {
        type: "geojson",
        data: {
            type: "FeatureCollection",
            features: pins.map(coord => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: coord },
                properties: {},
            }))
        }
    });

    map.addLayer({
        id: "pins",
        type: "circle",
        source: "pins",
        paint: {
            "circle-radius": 8,
            "circle-color": "#ffffff",
            "circle-stroke-color": "#007AFF",
            "circle-stroke-width": 2,
            "circle-emissive-strength": 1,
        }
    }, topLayerId);
}