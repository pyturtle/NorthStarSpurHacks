import { NextRequest, NextResponse } from "next/server";
import { loadCrimeData } from "@/components/loadCrimeData";
import { calculateRiskScore } from "@/components/calcRiskScore";

let crimeDataCache: ReturnType<typeof loadCrimeData> | null = null;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const lat = Number(url.searchParams.get("lat"));
    const lng = Number(url.searchParams.get("lng"));

    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return NextResponse.json(
        { error: "Invalid or missing 'lat' or 'lng' query parameters" },
        { status: 400 }
      );
    }

    // Load crime data once and cache it
    if (!crimeDataCache) {
      crimeDataCache = loadCrimeData();
    }

    // Calculate risk score
    const riskScore = calculateRiskScore(lat, lng, crimeDataCache);

    return NextResponse.json({ riskScore });
  } catch (error) {
    console.error("Error in /api/safety:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}