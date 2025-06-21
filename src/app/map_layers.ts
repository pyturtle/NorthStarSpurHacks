import mapboxgl from "mapbox-gl";

// Import your datasets
import shootings from "@/public/layer-data/shootings_2023-2025.json";
// import stabbings from "@/public/layer-data/stabbings.json"; // example: another dataset

export class MapLayers {
  static circleColor: string = "#ff0000"
  static circleOpacity: number = 0.7

  private static get commonPaint(): mapboxgl.CircleLayerSpecification['paint'] {
    return {
      "circle-radius": 8,
      "circle-color": this.circleColor,
      "circle-opacity": this.circleOpacity,
      "circle-stroke-color": "#000000",
    };
  }

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

  // Red lines appear on these methods due to typescript not understanding their type
  // its fine
  static addShootings(map: mapboxgl.Map) {
    this.addLayer(map, "shootings", shootings);
    this.circleColor = "#0000ff"
    this.circleOpacity = 1
  }

  static addAssaults(map: mapboxgl.Map) {
    this.addLayer(map, "assaults", assaults);
    this.circleColor = "#0000ff"
  }

}
