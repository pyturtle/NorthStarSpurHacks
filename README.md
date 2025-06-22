# NorthStar

**NorthStar** is a Next.js + Mapbox-powered web application that helps users navigate cities with **safety as a priority**. It overlays crime data onto a map and intelligently scores routes based on risk levels — enabling users to choose between the **fastest**, **safest**, or a **balanced** path.

The idea of this risk-scoring algorithm was inspired by a 2019 urban crime research paper on spatial analysis methods in neighborhoods (https://www.mdpi.com/2220-9964/8/1/51). With Mapbox GL JS, we integrated our risk-scoring output into a custom web map, allowing users to view previous crimes in heatmaps with Google Maps Street View API. 

---

## 🚀 Features

- 🗺️ Interactive map (Mapbox GL JS)
- 🔐 Safe routing powered by Toronto Crime Data
- 🌡️ Safety scoring system for each route
- 🌙 Light/Dark mode toggle
- 🔒 Panning & zoom restricted to Greater Toronto Area (GTA)
- ⚛️ Built with Next.js 13 (App Router)

---


## 🧪 Tech Stack

| Layer     | Tool                          |
|-----------|-------------------------------|
| Frontend  | Next.js 13 + React            |
| Mapping   | Mapbox GL JS                  |
| Styling   | CSS                           |
| Hosting   | Vercel                        |
| Data      | GeoJSON                       |

---
