import mapboxgl from "mapbox-gl";

// Import datasets from public folder
import shootings from "@/public/layer-data/shootings_2023-2025.json";
import assaults from "@/public/layer-data/assaults.json";
import autoThefts from "@/public/layer-data/auto thefts.json";
import bicycleThefts from "@/public/layer-data/bicycle thefts.json";
import homicides from "@/public/layer-data/homicides.json";
import motorThefts from "@/public/layer-data/motor thefts.json";
import robberies from "@/public/layer-data/robberies.json";
import theftsOver from "@/public/layer-data/thefts over open.json";

export class MapLayers {
  static circleColor: string = "#ff0000";
  static circleOpacity: number = 0.7;

  // Common paint style for all circle layers
  private static get commonPaint(): mapboxgl.CircleLayerSpecification['paint'] {
    return {
      "circle-radius": 8,
      "circle-color": this.circleColor,
      "circle-opacity": this.circleOpacity,
      "circle-stroke-color": "#000000",
    };
  }

  // Add a generic layer to the map given ID and GeoJSON data
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

  // Remove layer and source from the map
  private static removeLayer(map: mapboxgl.Map, id: string) {
    if (map.getLayer(id)) {
      map.removeLayer(id);
    }
    if (map.getSource(id)) {
      map.removeSource(id);
    }
  }

  // Add all available datasets to the map
  static restoreAllLayers(map: mapboxgl.Map) {
    this.addShootings(map);
    this.addAssaults(map);
    this.addAutoThefts(map);
    this.addBicycleThefts(map);
    this.addHomicides(map);
    this.addMotorThefts(map);
    this.addRobberies(map);
    this.addTheftsOver(map);
  }

  // Red lines appear on these methods due to typescript not understanding their type
  // its fine

  static addShootings(map: mapboxgl.Map) {
    this.circleColor = "#ff0000"; // Red
    this.circleOpacity = 1;
    this.addLayer(map, "shootings", shootings);
  }

  static addAssaults(map: mapboxgl.Map) {
    this.circleColor = "#e67300"; // Orange
    this.addLayer(map, "assaults", assaults);
  }

  static addAutoThefts(map: mapboxgl.Map) {
    this.circleColor = "#e600e6"; // Pink
    this.addLayer(map, "auto_thefts", autoThefts);
  }

  static addBicycleThefts(map: mapboxgl.Map) {
    this.circleColor = "#4dc3ff"; // Light Blue
    this.addLayer(map, "bicycle_thefts", bicycleThefts);
  }

  static addHomicides(map: mapboxgl.Map) {
    this.circleColor = "#000000"; // Black
    this.addLayer(map, "homicides", homicides);
  }

  static addMotorThefts(map: mapboxgl.Map) {
    this.circleColor = "#9900cc"; // Purple
    this.addLayer(map, "motor_thefts", motorThefts);
  }

  static addRobberies(map: mapboxgl.Map) {
    this.circleColor = "#006600"; // Green
    this.addLayer(map, "robberies", robberies);
  }

  static addTheftsOver(map: mapboxgl.Map) {
    this.circleColor = "#999900"; // Yellow
    this.addLayer(map, "thefts_over_open", theftsOver);
  }
}