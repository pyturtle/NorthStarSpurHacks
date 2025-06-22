import mapboxgl from "mapbox-gl";

import shootings from "@/public/layer-data/shootings_2023-2025.json";
import assaults from "@/public/layer-data/assaults_2023-2025.json";
import autoThefts from "@/public/layer-data/auto thefts_2023-2025.json";
import bicycleThefts from "@/public/layer-data/bicycle thefts_2023-2025.json";
import homicides from "@/public/layer-data/homicides_2023-2025.json";
import motorThefts from "@/public/layer-data/motor thefts_2023-2025.json";
import robberies from "@/public/layer-data/robberies_2023-2025.json";
import theftsOver from "@/public/layer-data/thefts over open_2023-2025.json";

const heatmapDatasets = [
  { id: "shootings", data: shootings },
  { id: "assaults", data: assaults },
  { id: "auto_thefts", data: autoThefts },
  { id: "bicycle_thefts", data: bicycleThefts },
  { id: "homicides", data: homicides },
  { id: "motor_thefts", data: motorThefts },
  { id: "robberies", data: robberies },
  { id: "thefts_over_open", data: theftsOver },
];

export class HeatmapLayers {
  static addHeatmapLayers(map: mapboxgl.Map) {
    for (const { id, data } of heatmapDatasets) {
      const sourceId = `${id}-heatmap-source`;
      const layerId = `${id}-heatmap-layer`;

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: "geojson",
          data,
        });
      }

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: "heatmap",
          source: sourceId,
          maxzoom: 18,
          paint: {
            // Use intensity, radius, and color ramp for heatmap rendering
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 18, 3],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 18, 20],
            "heatmap-opacity": 0.75,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, "rgba(0, 0, 255, 0)",
              0.2, "blue",
              0.4, "cyan",
              0.6, "lime",
              0.8, "yellow",
              1, "red"
            ]
          },
        });
      }
    }
  }
}