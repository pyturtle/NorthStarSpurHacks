import { NextRequest, NextResponse } from "next/server";
import { getDistance } from "geolib";
import shootings from "@/public/layer-data/shootings 2023-2025.json"; // Make sure this path matches your setup

const RADIUS_METERS = 500;
const DAYS_WINDOW = 30;
const WEIGHT = 2;

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const now = new Date();
    const threshold = new Date(now);
    threshold.setDate(now.getDate() - DAYS_WINDOW);

    const nearby = shootings.features.filter((incident: any) => {
      const date = new Date(incident.properties.OCC_DATE);
      if (date < threshold) return false;

      const dist = getDistance(
        { latitude: lat, longitude: lng },
        {
          latitude: incident.geometry.coordinates[1],
          longitude: incident.geometry.coordinates[0],
        }
      );

      return dist <= RADIUS_METERS;
    });

    const count = nearby.length;
    const score = Math.max(0, 100 - count * WEIGHT);

    return NextResponse.json({ score, count });
  } catch (error) {
    console.error("Safety API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
