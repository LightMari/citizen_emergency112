import { describe, it, expect } from 'vitest';
import { calculatePriorityScore, calculatePeopleAffectedScore } from '../utils/priority';

describe('Priority Scoring Logic', () => {
  it('correctly scales people affected score', () => {
    expect(calculatePeopleAffectedScore(0)).toBe(0);
    expect(calculatePeopleAffectedScore(1)).toBe(5);
    expect(calculatePeopleAffectedScore(2)).toBe(5);
    expect(calculatePeopleAffectedScore(4)).toBe(10);
    expect(calculatePeopleAffectedScore(8)).toBe(15);
    expect(calculatePeopleAffectedScore(25)).toBe(20);
  });

  it('calculates low priority when minimal factors are present', () => {
    const result = calculatePriorityScore({
      severity: 'Low',
      trappedPersons: false,
      injuries: false,
      peopleAffected: 1,
      hazards: [],
    });
    // severity: 5, people: 5 => 10
    expect(result.score).toBe(10);
    expect(result.tier).toBe('P4');
  });

  it('calculates medium priority for moderate incidents', () => {
    const result = calculatePriorityScore({
      severity: 'Medium',
      trappedPersons: false,
      injuries: true, // +20
      peopleAffected: 2, // +5
      hazards: ['Rising water'], // +10
    });
    // 10 + 20 + 5 + 10 = 45
    expect(result.score).toBe(45);
    expect(result.tier).toBe('P3');
  });

  it('calculates high priority (P2) when trapped persons or multiple hazards occur', () => {
    const result = calculatePriorityScore({
      severity: 'High', // +20
      trappedPersons: true, // +25
      injuries: true, // +20
      peopleAffected: 3, // +10
      hazards: [],
    });
    // 20 + 25 + 20 + 10 = 75 => P1 boundary
    expect(result.score).toBe(75);
    expect(result.tier).toBe('P1');
  });

  it('caps maximum priority score at 100 for multi-hazard catastrophic events', () => {
    const result = calculatePriorityScore({
      severity: 'Critical', // +30
      trappedPersons: true, // +25
      injuries: true, // +20
      peopleAffected: 50, // +20
      hazards: ['Armed threat', 'Fire/smoke', 'Structural collapse risk', 'Gas leak'], // 20 + 15 + 15 + 15 = 65
    });
    // Total uncapped = 30 + 25 + 20 + 20 + 65 = 160
    expect(result.breakdown.totalUncapped).toBe(160);
    expect(result.score).toBe(100);
    expect(result.tier).toBe('P1');
  });
});
