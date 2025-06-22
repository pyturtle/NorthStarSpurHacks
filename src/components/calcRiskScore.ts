// Crime Configurations
const CRIME_CONFIG: Record<string, { radius: number; weight: number }> = {
    "Shootings":              { radius: 300, weight: 2.0 },
    "Homicides":              { radius: 400, weight: 2.0 },
    "Assaults":               { radius: 200, weight: 1.7 },
    "Robberies":              { radius: 200, weight: 1.2 },
    "Auto Thefts":            { radius: 300, weight: 1.0 },
    "Motor Vehicle Thefts":   { radius: 300, weight: 0.8 },
    "Bicycle Thefts":         { radius: 200, weight: 0.4 },
    "Property Thefts":        { radius: 200, weight: 0.2 },
  };
  
  // Haversine formula to compute distance in meters
  function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  
  // Main Risk Score Calculator
  export function calculateRiskScore(
    lat: number,
    lng: number,
    crimeData: Record<string, Array<{ lat: number; lng: number }>>
  ): number {
    let score = 0;
  
    for (const [crimeType, incidents] of Object.entries(crimeData)) {
      const config = CRIME_CONFIG[crimeType];
      if (!config) continue;
  
      for (const incident of incidents) {
        const distance = haversine(lat, lng, incident.lat, incident.lng);
        if (distance <= config.radius) {
          // Linear decay weight based on distance (closer = more weight)
          const decayFactor = 1 - distance / config.radius;
          score += config.weight * decayFactor;
        }
      }
    }
  
    // Optional: apply nonlinear scaling to smooth out high values
    // For example, logistic-like scaling to keep score within 0-100 nicely
    const scaledScore = 100 * (1 - Math.exp(-score / 75)); // tune divisor as needed
  
    return Math.min(Math.round(scaledScore), 100);
}