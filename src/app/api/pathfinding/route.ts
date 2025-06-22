// src/app/api/safety/pathfinding/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { length, along } from "@turf/turf";
import { loadCrimeData } from "@/components/loadCrimeData";
import { calculateRiskScore } from "@/components/calcRiskScore";

const crimeData = loadCrimeData();  // warm cache on import

// Helper: sample every N meters along a LineString
function sampleEvery(line: GeoJSON.LineString, interval = 50) {
    const total = length(line, { units: "meters" });
    const pts: [number, number][] = [];
    for (let d = 0; d <= total; d += interval) {
        const coord = (along(line, d, { units: "meters" }).geometry
            .coordinates as [number, number]);
        pts.push(coord);
    }
    return pts;
}

export async function GET(req: NextRequest) {
    try {
        const url   = new URL(req.url);
        const orig  = url.searchParams.get("origin");
        const dest  = url.searchParams.get("destination");
        const mode  = url.searchParams.get("mode") ?? "driving-traffic";

        // Validate required params
        if (!orig || !dest) {
            return NextResponse.json(
                { error: "Missing origin or destination" },
                { status: 400 }
            );
        }

        // Validate mode
        const validModes = ["walking", "cycling", "driving-traffic"];
        if (!validModes.includes(mode)) {
            return NextResponse.json(
                { error: `Invalid mode. Must be one of ${validModes.join(", ")}` },
                { status: 400 }
            );
        }

        // Parse coords
        const [olat, olng] = orig.split(",").map(Number);
        const [dlat, dlng] = dest.split(",").map(Number);
        if ([olat, olng, dlat, dlng].some((v) => isNaN(v))) {
            return NextResponse.json(
                { error: "Invalid origin or destination format. Use lat,lng" },
                { status: 400 }
            );
        }

        // 1) Fetch alternatives
        const coords = `${olng},${olat};${dlng},${dlat}`;
        const mbxUrl = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${coords}`;
        const { data } = await axios.get(mbxUrl, {
            params: {
                alternatives: true,
                geometries:   "geojson",
                overview:     "full",
                access_token: process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
            }
        });

        // 2) Score each route
        const scored = await Promise.all(
            data.routes.map(async (r: any) => {
                const line = r.geometry as GeoJSON.LineString;
                const samples = sampleEvery(line, 75);

                const points = samples.map(([lng, lat]) =>
                    calculateRiskScore(lat, lng, crimeData)
                );
                const avgScore = points.reduce((a, b) => a + b, 0) / points.length;

                return {
                    geometry:  line,
                    riskScore: Math.round(avgScore),
                    distance:  r.distance,   // meters
                    duration:  r.duration,   // seconds
                };
            })
        );

        return NextResponse.json({ routes: scored });
    } catch (err) {
        console.error("Error in /api/safety/pathfinding/route:", err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
