import mapboxgl from "mapbox-gl";

import shootings from "@/public/layer-data/shootings_2023-2025.json";
import assaults from "@/public/layer-data/assaults_2023-2025.json";
import autoThefts from "@/public/layer-data/auto thefts_2023-2025.json";
import bicycleThefts from "@/public/layer-data/bicycle thefts_2023-2025.json";
import homicides from "@/public/layer-data/homicides_2023-2025.json";
import motorThefts from "@/public/layer-data/motor thefts_2023-2025.json";
import robberies from "@/public/layer-data/robberies_2023-2025.json";
import theftsOver from "@/public/layer-data/thefts over open_2023-2025.json";

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
   * Spread overlapping features vertically using polygon extrusions (for real 3D tower rendering).
   * Each point becomes a small square polygon with a height set via level.
   * Longest section is on the ground, next section stacks on top, and so on (tallest at base).
   */
  private static spreadFeatures(
    features: GeoJSON.Feature[],
    center: [number, number],
    level: number
  ): GeoJSON.Feature[] {
    const towerBase = 0.00003;

    const sorted = [...features];
    sorted.sort((a, b) => JSON.stringify(b).length - JSON.stringify(a).length);

    let currentBase = 0;
    return sorted.map((feat, i) => {
      const height = 20;
      const base = currentBase;
      currentBase += height;

      const [lng, lat] = center;
      const dx = towerBase;
      const dy = towerBase;

      const polygon: GeoJSON.Feature = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [lng - dx, lat - dy],
            [lng + dx, lat - dy],
            [lng + dx, lat + dy],
            [lng - dx, lat + dy],
            [lng - dx, lat - dy]
          ]]
        },
        properties: {
          ...(feat.properties || {}),
          extrusionHeight: height,
          extrusionBase: base
        }
      };

      return polygon;
    });
  }

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
      if (group.length === 1) {
        clustered.push(group[0]);
        expanded.push(group[0]);
      } else {
        clustered.push({ ...group[0], geometry: { type: "Point", coordinates: [lng, lat] } });
        expanded.push(...this.spreadFeatures(group, [lng, lat], level));
      }
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
          "fill-extrusion-color": paint["circle-color"] || "#888",
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

  static restoreAllLayers(map: mapboxgl.Map, isDark: boolean) {
    const datasetRanks = datasets
      .map(d => ({ id: d.id, size: d.data.features.length }))
      .sort((a, b) => b.size - a.size)
      .map((d, i) => ({ id: d.id, level: i }));

    for (const { id, data } of datasets) {
      const level = datasetRanks.find(r => r.id === id)?.level || 0;
      this.addClusterAndExpandedLayers(map, id, data, {
        "circle-color": this.getColorForId(id)
      }, level);
    }
  }

  private static getColorForId(id: string): string {
    const colors: Record<string, string> = {
      shootings: "#ff0000",
      assaults: "#e67300",
      auto_thefts: "#e600e6",
      bicycle_thefts: "#4dc3ff",
      homicides: "#000000",
      motor_thefts: "#9900cc",
      robberies: "#006600",
      thefts_over_open: "#999900",
    };
    return colors[id] || "#777777";
  }
}