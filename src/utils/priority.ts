import { EmergencyType, HazardType, PriorityRank, PriorityTier, SeverityLevel, EmergencyReport } from '../types/report';

export interface PriorityScoreInput {
  severity?: SeverityLevel;
  trappedPersons?: boolean;
  injuries?: boolean;
  peopleAffected: number;
  hazards?: HazardType[];
  // Image deliverable 1 additions:
  timeSinceReportingMinutes?: number;
  category?: EmergencyType;
}

export interface PriorityCalculationResult {
  score: number; // 0 - 100
  tier: PriorityTier;
  rank: PriorityRank;
  breakdown: {
    severityScore: number;
    trappedScore: number;
    injuriesScore: number;
    peopleAffectedScore: number;
    hazardsScore: number;
    timeScore: number;
    categoryScore: number;
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

// Emergency Category Urgency factor
export const CATEGORY_URGENCY_WEIGHTS: Record<EmergencyType, number> = {
  Fire: 8,
  Medical: 7,
  'Building Collapse': 8,
  'Violence/Crime': 6,
  Flood: 5,
  'Road Accident': 5,
  Earthquake: 8,
  Other: 2,
};

export function calculatePeopleAffectedScore(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 5;
  if (count <= 5) return 10;
  if (count <= 10) return 15;
  return 20; // 11+
}

/**
 * Calculates time escalation score:
 * Unresolved reports gain urgency over time to prevent stagnation (+1 pt per 10 mins, max +10)
 */
export function calculateTimeEscalationScore(minutes: number = 0): number {
  if (minutes <= 0) return 0;
  return Math.min(10, Math.floor(minutes / 10));
}

/**
 * Maps Priority Tier to Rank as depicted in Hackathon Specification:
 * - P1 -> Critical
 * - P2 -> High
 * - P3 -> Medium
 * - P4 -> Low
 */
export function getPriorityRank(tier: PriorityTier): PriorityRank {
  switch (tier) {
    case 'P1':
      return 'Critical';
    case 'P2':
      return 'High';
    case 'P3':
      return 'Medium';
    case 'P4':
    default:
      return 'Low';
  }
}

/**
 * Automatically calculates priority score & rank based on:
 * 1. Incident Severity (Critical, High, Medium, Low)
 * 2. Number of People Affected
 * 3. Time Since Reporting
 * 4. Emergency Category
 * (along with acute life hazards: trapped persons & injuries)
 */
export function calculatePriorityScore(input: PriorityScoreInput): PriorityCalculationResult {
  const severityScore = input.severity ? SEVERITY_WEIGHTS[input.severity] || 5 : 5;
  const trappedScore = input.trappedPersons ? 25 : 0;
  const injuriesScore = input.injuries ? 20 : 0;
  const peopleAffectedScore = calculatePeopleAffectedScore(input.peopleAffected);

  const hazardsScore = (input.hazards || []).reduce((acc, hazard) => {
    return acc + (HAZARD_WEIGHTS[hazard] || 0);
  }, 0);

  const timeScore = input.timeSinceReportingMinutes
    ? calculateTimeEscalationScore(input.timeSinceReportingMinutes)
    : 0;

  // Category weight is applied when category is explicitly provided in input
  const categoryScore = input.category ? CATEGORY_URGENCY_WEIGHTS[input.category] || 0 : 0;

  const totalUncapped =
    severityScore +
    trappedScore +
    injuriesScore +
    peopleAffectedScore +
    hazardsScore +
    timeScore +
    categoryScore;

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
    rank: getPriorityRank(tier),
    breakdown: {
      severityScore,
      trappedScore,
      injuriesScore,
      peopleAffectedScore,
      hazardsScore,
      timeScore,
      categoryScore,
      totalUncapped,
    },
  };
}

/**
 * Intelligently ranks and sorts incidents based on prioritized score and time elapsed.
 */
export function rankIncidents(reports: EmergencyReport[]): EmergencyReport[] {
  return [...reports].sort((a, b) => {
    // 1. Non-resolved reports come before resolved
    if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;
    if (a.status !== 'Resolved' && b.status === 'Resolved') return -1;

    // 2. Higher priority score first
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }

    // 3. If tied, older unresolved incident first (higher elapsed time)
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return timeA - timeB;
  });
}
