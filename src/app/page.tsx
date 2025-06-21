"use client";
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';
import { IconContext } from "react-icons";
import { IoMoon } from "react-icons/io5";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function Home() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/dark-v11");

  useEffect(() => {
    const bounds = new mapboxgl.LngLatBounds(
        [-79.603709, 43.576155],
        [-79.132967, 43.878211]
    );

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      zoom: 14,
      maxBounds: bounds,
      minZoom: 11,
      maxZoom: 20
    });

    map.fitBounds(bounds, {
      padding: 20,
      duration: 0
    });

    mapRef.current = map;

    return () => map.remove();
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(mapStyle);
    }
  }, [mapStyle]);

  const isDark = mapStyle.includes("dark");

  const toggleStyle = () => {
    setMapStyle(isDark
        ? "mapbox://styles/mapbox/light-v11"
        : "mapbox://styles/mapbox/dark-v11"
    );
  };

  return (
      <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
        <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />

        {/* Floating Moon Button */}
        <button
            onClick={toggleStyle}
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              background: isDark ? '#1e1e1e' : '#ffffff',
              border: 'none',
              borderRadius: '50%',
              padding: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
        >
          <IconContext.Provider value={{ color: isDark ? "#ffffff" : "#000000", size: "20px" }}>
            <IoMoon />
          </IconContext.Provider>
        </button>
      </div>
  );
}