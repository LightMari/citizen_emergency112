import { EmergencyReport, EmergencyType, ResponseTeam, TeamCategory } from '../types/report';
import { calculateHaversineDistanceMeters } from './deduplication';

/**
 * Calculates distance between incident and team in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const meters = calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2);
  return Number((meters / 1000).toFixed(2));
}

/**
 * Calculates realistic road travel ETA in minutes based on urban traffic in Chennai.
 * Assumes average emergency response vehicle speed of 36 km/h (0.6 km/min) + 2 min dispatch overhead.
 */
export function calculateEstimatedTravelMinutes(distanceKm: number): number {
  if (distanceKm <= 0.2) return 2;
  const transitMinutes = (distanceKm / 36) * 60;
  return Math.max(2, Math.round(transitMinutes + 2));
}

/**
 * Maps an EmergencyType to compatible ResponseTeam categories.
 */
export const INCIDENT_TO_TEAM_CATEGORIES: Record<EmergencyType, TeamCategory[]> = {
  Fire: ['Fire', 'Rescue', 'General'],
  Medical: ['Medical', 'Rescue', 'General'],
  Flood: ['Rescue', 'Disaster', 'Fire', 'General'],
  Earthquake: ['Rescue', 'Disaster', 'Medical', 'General'],
  'Road Accident': ['Medical', 'Police', 'Rescue', 'General'],
  'Building Collapse': ['Rescue', 'Disaster', 'Fire', 'Medical', 'General'],
  'Violence/Crime': ['Police', 'Medical', 'General'],
  Other: ['General', 'Rescue', 'Fire', 'Medical', 'Police', 'Disaster'],
};

/**
 * Checks whether a response team's category is suitable for a given emergency type.
 */
export function isTeamSuitableForIncident(
  teamCategory: TeamCategory,
  incidentType: EmergencyType
): boolean {
  const allowed = INCIDENT_TO_TEAM_CATEGORIES[incidentType] || ['General'];
  return allowed.includes(teamCategory);
}

export interface TeamAssignmentCandidate {
  team: ResponseTeam;
  distanceKm: number;
  etaMinutes: number;
  isCategoryMatch: boolean;
  isAvailable: boolean;
  score: number; // Lower score = better fit
}

/**
 * Evaluates and ranks all response teams for an incident based on:
 * 1. Category suitability
 * 2. Availability (Available vs Busy)
 * 3. Proximity / distance
 */
export function evaluateTeamCandidates(
  incident: Pick<EmergencyReport, 'type' | 'latitude' | 'longitude'>,
  teams: ResponseTeam[]
): TeamAssignmentCandidate[] {
  return teams
    .map((team) => {
      const distanceKm = calculateDistanceKm(
        incident.latitude,
        incident.longitude,
        team.latitude,
        team.longitude
      );
      const etaMinutes = calculateEstimatedTravelMinutes(distanceKm);
      const isCategoryMatch = isTeamSuitableForIncident(team.category, incident.type);
      const isAvailable = team.availability === 'Available';

      // Scoring formula: prioritize availability first, then category match, then distance
      let score = distanceKm;
      if (!isCategoryMatch) score += 50; // penalty for mismatched category
      if (!isAvailable) score += 200; // heavy penalty for already busy team

      return {
        team,
        distanceKm,
        etaMinutes,
        isCategoryMatch,
        isAvailable,
        score,
      };
    })
    .sort((a, b) => a.score - b.score);
}

/**
 * Finds the single best-fit (nearest available suitable) team for an incident.
 */
export function findBestFitTeam(
  incident: Pick<EmergencyReport, 'type' | 'latitude' | 'longitude'>,
  teams: ResponseTeam[]
): TeamAssignmentCandidate | null {
  const candidates = evaluateTeamCandidates(incident, teams);
  // Pick the top candidate that is currently Available
  const bestAvailable = candidates.find((c) => c.isAvailable && c.isCategoryMatch);
  if (bestAvailable) return bestAvailable;

  // Fallback to any available team if no direct category match
  const anyAvailable = candidates.find((c) => c.isAvailable);
  return anyAvailable || candidates[0] || null;
}

/**
 * Generates intermediate route waypoints between team and incident for route animation simulation.
 */
export function generateRouteWaypoints(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  numPoints = 5
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    const lat = startLat + (endLat - startLat) * fraction;
    const lng = startLng + (endLng - startLng) * fraction;
    points.push([lat, lng]);
  }
  return points;
}
