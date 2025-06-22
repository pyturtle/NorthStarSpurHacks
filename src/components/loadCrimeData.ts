import fs from "fs/promises";
import path from "path";

interface GeoJSONFeatureCollection {
  features: Array<{ geometry: { coordinates: number[] }; properties: any }>;
}

let crimeDataCache: Record<string, { lat: number; lng: number }[]> | null = null;

/**
 * Dynamically loads crime GeoJSON files from public/layer-data at runtime (server-side).
 * Caches the parsed results to avoid repeated disk reads.
 */
export async function loadCrimeData() {
  if (crimeDataCache) {
    return crimeDataCache;
  }

  const baseDir = path.join(process.cwd(), "public", "layer-data");
  const files: Array<[string, string]> = [
    ["Shootings",           "shootings_2023-2025.json"],
    ["Homicides",           "homicides_2023-2025.json"],
    ["Assaults",            "assaults_2023-2025.json"],
    ["Robberies",           "robberies_2023-2025.json"],
    ["Auto Thefts",         "auto thefts_2023-2025.json"],
    ["Motor Vehicle Thefts","motor thefts_2023-2025.json"],
    ["Bicycle Thefts",      "bicycle thefts_2023-2025.json"],
    ["Property Thefts",     "thefts over open_2023-2025.json"],
  ];

  const result: Record<string, { lat: number; lng: number }[]> = {};

  for (const [key, filename] of files) {
    const filePath = path.join(baseDir, filename);
    const raw = await fs.readFile(filePath, "utf-8");
    const geojson = JSON.parse(raw) as GeoJSONFeatureCollection;
    result[key] = geojson.features.map(f => ({
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0]
    }));
  }

  crimeDataCache = result;
  return crimeDataCache;
}
