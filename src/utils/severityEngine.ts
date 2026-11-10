import { EmergencyCategory, EmergencyType, SeverityLevel } from '../types/report';

export interface SeverityEvaluationInput {
  category: EmergencyCategory | EmergencyType;
  description: string;
  peopleAffected: number;
  timeSinceReportingMinutes?: number;
  timeElapsedMinutes?: number;
  trappedPersons?: boolean;
  injuries?: boolean;
}

export interface ExplainableSeverityResult {
  score: number; // 0 - 100
  severity: SeverityLevel;
  explanation: string; // e.g. "Critical: 12 people + building collapse + keyword 'trapped'"
  breakdown: {
    categoryWeight: number;
    peopleWeight: number;
    keywordWeight: number;
    matchedKeywords: string[];
    timeEscalationWeight: number;
    trappedWeight: number;
    injuriesWeight: number;
    totalUncapped: number;
  };
}

// 1. Category weights
export const CATEGORY_SEVERITY_WEIGHTS: Record<string, number> = {
  'Building Collapse': 25,
  'Fire Emergency': 25,
  Fire: 25,
  'Medical Emergency': 22,
  Medical: 22,
  'Flood': 20,
  'Road Accident': 18,
  'Violence/Crime': 20,
  Earthquake: 25,
  Other: 10,
};

// 2. Risk Keywords to detect in description
export const RISK_KEYWORDS: Array<{ word: string; weight: number }> = [
  { word: 'trapped', weight: 15 },
  { word: 'unconscious', weight: 15 },
  { word: 'spreading', weight: 12 },
  { word: 'children', weight: 12 },
  { word: 'child', weight: 12 },
  { word: 'bleeding', weight: 12 },
  { word: 'explosion', weight: 14 },
  { word: 'blast', weight: 14 },
  { word: 'gas leak', weight: 12 },
  { word: 'drowning', weight: 14 },
  { word: 'cardiac', weight: 15 },
  { word: 'heart attack', weight: 15 },
  { word: 'toxic', weight: 10 },
  { word: 'collapsed', weight: 14 },
  { word: 'suffocating', weight: 12 },
  { word: 'flames', weight: 10 },
];

/**
 * Calculates score for number of people affected.
 */
export function calculatePeopleAffectedWeight(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 6;
  if (count <= 5) return 12;
  if (count <= 10) return 18;
  return 25; // 11+ people affected
}

/**
 * Calculates time escalation weight for older unresolved incidents (+2 pts per 10 mins, up to 15 pts).
 */
export function calculateTimeEscalationWeight(minutes = 0): number {
  if (minutes <= 0) return 0;
  return Math.min(15, Math.floor(minutes / 10) * 2);
}

/**
 * Maps numeric score (0-100) to Severity Level.
 */
export function mapScoreToSeverityLevel(score: number): SeverityLevel {
  if (score >= 75) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Medium';
  return 'Low';
}

/**
 * Normalizes input category to standard canonical category
 */
export function normalizeCategory(cat: string): EmergencyCategory {
  if (cat.includes('Fire')) return 'Fire Emergency';
  if (cat.includes('Road') || cat.includes('Accident')) return 'Road Accident';
  if (cat.includes('Medical')) return 'Medical Emergency';
  if (cat.includes('Flood')) return 'Flood';
  if (cat.includes('Collapse')) return 'Building Collapse';
  return 'Other';
}

/**
 * Rule-based Explainable Severity Engine:
 * Evaluates category weight, people affected, risk keywords, and time escalation.
 */
export function evaluateSeverity(input: SeverityEvaluationInput): ExplainableSeverityResult {
  const normCat = normalizeCategory(input.category);
  const categoryWeight = CATEGORY_SEVERITY_WEIGHTS[normCat] || 10;
  const peopleWeight = calculatePeopleAffectedWeight(input.peopleAffected);

  // Risk keywords scan
  const lowerDesc = (input.description || '').toLowerCase();
  const matchedKeywords: string[] = [];
  let keywordWeight = 0;

  for (const { word, weight } of RISK_KEYWORDS) {
    if (lowerDesc.includes(word) && !matchedKeywords.includes(word)) {
      matchedKeywords.push(word);
      keywordWeight += weight;
    }
  }

  // Cap keyword weight to 30 to prevent overflow
  keywordWeight = Math.min(30, keywordWeight);

  const elapsedMins = input.timeSinceReportingMinutes ?? input.timeElapsedMinutes ?? 0;
  const timeEscalationWeight = calculateTimeEscalationWeight(elapsedMins);
  const trappedWeight = input.trappedPersons ? 15 : 0;
  const injuriesWeight = input.injuries ? 12 : 0;

  const totalUncapped =
    categoryWeight +
    peopleWeight +
    keywordWeight +
    timeEscalationWeight +
    trappedWeight +
    injuriesWeight;

  const score = Math.min(100, Math.max(5, totalUncapped));
  const severity = mapScoreToSeverityLevel(score);

  // Generate "Why this severity?" explanation line
  const reasons: string[] = [];
  if (input.peopleAffected > 0) {
    reasons.push(`${input.peopleAffected} ${input.peopleAffected === 1 ? 'person' : 'people'}`);
  }
  reasons.push(normCat.toLowerCase());

  if (matchedKeywords.length > 0) {
    if (matchedKeywords.length <= 2) {
      reasons.push(matchedKeywords.map((k) => `keyword '${k}'`).join(' + '));
    } else {
      reasons.push(`keywords ${matchedKeywords.slice(0, 3).map((k) => `'${k}'`).join(', ')}`);
    }
  }

  if (input.trappedPersons && !matchedKeywords.includes('trapped')) {
    reasons.push('trapped persons');
  }

  if (timeEscalationWeight > 0) {
    reasons.push(`escalated (+${timeEscalationWeight}m elapsed)`);
  }

  const explanation = `${severity}: ${reasons.join(' + ')}`;

  return {
    score,
    severity,
    explanation,
    breakdown: {
      categoryWeight,
      peopleWeight,
      keywordWeight,
      matchedKeywords,
      timeEscalationWeight,
      trappedWeight,
      injuriesWeight,
      totalUncapped,
    },
  };
}
