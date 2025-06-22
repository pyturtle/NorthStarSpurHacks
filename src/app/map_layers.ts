import mapboxgl from "mapbox-gl";

// Toggleable dataset definitions (no JSON imports!)
export const datasets = [
  { id: "shootings", enabled: false },
  { id: "assaults", enabled: false },
  { id: "auto_thefts", enabled: false },
  { id: "bicycle_thefts", enabled: false },
  { id: "homicides", enabled: false },
  { id: "motor_thefts", enabled: false },
  { id: "robberies", enabled: false },
  { id: "thefts_over_open", enabled: false },
];

// URLs to GeoJSON files (served from /public)
const LAYER_URLS: Record<string, string> = {
  shootings: "/layer-data/shootings_2023-2025.json",
  assaults: "/layer-data/assaults_2023-2025.json",
  auto_thefts: "/layer-data/auto%20thefts_2023-2025.json",
  bicycle_thefts: "/layer-data/bicycle%20thefts_2023-2025.json",
  homicides: "/layer-data/homicides_2023-2025.json",
  motor_thefts: "/layer-data/motor%20thefts_2023-2025.json",
  robberies: "/layer-data/robberies_2023-2025.json",
  thefts_over_open: "/layer-data/thefts%20over%20open_2023-2025.json",
};

type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, any>;

export class MapLayers {
  private static groupFeaturesByLocation(data: FeatureCollection): Map<string, GeoJSON.Feature[]> {
    const map = new Map<string, GeoJSON.Feature[]>();
    for (const feat of data.features) {
      const [lng, lat] = (feat.geometry as any).coordinates;
      const key = `${lng.toFixed(6)},${lat.toFixed(6)}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(feat);
    }
    return map;
  }

  private static buildBarSegment(center: [number, number], index: number, total: number, count: number, color: string): GeoJSON.Feature {
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
        extrusionHeight: count * 5,
        extrusionBase: 0,
        color: color
      }
    };
  }

  private static addHeatmapLayer(map: mapboxgl.Map, id: string, data: FeatureCollection, color: string) {
    const sourceId = `${id}-heatmap`;
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { type: "geojson", data });
    }
    if (!map.getLayer(sourceId)) {
      map.addLayer({
        id: sourceId,
        type: "heatmap",
        source: sourceId,
        paint: {
          "heatmap-weight": 1,
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 20, 3],
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,0,255,0)",
            0.2, color,
            0.4, color,
            1, "red"
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
    data: FeatureCollection,
    paint: NonNullable<mapboxgl.CirclePaint>,
    level: number
  ) {
    const grouped = this.groupFeaturesByLocation(data);
    const clustered: GeoJSON.Feature[] = [];
    const expanded: GeoJSON.Feature[] = [];

    grouped.forEach((group, key) => {
      const [lng, lat] = key.split(",").map(Number);
      clustered.push({ ...group[0], geometry: { type: "Point", coordinates: [lng, lat] } });
      expanded.push(this.buildBarSegment([lng, lat], level, datasets.length, group.length, paint["circle-color"] as string));
    });

    const clusterId = `${id}-cluster`;
    const extrudedId = `${id}-extruded`;

    if (!map.getSource(clusterId)) {
      map.addSource(clusterId, { type: "geojson", data: { type: "FeatureCollection", features: clustered } });
    }
    if (!map.getLayer(clusterId)) {
      map.addLayer({
        id: clusterId,
        type: "circle",
        source: clusterId,
        paint: {
          "circle-color": paint["circle-color"] || "#888",
          "circle-radius": 6,
          "circle-opacity": 0.8,
          "circle-emissive-strength": 1.5
        },
        minzoom: 0,
        maxzoom: 15
      });
    }

    if (!map.getSource(extrudedId)) {
      map.addSource(extrudedId, { type: "geojson", data: { type: "FeatureCollection", features: expanded } });
    }
    if (!map.getLayer(extrudedId)) {
      map.addLayer({
        id: extrudedId,
        type: "fill-extrusion",
        source: extrudedId,
        paint: {
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-height": ["get", "extrusionHeight"],
          "fill-extrusion-base": ["get", "extrusionBase"],
          "fill-extrusion-opacity": 0.8,
          "fill-extrusion-emissive-strength": 1.5
        },
        minzoom: 15,
        maxzoom: 24
      });
    }
  }

  private static addIconMap(map: mapboxgl.Map, id: string, data: FeatureCollection) {
  const iconId = `${id}-image`;
  const sourceId = `${id}-iconmap`;

  // If image already exists, skip loading it again
  if (!map.hasImage(iconId)) {
    const img = new Image(40, 40);
    img.onload = () => {
      if (!map.hasImage(iconId)) {
        map.addImage(iconId, img);
      }
      this._placeIconsGrid(map, id, data, iconId, sourceId);
    };
    img.src = `/icons/${id}.png`;
  } else {
    this._placeIconsGrid(map, id, data, iconId, sourceId);
  }
}

private static _placeIconsGrid(
  map: mapboxgl.Map,
  id: string,
  data: FeatureCollection,
  iconId: string,
  sourceId: string
) {
  const grouped = this.groupFeaturesByLocation(data);
  const arranged: GeoJSON.Feature[] = [];

  grouped.forEach((group, key) => {
    const [lng, lat] = key.split(",").map(Number);
    const total = group.length;
    const gridSize = Math.ceil(Math.sqrt(total));
    const spacing = 0.00007;

    group.forEach((feature, i) => {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const dx = (col - (gridSize - 1) / 2) * spacing;
      const dy = (row - (gridSize - 1) / 2) * spacing;

      const offsetLng = lng + dx;
      const offsetLat = lat + dy;

      arranged.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [offsetLng, offsetLat]
        },
        properties: {}
      });
    });
  });

  // Add source and layer
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: arranged
      }
    });
  }

  if (!map.getLayer(sourceId)) {
    map.addLayer({
      id: sourceId,
      type: "symbol",
      source: sourceId,
      layout: {
        "icon-image": iconId,
        "icon-size": 0.4,
        "icon-allow-overlap": true
      }
    });
  }
}

  static async restoreAllLayers(
    map: mapboxgl.Map,
    isDark: boolean,
    mode: "dotmap" | "heatmap" | "iconmap"
  ) {
    for (const { id } of datasets) this.removeLayersForId(map, id);
    const enabled = datasets.filter(d => d.enabled);
    const loaded = await Promise.all(
      enabled.map(async ({ id }) => {
        const data = await fetch(LAYER_URLS[id]).then(r => r.json()) as FeatureCollection;
        return { id, data };
      })
    );

    const ranks = loaded.map(d => ({ id: d.id, size: d.data.features.length }))
      .sort((a, b) => b.size - a.size)
      .map((d, i) => ({ id: d.id, level: i }));

    for (const { id, data } of loaded) {
      const level = ranks.find(r => r.id === id)?.level || 0;
      const color = this.getColorForId(id, isDark);

      if (mode === "dotmap") {
        this.addClusterAndExpandedLayers(map, id, data, { "circle-color": color }, level);
      } else if (mode === "heatmap") {
        this.addHeatmapLayer(map, id, data, color);
      } else if (mode === "iconmap") {
        this.addIconMap(map, id, data);
      }
    }
  }

  static removeLayersForId(map: mapboxgl.Map, id: string) {
    for (const suffix of ["-cluster", "-extruded", "-heatmap", "-iconmap"]) {
      const fullId = id + suffix;
      if (map.getLayer(fullId)) map.removeLayer(fullId);
      if (map.getSource(fullId)) map.removeSource(fullId);
      if (map.hasImage(`${id}-image`)) map.removeImage(`${id}-image`);
    }
  }

  private static getColorForId(id: string, isDark: boolean): string {
    const dark: Record<string, string> = {
      shootings: "#ff0000",
      assaults: "#e67300",
      auto_thefts: "#e600e6",
      bicycle_thefts: "#4dc3ff",
      homicides: "#000000",
      motor_thefts: "#9900cc",
      robberies: "#006600",
      thefts_over_open: "#ffcc00"
    };
    const light: Record<string, string> = {
      shootings: "#ff3333",
      assaults: "#ff9933",
      auto_thefts: "#ff66ff",
      bicycle_thefts: "#66d9ff",
      homicides: "#333333",
      motor_thefts: "#cc66ff",
      robberies: "#00b300",
      thefts_over_open: "#ffd700"
    };
    return (isDark ? dark : light)[id] || "#777777";
  }
}