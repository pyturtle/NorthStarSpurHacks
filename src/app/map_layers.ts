import mapboxgl from "mapbox-gl";

import shootings from "@/public/layer-data/shootings_2023-2025.json";
import assaults from "@/public/layer-data/assaults_2023-2025.json";
import autoThefts from "@/public/layer-data/auto thefts_2023-2025.json";
import bicycleThefts from "@/public/layer-data/bicycle thefts_2023-2025.json";
import homicides from "@/public/layer-data/homicides_2023-2025.json";
import motorThefts from "@/public/layer-data/motor thefts_2023-2025.json";
import robberies from "@/public/layer-data/robberies_2023-2025.json";
import theftsOver from "@/public/layer-data/thefts over open_2023-2025.json";

// All datasets to be visualized
const datasets = [
  { id: "shootings", data: shootings },
  { id: "assaults", data: assaults },
  { id: "auto_thefts", data: autoThefts },
  { id: "bicycle_thefts", data: bicycleThefts },
  { id: "homicides", data: homicides },
  { id: "motor_thefts", data: motorThefts },
  { id: "robberies", data: robberies },
  { id: "thefts_over_open", data: theftsOver }
];

export class MapLayers {
  /**
   * Group features that share the same lat/lng coordinate.
   */
  private static groupFeaturesByLocation(
    data: GeoJSON.FeatureCollection
  ): Map<string, GeoJSON.Feature[]> {
    const map = new Map<string, GeoJSON.Feature[]>();
    for (const feat of data.features) {
      const [lng, lat] = (feat.geometry as any).coordinates;
      const key = `${lng.toFixed(6)},${lat.toFixed(6)}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(feat);
    }
    return map;
  }

  /**
   * Create a single bar (extruded polygon) placed in a grid layout around a center.
   * Each bar represents the count of incidents at a location for a dataset.
   */
  private static buildBarSegment(
    center: [number, number],
    index: number,
    total: number,
    count: number,
    color: string
  ): GeoJSON.Feature {
    const barWidth = 0.00003;
    const spacing = 0.00007;

    const gridSize = Math.ceil(Math.sqrt(total));
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    const dx = (col - (gridSize - 1) / 2) * spacing;
    const dy = (row - (gridSize - 1) / 2) * spacing;

    const [lng, lat] = center;
    const lngOffset = lng + dx;
    const latOffset = lat + dy;

    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [lngOffset - barWidth, latOffset - barWidth],
          [lngOffset + barWidth, latOffset - barWidth],
          [lngOffset + barWidth, latOffset + barWidth],
          [lngOffset - barWidth, latOffset + barWidth],
          [lngOffset - barWidth, latOffset - barWidth]
        ]]
      },
      properties: {
        extrusionHeight: count * 5, // bar height proportional to frequency
        extrusionBase: 0,
        color: color
      }
    };
  }

  /**
   * Add clustered points and expanded extruded bars to map.
   */
  private static addClusterAndExpandedLayers(
    map: mapboxgl.Map,
    id: string,
    data: GeoJSON.FeatureCollection,
    paint: mapboxgl.FillExtrusionLayerSpecification["paint"],
    level: number
  ) {
    const grouped = this.groupFeaturesByLocation(data);
    const clustered: GeoJSON.Feature[] = [];
    const expanded: GeoJSON.Feature[] = [];

    grouped.forEach((group, key) => {
      const [lng, lat] = key.split(",").map(Number);
      clustered.push({ ...group[0], geometry: { type: "Point", coordinates: [lng, lat] } });
      expanded.push(
        this.buildBarSegment(
          [lng, lat],
          level,
          datasets.length,
          group.length,
          paint["circle-color"] as string
        )
      );
    });

    const clusterSourceId = `${id}-cluster`;
    const expandedSourceId = `${id}-extruded`;

    if (!map.getSource(clusterSourceId)) {
      map.addSource(clusterSourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: clustered },
      });
    }

    if (!map.getLayer(`${id}-cluster`)) {
      map.addLayer({
        id: `${id}-cluster`,
        type: "circle",
        source: clusterSourceId,
        paint: {
          "circle-color": paint["circle-color"] || "#888",
          "circle-radius": 6,
          "circle-opacity": 0.8,
          "circle-emissive-strength": 1.5
        },
        minzoom: 0,
        maxzoom: 14.9,
      });
    }

    if (!map.getSource(expandedSourceId)) {
      map.addSource(expandedSourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: expanded },
      });
    }

    if (!map.getLayer(`${id}-extruded`)) {
      map.addLayer({
        id: `${id}-extruded`,
        type: "fill-extrusion",
        source: expandedSourceId,
        paint: {
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-height": ["get", "extrusionHeight"],
          "fill-extrusion-base": ["get", "extrusionBase"],
          "fill-extrusion-opacity": 0.8,
          "fill-extrusion-emissive-strength": 1.5
        },
        minzoom: 15,
        maxzoom: 24,
      });
    }
  }

  /**
   * Add all datasets to the map with proper extrusion and coloring by theme.
   */
  static restoreAllLayers(map: mapboxgl.Map, isDark: boolean) {
    const datasetRanks = datasets
      .map(d => ({ id: d.id, size: d.data.features.length }))
      .sort((a, b) => b.size - a.size)
      .map((d, i) => ({ id: d.id, level: i }));

    for (const { id, data } of datasets) {
      const level = datasetRanks.find(r => r.id === id)?.level || 0;
      this.addClusterAndExpandedLayers(map, id, data, {
        "circle-color": this.getColorForId(id, isDark)
      }, level);
    }
  }

  /**
   * Return color per dataset based on light/dark mode.
   */
  private static getColorForId(id: string, isDark: boolean): string {
    const darkColors: Record<string, string> = {
      shootings: "#ff0000",
      assaults: "#e67300",
      auto_thefts: "#e600e6",
      bicycle_thefts: "#4dc3ff",
      homicides: "#000000",
      motor_thefts: "#9900cc",
      robberies: "#006600",
      thefts_over_open: "#ffcc00",
    };

    const lightColors: Record<string, string> = {
      shootings: "#ff3333",
      assaults: "#ff9933",
      auto_thefts: "#ff66ff",
      bicycle_thefts: "#66d9ff",
      homicides: "#333333",
      motor_thefts: "#cc66ff",
      robberies: "#00b300",
      thefts_over_open: "#ffd700",
    };

    return (isDark ? darkColors : lightColors)[id] || "#777777";
  }
}