// Toggleable dataset definitions (no JSON imports!)
export const datasets = [
  { id: "shootings",         enabled: false },
  { id: "assaults",          enabled: false },
  { id: "auto_thefts",       enabled: false },
  { id: "bicycle_thefts",    enabled: false },
  { id: "homicides",         enabled: false },
  { id: "motor_thefts",      enabled: false },
  { id: "robberies",         enabled: false },
  { id: "thefts_over_open",  enabled: false },
];

// Public URLs to static GeoJSON assets (served from /public/layer-data)
const LAYER_URLS: Record<string, string> = {
  shootings:         "/layer-data/shootings_2023-2025.json",
  assaults:          "/layer-data/assaults_2023-2025.json",
  auto_thefts:       "/layer-data/auto%20thefts_2023-2025.json",
  bicycle_thefts:    "/layer-data/bicycle%20thefts_2023-2025.json",
  homicides:         "/layer-data/homicides_2023-2025.json",
  motor_thefts:      "/layer-data/motor%20thefts_2023-2025.json",
  robberies:         "/layer-data/robberies_2023-2025.json",
  thefts_over_open:  "/layer-data/thefts%20over%20open_2023-2025.json",
};

type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, any>;

export class MapLayers {
  // Restore icon image rendering using direct public URL paths
  private static addIconMapLayer(map: mapboxgl.Map, id: string, data: GeoJSON.FeatureCollection) {
    const sourceId = `${id}-iconmap`;
    const layerId = `${id}-iconmap`;
    const imageId = `${id}-icon`;
    const iconPath = `/icons/${id}.png`;

    // Jitter points into a grid layout around central coordinates
    const jittered = {
      ...data,
      features: data.features.map((feature, i) => {
        const spacing = 0.0002; // roughly 20 meters
        const cols = 10; // grid columns
        const row = Math.floor(i / cols);
        const col = i % cols;
        const dx = (col - cols / 2) * spacing;
        const dy = (row - 5) * spacing; // center it vertically
        const [lon, lat] = feature.geometry.coordinates;
        return {
          ...feature,
          geometry: {
            ...feature.geometry,
            coordinates: [lon + dx, lat + dy]
          }
        };
      })
    };

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: jittered
      });
    }

    // Always add the image only once
    if (!map.hasImage(imageId)) {
      const img = new Image(64, 64);
      img.onload = () => {
        if (!map.hasImage(imageId)) {
          map.addImage(imageId, img);
        }
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: "symbol",
            source: sourceId,
            layout: {
              "icon-image": imageId,
              "icon-size": 0.22,
              "icon-allow-overlap": false,
              "icon-ignore-placement": false,
              "icon-padding": 10
            }
          });
        }
      };
      img.src = iconPath;
    } else if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: "symbol",
        source: sourceId,
        layout: {
          "icon-image": imageId,
          "icon-size": 0.22,
          "icon-allow-overlap": false,
          "icon-ignore-placement": false,
          "icon-padding": 10
        }
      });
    }
  }

  // Restore layers for all enabled datasets based on the selected mode
  static restoreAllLayers(map: mapboxgl.Map, isDark: boolean, mode: "dotmap" | "heatmap" | "iconmap") {
    for (const { id } of datasets) {
      this.removeLayersForId(map, id);
    }

    const enabledDatasets = datasets.filter(d => d.enabled);
    const datasetRanks = enabledDatasets
      .map(d => ({ id: d.id, size: d.data.features.length }))
      .sort((a, b) => b.size - a.size)
      .map((d, i) => ({ id: d.id, level: i }));

    for (const { id, data } of enabledDatasets) {
      const level = datasetRanks.find(r => r.id === id)?.level || 0;
      const color = this.getColorForId(id, isDark);

      if (mode === "dotmap") {
        this.addClusterAndExpandedLayers(map, id, data, { "circle-color": color }, level);
      } else if (mode === "heatmap") {
        this.addHeatmapLayer(map, id, data, color);
      } else if (mode === "iconmap") {
        this.addIconMapLayer(map, id, data);
      }
    }
  }

  // Remove all possible layers and sources for a given dataset ID
  static removeLayersForId(map: mapboxgl.Map, id: string) {
    const layers = [`${id}-cluster`, `${id}-extruded`, `${id}-heatmap`, `${id}-iconmap`, `${id}-iconmap-debug`];
    const sources = [`${id}-cluster`, `${id}-extruded`, `${id}-heatmap`, `${id}-iconmap`, `${id}-iconmap-debug`];
    for (const layerId of layers) {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    }
    for (const sourceId of sources) {
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    }
  }

  // Choose consistent colors for each crime layer depending on dark/light theme
  private static getColorForId(id: string, isDark: boolean): string {
    const darkColors: Record<string, string> = {
      shootings: "#ff0000",
      assaults: "#e67300",
      auto_thefts: "#e600e6",
      bicycle_thefts: "#4dc3ff",
      homicides: "#000000",
      motor_thefts: "#9900cc",
      robberies: "#006600",
      thefts_over_open: "#ffcc00"
    };

    const lightColors: Record<string, string> = {
      shootings: "#ff3333",
      assaults: "#ff9933",
      auto_thefts: "#ff66ff",
      bicycle_thefts: "#66d9ff",
      homicides: "#333333",
      motor_thefts: "#cc66ff",
      robberies: "#00b300",
      thefts_over_open: "#ffd700"
    };

    return (isDark ? darkColors : lightColors)[id] || "#777777";
  }

  // Build bar segments for expanded layers
  private static buildBarSegment(center: [number, number], index: number, total: number, count: number, color: string): GeoJSON.Feature {
    const barWidth = 0.00003;
    const spacing  = 0.00007;
    const gridSize = Math.ceil(Math.sqrt(total));
    const row      = Math.floor(index / gridSize);
    const col      = index % gridSize;
    const dx       = (col - (gridSize - 1) / 2) * spacing;
    const dy       = (row - (gridSize - 1) / 2) * spacing;
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
        extrusionHeight: count * 5,
        extrusionBase:   0,
        color:           color
      }
    };
  }

  // Group features by their rounded lat/lng to prevent overlap in dotmap
  private static groupFeaturesByLocation(data: GeoJSON.FeatureCollection): Map<string, GeoJSON.Feature[]> {
    const map = new Map<string, GeoJSON.Feature[]>();
    for (const feat of data.features) {
      const [lng, lat] = (feat.geometry as any).coordinates;
      const key = `${lng.toFixed(6)},${lat.toFixed(6)}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(feat);
    }
    return map;
  }

  // Add circle + extrusion layer used in dotmap mode
  private static addClusterAndExpandedLayers(map: mapboxgl.Map, id: string, data: GeoJSON.FeatureCollection, paint: mapboxgl.FillExtrusionLayerSpecification["paint"], level: number) {
    const grouped = this.groupFeaturesByLocation(data);
  private static addHeatmapLayer(map: mapboxgl.Map, id: string, data: FeatureCollection, color: string) {
    const heatSourceId = `${id}-heatmap`;
    if (!map.getSource(heatSourceId)) {
      map.addSource(heatSourceId, { type: "geojson", data });
    }
    if (!map.getLayer(heatSourceId)) {
      map.addLayer({
        id: heatSourceId,
        type: "heatmap",
        source: heatSourceId,
        maxzoom: 20,
        paint: {
          "heatmap-weight": 1,
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 20, 3],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,   "rgba(0,0,255,0)",
            0.2, color,
            0.4, color,
            1,   "red"
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 20, 20],
          "heatmap-opacity": 0.8
        }
      });
    }
  }

  private static addClusterAndExpandedLayers(
      map: mapboxgl.Map,
      id: string,
      data: GeoJSON.FeatureCollection,
      paint: NonNullable<mapboxgl.CirclePaint>,
      level: number
  ) {
    const grouped: Map<string, GeoJSON.Feature[]> = this.groupFeaturesByLocation(data);
    const clustered: GeoJSON.Feature[] = [];
    const expanded:  GeoJSON.Feature[] = [];

    grouped.forEach((group, key) => {
      const [lng, lat] = key.split(",").map(Number);
      clustered.push({ ...group[0], geometry: { type: "Point", coordinates: [lng, lat] } });
      expanded.push(this.buildBarSegment([lng, lat], level, datasets.length, group.length, paint["circle-color"] as string));
    });

    const clusterSourceId = `${id}-cluster`;
    const expandedSourceId = `${id}-extruded`;

    if (!map.getSource(clusterSourceId)) {
      map.addSource(clusterSourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: clustered }
      });
    }
    if (!map.getLayer(`${id}-cluster`)) {
      map.addLayer({
        id: `${id}-cluster`,
        type: "circle",
        source: clusterSourceId,
        paint: {
          "circle-color":       paint["circle-color"] || "#888",
          "circle-radius":      6,
          "circle-opacity":     0.8,
          "circle-emissive-strength": 1.5
        },
        minzoom: 0,
        maxzoom: 15
      });
    }

    if (!map.getSource(expandedSourceId)) {
      map.addSource(expandedSourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: expanded }
      });
    }
    if (!map.getLayer(`${id}-extruded`)) {
      map.addLayer({
        id: `${id}-extruded`,
        type: "fill-extrusion",
        source: expandedSourceId,
        paint: {
          "fill-extrusion-color":       ["get", "color"],
          "fill-extrusion-height":      ["get", "extrusionHeight"],
          "fill-extrusion-base":        ["get", "extrusionBase"],
          "fill-extrusion-opacity":     0.8,
          "fill-extrusion-emissive-strength": 1.5
        },
        minzoom: 15,
        maxzoom: 24
      });
    }
  }

  /**
   * Restore all enabled dataset layers by fetching their GeoJSON at runtime.
   */
  static async restoreAllLayers(
      map: mapboxgl.Map,
      isDark: boolean,
      mode: "dotmap" | "heatmap"
  ) {
    // 1) remove any existing sources/layers for all datasets
    for (const { id } of datasets) {
      this.removeLayersForId(map, id);
    }

    // 2) filter only enabled datasets and fetch their data
    const enabled = datasets.filter(d => d.enabled);
    const loaded = await Promise.all(
        enabled.map(async ({ id }) => {
          const url = LAYER_URLS[id];
          const data = await fetch(url).then(r => r.json()) as FeatureCollection;
          return { id, data };
        })
    );

    // 3) rank them by feature count
    const ranks = loaded
        .map(d => ({ id: d.id, size: d.data.features.length }))
        .sort((a, b) => b.size - a.size)
        .map((d, i) => ({ id: d.id, level: i }));

    // 4) add each layer according to viz mode
    for (const { id, data } of loaded) {
      const lvl   = ranks.find(r => r.id === id)?.level || 0;
      const color = this.getColorForId(id, isDark);

      if (mode === "dotmap") {
        this.addClusterAndExpandedLayers(map, id, data, { "circle-color": color }, lvl);
      } else {
        this.addHeatmapLayer(map, id, data, color);
      }
    }
  }

  static removeLayersForId(map: mapboxgl.Map, id: string) {
    for (const suffix of ["-cluster","-extruded","-heatmap"]) {
      const lid = id + suffix;
      if (map.getLayer(lid))  map.removeLayer(lid);
      if (map.getSource(lid)) map.removeSource(lid);
    }
  }

  private static getColorForId(id: string, isDark: boolean): string {
    const dark: Record<string,string> = {
      shootings:       "#ff0000",
      assaults:        "#e67300",
      auto_thefts:     "#e600e6",
      bicycle_thefts:  "#4dc3ff",
      homicides:       "#000000",
      motor_thefts:    "#9900cc",
      robberies:       "#006600",
      thefts_over_open:"#ffcc00"
    };
    const light: Record<string,string> = {
      shootings:       "#ff3333",
      assaults:        "#ff9933",
      auto_thefts:     "#ff66ff",
      bicycle_thefts:  "#66d9ff",
      homicides:       "#333333",
      motor_thefts:    "#cc66ff",
      robberies:       "#00b300",
      thefts_over_open:"#ffd700"
    };
    return (isDark ? dark : light)[id] || "#777777";
  }
}
