const DATASET_IDS = [
  "shootings",
  "assaults",
  "auto_thefts",
  "bicycle_thefts",
  "homicides",
  "motor_thefts",
  "robberies",
  "thefts_over_open",
] as const;

type DatasetId = typeof DATASET_IDS[number];

// Map each ID to its public URL (spaces must be URL-encoded)
const LAYER_URLS: Record<DatasetId, string> = {
  shootings:        "/layer-data/shootings_2023-2025.json",
  assaults:         "/layer-data/assaults_2023-2025.json",
  auto_thefts:      "/layer-data/auto%20thefts_2023-2025.json",
  bicycle_thefts:   "/layer-data/bicycle%20thefts_2023-2025.json",
  homicides:        "/layer-data/homicides_2023-2025.json",
  motor_thefts:     "/layer-data/motor%20thefts_2023-2025.json",
  robberies:        "/layer-data/robberies_2023-2025.json",
  thefts_over_open: "/layer-data/thefts%20over%20open_2023-2025.json",
};

export class HeatmapLayers {
  /** Fetch each GeoJSON at runtime and add a heatmap layer */
  static async addHeatmapLayers(map: mapboxgl.Map) {
    for (const id of DATASET_IDS) {
      const sourceId = `${id}-heatmap-source`;
      const layerId  = `${id}-heatmap-layer`;

      // 1) Fetch the JSON from public/
      const url  = LAYER_URLS[id];
      const data = (await fetch(url).then(res => {
        if (!res.ok) throw new Error(`Failed to load ${url}`);
        return res.json();
      })) as GeoJSON.FeatureCollection;

      // 2) Add source if missing
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: "geojson", data });
      }

      // 3) Add layer if missing
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id:       layerId,
          type:     "heatmap",
          source:   sourceId,
          maxzoom:  18,
          paint: {
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 18, 3],
            "heatmap-radius":    ["interpolate", ["linear"], ["zoom"], 0, 2, 18, 20],
            "heatmap-opacity":   0.75,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,   "rgba(0,0,255,0)",
              0.2, "blue",
              0.4, "cyan",
              0.6, "lime",
              0.8, "yellow",
              1.0, "red"
            ],
          }
        });
      }
    }
  }
}
