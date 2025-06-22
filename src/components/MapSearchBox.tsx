"use client";
import React, {useState} from "react";
import mapboxgl from "mapbox-gl";
import dynamic from "next/dynamic";
import 'mapbox-gl/dist/mapbox-gl.css';

// Dynamically import the SearchBox so it only runs in the browser
const SearchBox = dynamic(
    () => import("@mapbox/search-js-react").then((mod) => mod.SearchBox),
    { ssr: false }
);

const ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

interface Props {
    map: mapboxgl.Map | null;
    placeholder: string;
    onRetrieve: (coords: [number, number], feature: any) => void;
    inputValue: string;
    setInputValue: (value: string) => void;
    setCoordinate: (coords: [number, number] | null) => void;
}

export function MapSearchBox({ map, placeholder, onRetrieve, inputValue, setInputValue, setCoordinate }: Props) {
    if (!map) return null;
    const theme = {
        variables: {
            colorBackground:      "#ffffff",
            colorText:            "#222222",
            colorBackgroundHover: "#f5f5f5",
            colorPrimary:         "#007AFF",
            borderRadius:         "8px",
            boxShadow:            "0 2px 6px rgba(0,0,0,0.2)",
            padding:              "8px",
            unit:                 "16px",
            fontFamily:           "inherit",
            fontWeight:           "400",
        }
    };

    return (
        <SearchBox
            accessToken={ACCESS_TOKEN}
            options={{
                language: 'en',
                bbox:[
                    [-79.603709, 43.576155],
                    [-79.132967, 43.878211]],
                limit: 5,
                country: 'CA'

            }}
            map={map}
            mapboxgl={mapboxgl}
            value={inputValue}
            onChange={(d) => {
                setInputValue(d);
                setCoordinate(null)
            }}
            marker={true}
            placeholder={placeholder}
            onRetrieve={(res) => {
                const feat = res.features[0];
                onRetrieve(feat.center as [number, number], feat);
            }}
            theme={theme}
        />
    );
}
