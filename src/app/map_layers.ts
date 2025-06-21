import mapboxgl from "mapbox-gl";

// Import your datasets
import shootings from "@/public/layer-data/shootings 2023-2025.json";
// import stabbings from "@/public/layer-data/stabbings.json"; // example: another dataset

export class MapLayers {
  private static commonPaint: mapboxgl.CircleLayerSpecification['paint'] = {
    "circle-radius": 8,
    "circle-color": "#ff0000",
    "circle-opacity": 0.7,
    "circle-stroke-color": "#000000",
  };

  private static addLayer(
    map: mapboxgl.Map,
    id: string,
    data: GeoJSON.FeatureCollection
  ) {
    if (!map.getSource(id)) {
      map.addSource(id, {
        type: "geojson",
        data,
      });
    }

    if (!map.getLayer(id)) {
      map.addLayer({
        id,
        type: "circle",
        source: id,
        paint: this.commonPaint,
      });
    }
  }

  private static removeLayer(map: mapboxgl.Map, id: string) {
    if (map.getLayer(id)) {
      map.removeLayer(id);
    }
    if (map.getSource(id)) {
      map.removeSource(id);
    }
  }
  
  // refreshing method
  static restoreAllLayers(map: mapboxgl.Map) {
    this.addShootings(map);
    this.addAssaults(map);

  }

  static addShootings(map: mapboxgl.Map) {
    this.addLayer(map, "shootings", shootings);
  }

  static addAssaults(map: mapboxgl.Map) {
    this.addLayer(map, "assaults", assaults);
  }

}
