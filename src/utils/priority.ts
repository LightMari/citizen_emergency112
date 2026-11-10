import { HazardType, PriorityTier, SeverityLevel } from '../types/report';

export interface PriorityScoreInput {
  severity?: SeverityLevel;
  trappedPersons: boolean;
  injuries: boolean;
  peopleAffected: number;
  hazards: HazardType[];
}

export interface PriorityCalculationResult {
  score: number; // 0 - 100
  tier: PriorityTier;
  breakdown: {
    severityScore: number;
    trappedScore: number;
    injuriesScore: number;
    peopleAffectedScore: number;
    hazardsScore: number;
    totalUncapped: number;
  };
}

export const HAZARD_WEIGHTS: Record<HazardType, number> = {
  'Armed threat': 20,
  'Fire/smoke': 15,
  'Gas leak': 15,
  'Structural collapse risk': 15,
  'Hazardous materials': 15,
  'Rising water': 10,
};

export const SEVERITY_WEIGHTS: Record<SeverityLevel, number> = {
  Critical: 30,
  High: 20,
  Medium: 10,
  Low: 5,
};

export function calculatePeopleAffectedScore(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 5;
  if (count <= 5) return 10;
  if (count <= 10) return 15;
  return 20; // 11+
}

export function calculatePriorityScore(input: PriorityScoreInput): PriorityCalculationResult {
  const severityScore = input.severity ? SEVERITY_WEIGHTS[input.severity] || 5 : 5;
  const trappedScore = input.trappedPersons ? 25 : 0;
  const injuriesScore = input.injuries ? 20 : 0;
  const peopleAffectedScore = calculatePeopleAffectedScore(input.peopleAffected);

  const hazardsScore = (input.hazards || []).reduce((acc, hazard) => {
    return acc + (HAZARD_WEIGHTS[hazard] || 0);
  }, 0);

  const totalUncapped = severityScore + trappedScore + injuriesScore + peopleAffectedScore + hazardsScore;
  const score = Math.min(100, Math.max(0, totalUncapped));

  let tier: PriorityTier = 'P4';
  if (score >= 75) {
    tier = 'P1';
  } else if (score >= 50) {
    tier = 'P2';
  } else if (score >= 25) {
    tier = 'P3';
  } else {
    tier = 'P4';
  }

  return {
    score,
    tier,
    breakdown: {
      severityScore,
      trappedScore,
      injuriesScore,
      peopleAffectedScore,
      hazardsScore,
      totalUncapped,
    },
  };
}
