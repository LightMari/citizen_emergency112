import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateDistanceKm,
  calculateEstimatedTravelMinutes,
  isTeamSuitableForIncident,
  findBestFitTeam,
  evaluateTeamCandidates,
} from '../utils/teamAssignment';
import {
  calculatePriorityScore,
  rankIncidents,
  getPriorityRank,
} from '../utils/priority';
import {
  getStoredReports,
  getStoredTeams,
  assignTeamToIncident,
  unassignTeamFromIncident,
  updateReportStatus,
  createResponseTeam,
  updateTeamAvailability,
  resetDemoData,
} from '../services/mockBackend';
import { EmergencyReport } from '../types/report';

describe('Hackathon Requirements Test Suite', () => {
  beforeEach(() => {
    resetDemoData();
  });

  // ========================================================
  // 1. Intelligent Incident Prioritization Tests
  // ========================================================
  describe('1. Intelligent Incident Prioritization', () => {
    it('calculates score based on Severity, People Affected, Time Elapsed, and Emergency Category', () => {
      const calculation = calculatePriorityScore({
        severity: 'Critical', // +30
        peopleAffected: 6, // +15
        trappedPersons: true, // +25
        injuries: true, // +20
        hazards: ['Fire/smoke'], // +15
        timeSinceReportingMinutes: 30, // +3
        category: 'Fire', // +8
      });

      // Total uncapped: 30 + 25 + 20 + 15 + 15 + 3 + 8 = 116 => capped at 100
      expect(calculation.score).toBe(100);
      expect(calculation.tier).toBe('P1');
      expect(calculation.rank).toBe('Critical');
      expect(calculation.breakdown.timeScore).toBe(3);
      expect(calculation.breakdown.categoryScore).toBe(8);
      expect(calculation.breakdown.severityScore).toBe(30);
    });

    it('correctly maps priority ranks: Critical, High, Medium, Low', () => {
      expect(getPriorityRank('P1')).toBe('Critical');
      expect(getPriorityRank('P2')).toBe('High');
      expect(getPriorityRank('P3')).toBe('Medium');
      expect(getPriorityRank('P4')).toBe('Low');
    });

    it('ranks incidents properly: Critical/High score first, unresolved before resolved', () => {
      const sampleReports: EmergencyReport[] = [
        {
          id: 'REP-LOW',
          type: 'Other',
          description: 'Minor issue',
          latitude: 13.08,
          longitude: 80.27,
          peopleAffected: 1,
          injuries: false,
          trappedPersons: false,
          hazards: [],
          priorityScore: 20,
          priorityTier: 'P4',
          status: 'Reported',
          syncStatus: 'synced',
          media: [],
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'REP-CRITICAL',
          type: 'Fire',
          description: 'Large commercial fire',
          latitude: 13.04,
          longitude: 80.23,
          peopleAffected: 10,
          injuries: true,
          trappedPersons: true,
          hazards: ['Fire/smoke'],
          priorityScore: 95,
          priorityTier: 'P1',
          status: 'Reported',
          syncStatus: 'synced',
          media: [],
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'REP-RESOLVED-HIGH',
          type: 'Building Collapse',
          description: 'Older resolved building incident',
          latitude: 13.06,
          longitude: 80.25,
          peopleAffected: 4,
          injuries: true,
          trappedPersons: false,
          hazards: [],
          priorityScore: 85,
          priorityTier: 'P1',
          status: 'Resolved',
          syncStatus: 'synced',
          media: [],
          createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const ranked = rankIncidents(sampleReports);
      // REP-CRITICAL should be first because it is active with highest priority
      expect(ranked[0].id).toBe('REP-CRITICAL');
      // Active REP-LOW should be ahead of Resolved REP-RESOLVED-HIGH
      expect(ranked[1].id).toBe('REP-LOW');
      expect(ranked[2].id).toBe('REP-RESOLVED-HIGH');
    });
  });

  // ========================================================
  // 2. Emergency Response Team Management Tests
  // ========================================================
  describe('2. Emergency Response Team Management', () => {
    it('initializes with seed response teams in Chennai', () => {
      const teams = getStoredTeams();
      expect(teams.length).toBeGreaterThanOrEqual(8);

      const fireTeam = teams.find((t) => t.category === 'Fire');
      const medicalTeam = teams.find((t) => t.category === 'Medical');
      const rescueTeam = teams.find((t) => t.category === 'Rescue');

      expect(fireTeam).toBeDefined();
      expect(medicalTeam).toBeDefined();
      expect(rescueTeam).toBeDefined();
    });

    it('creates and registers a new response team into storage', () => {
      const newTeam = createResponseTeam({
        name: 'TNFRS Station 12 (Guindy)',
        category: 'Fire',
        latitude: 13.0067,
        longitude: 80.2033,
        address: 'Guindy Industrial Estate, Chennai 600032',
        availability: 'Available',
        assignedIncidentId: null,
        assignedIncidentType: null,
        contactPhone: '+91 44 2235 0101',
        stationName: 'Guindy Fire Station',
        vehicleType: 'High-Pressure Water Tender',
        personnelCount: 5,
      });

      expect(newTeam.id).toContain('TEAM-FIR-');
      const teams = getStoredTeams();
      expect(teams.some((t) => t.id === newTeam.id)).toBe(true);
    });

    it('toggles team availability status between Available and Busy', () => {
      const teams = getStoredTeams();
      const availableTeam = teams.find((t) => t.availability === 'Available')!;
      expect(availableTeam).toBeDefined();

      const updated = updateTeamAvailability(availableTeam.id, 'Busy', 'REP-TEST-1');
      expect(updated?.availability).toBe('Busy');
      expect(updated?.assignedIncidentId).toBe('REP-TEST-1');

      const reverted = updateTeamAvailability(availableTeam.id, 'Available');
      expect(reverted?.availability).toBe('Available');
      expect(reverted?.assignedIncidentId).toBeNull();
    });
  });

  // ========================================================
  // 3. Location-Based Team Assignment Tests
  // ========================================================
  describe('3. Location-Based Team Assignment', () => {
    it('accurately calculates Haversine distance in km and road travel ETA in mins', () => {
      // Distance between T. Nagar (13.0418, 80.2341) and Guindy (13.0067, 80.2033) ~ 5.1 km
      const distance = calculateDistanceKm(13.0418, 80.2341, 13.0067, 80.2033);
      expect(distance).toBeGreaterThan(4.5);
      expect(distance).toBeLessThan(5.5);

      const eta = calculateEstimatedTravelMinutes(distance);
      expect(eta).toBeGreaterThanOrEqual(5);
      expect(eta).toBeLessThanOrEqual(15);
    });

    it('matches suitable team category for specific emergency types', () => {
      expect(isTeamSuitableForIncident('Fire', 'Fire')).toBe(true);
      expect(isTeamSuitableForIncident('Medical', 'Medical')).toBe(true);
      expect(isTeamSuitableForIncident('Rescue', 'Building Collapse')).toBe(true);
      expect(isTeamSuitableForIncident('Police', 'Violence/Crime')).toBe(true);
      expect(isTeamSuitableForIncident('Disaster', 'Flood')).toBe(true);
    });

    it('identifies and selects the nearest available suitable team for an incident', () => {
      const incident = {
        type: 'Medical' as const,
        latitude: 13.0500, // Near Marina Beach
        longitude: 80.2824,
      };

      const teams = getStoredTeams();
      const bestFit = findBestFitTeam(incident, teams);

      expect(bestFit).not.toBeNull();
      expect(bestFit?.team.category).toBe('Medical');
      expect(bestFit?.isAvailable).toBe(true);
      expect(bestFit?.distanceKm).toBeLessThan(10);
    });

    it('ranks all candidates with distance and category suitability', () => {
      const incident = {
        type: 'Fire' as const,
        latitude: 13.0418,
        longitude: 80.2341,
      };

      const candidates = evaluateTeamCandidates(incident, getStoredTeams());
      expect(candidates.length).toBeGreaterThan(0);
      // Best candidates should have lowest score
      expect(candidates[0].score).toBeLessThanOrEqual(candidates[candidates.length - 1].score);
    });
  });

  // ========================================================
  // 4. Assignment & Incident Tracking Lifecycle Tests
  // ========================================================
  describe('4. Assignment & Incident Tracking Lifecycle', () => {
    it('assigns team to incident, updates incident status to Assigned, and sets team to Busy', () => {
      const reports = getStoredReports();
      const unassignedReport = reports.find((r) => !r.assignedTeamId && r.status !== 'Resolved')!;
      expect(unassignedReport).toBeDefined();

      const teams = getStoredTeams();
      const availableTeam = teams.find((t) => t.availability === 'Available')!;
      expect(availableTeam).toBeDefined();

      const { report, team } = assignTeamToIncident(unassignedReport.id, availableTeam.id);

      expect(report.status).toBe('Assigned');
      expect(report.assignedTeamId).toBe(availableTeam.id);
      expect(report.distanceKm).toBeGreaterThan(0);
      expect(report.estimatedArrivalMinutes).toBeGreaterThan(0);

      expect(team.availability).toBe('Busy');
      expect(team.assignedIncidentId).toBe(unassignedReport.id);
    });

    it('automatically frees up assigned team when incident status transitions to Resolved', () => {
      const reports = getStoredReports();
      const teams = getStoredTeams();
      const unassignedReport = reports.find((r) => !r.assignedTeamId && r.status !== 'Resolved')!;
      const availableTeam = teams.find((t) => t.availability === 'Available')!;

      // 1. Assign team
      assignTeamToIncident(unassignedReport.id, availableTeam.id);

      // Verify team is now Busy
      const busyTeams = getStoredTeams();
      const assignedTeam = busyTeams.find((t) => t.id === availableTeam.id)!;
      expect(assignedTeam.availability).toBe('Busy');

      // 2. Mark incident Resolved
      updateReportStatus(unassignedReport.id, 'Resolved');

      // 3. Verify team automatically reverted to Available
      const updatedTeams = getStoredTeams();
      const freedTeam = updatedTeams.find((t) => t.id === availableTeam.id)!;
      expect(freedTeam.availability).toBe('Available');
      expect(freedTeam.assignedIncidentId).toBeNull();
    });

    it('allows unassigning a team, reverting report to Reported and team to Available', () => {
      const reports = getStoredReports();
      const teams = getStoredTeams();
      const unassignedReport = reports.find((r) => !r.assignedTeamId && r.status !== 'Resolved')!;
      const availableTeam = teams.find((t) => t.availability === 'Available')!;

      assignTeamToIncident(unassignedReport.id, availableTeam.id);
      const { report, team } = unassignTeamFromIncident(unassignedReport.id);

      expect(report.status).toBe('Reported');
      expect(report.assignedTeamId).toBeNull();
      expect(team?.availability).toBe('Available');
      expect(team?.assignedIncidentId).toBeNull();
    });
  });
});
