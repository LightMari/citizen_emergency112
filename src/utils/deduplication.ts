import { EmergencyReport, EmergencyType } from '../types/report';

/**
 * Calculates Haversine distance between two latitude/longitude points in meters.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateOf?: EmergencyReport;
  distanceMeters?: number;
  timeDiffMinutes?: number;
}

/**
 * Checks if a candidate report matches an existing active report:
 * Same type, within maxDistanceMeters (default 350m), and within maxTimeMinutes (default 20 mins).
 */
export function checkForDuplicateReport(
  candidate: {
    type: EmergencyType;
    latitude: number;
    longitude: number;
    createdAt?: string;
  },
  existingReports: EmergencyReport[],
  maxDistanceMeters = 350,
  maxTimeMinutes = 20
): DuplicateCheckResult {
  const candidateTime = candidate.createdAt ? new Date(candidate.createdAt).getTime() : Date.now();

  for (const report of existingReports) {
    if (report.isFalseReport) continue;
    if (report.status === 'Resolved') continue;
    if (report.type !== candidate.type) continue;

    const reportTime = new Date(report.createdAt).getTime();
    const timeDiffMinutes = Math.abs(candidateTime - reportTime) / (1000 * 60);

    if (timeDiffMinutes <= maxTimeMinutes) {
      const distance = calculateHaversineDistanceMeters(
        candidate.latitude,
        candidate.longitude,
        report.latitude,
        report.longitude
      );

      if (distance <= maxDistanceMeters) {
        return {
          isDuplicate: true,
          duplicateOf: report,
          distanceMeters: Math.round(distance),
          timeDiffMinutes: Math.round(timeDiffMinutes),
        };
      }
    }
  }

  return { isDuplicate: false };
}
