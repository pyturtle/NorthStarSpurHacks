interface GeoJSONFeatureCollection {
  features: Array<{
    geometry: {
      coordinates: number[];
    };
    properties: any;
  }>;
}

import shootingsData from "@/public/layer-data/shootings_2023-2025.json";
import assaultsData from "@/public/layer-data/assaults_2023-2025.json";
import autoTheftsData from "@/public/layer-data/auto thefts_2023-2025.json";
import bicycleTheftsData from "@/public/layer-data/bicycle thefts_2023-2025.json";
import homicidesData from "@/public/layer-data/homicides_2023-2025.json";
import motorTheftsData from "@/public/layer-data/motor thefts_2023-2025.json";
import robberiesData from "@/public/layer-data/robberies_2023-2025.json";
import theftsOverData from "@/public/layer-data/thefts over open_2023-2025.json";

export function loadCrimeData() {
  const shootings = shootingsData as GeoJSONFeatureCollection;
  const assaults = assaultsData as GeoJSONFeatureCollection;
  const autoThefts = autoTheftsData as GeoJSONFeatureCollection;
  const bicycleThefts = bicycleTheftsData as GeoJSONFeatureCollection;
  const homicides = homicidesData as GeoJSONFeatureCollection;
  const motorThefts = motorTheftsData as GeoJSONFeatureCollection;
  const robberies = robberiesData as GeoJSONFeatureCollection;
  const theftsOver = theftsOverData as GeoJSONFeatureCollection;

  return {
    "Shootings": shootings.features.map(f => ({ 
      lat: f.geometry.coordinates[1], 
      lng: f.geometry.coordinates[0] 
    })),
    "Homicides": homicides.features.map(f => ({ 
      lat: f.geometry.coordinates[1], 
      lng: f.geometry.coordinates[0] 
    })),
    "Assaults": assaults.features.map(f => ({ 
      lat: f.geometry.coordinates[1], 
      lng: f.geometry.coordinates[0] 
    })),
    "Robberies": robberies.features.map(f => ({ 
      lat: f.geometry.coordinates[1], 
      lng: f.geometry.coordinates[0] 
    })),
    "Auto Thefts": autoThefts.features.map(f => ({ 
      lat: f.geometry.coordinates[1], 
      lng: f.geometry.coordinates[0] 
    })),
    "Motor Vehicle Thefts": motorThefts.features.map(f => ({ 
      lat: f.geometry.coordinates[1], 
      lng: f.geometry.coordinates[0] 
    })),
    "Bicycle Thefts": bicycleThefts.features.map(f => ({ 
      lat: f.geometry.coordinates[1], 
      lng: f.geometry.coordinates[0] 
    })),
    "Property Thefts": theftsOver.features.map(f => ({ 
      lat: f.geometry.coordinates[1], 
      lng: f.geometry.coordinates[0] 
    })),
  };
}