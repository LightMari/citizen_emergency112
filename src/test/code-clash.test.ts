import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateSeverity } from '../utils/severityEngine';
import {
  getRequiredDepartments,
  updateDepartmentResponse,
  calculateRolledUpIncidentStatus,
  getStoredDispatches,
  getStoredAdvisories,
} from '../services/departmentRouter';
import {
  submitEmergencyReport,
  getStoredReports,
  resetDemoData,
  deleteEmergencyReport,
  updateReportStatus,
  findNearestStation,
} from '../services/mockBackend';

describe('Code Clash 2026 Hackathon Test Suite', () => {
  beforeEach(() => {
    resetDemoData();
  });

  describe('1. Explainable Severity Engine', () => {
    it('accurately calculates rule-based score from category, people, keywords, and hazards', () => {
      const result = evaluateSeverity({
        category: 'Building Collapse',
        description: 'Multi-story complex partial collapse, 12 workers trapped under concrete beams, bleeding heavily.',
        peopleAffected: 12,
        trappedPersons: true,
        injuries: true,
      });

      expect(result.severity).toBe('Critical');
      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.explanation).toContain('Critical:');
      expect(result.explanation).toContain('12 people');
      expect(result.explanation).toContain('building collapse');
      expect(result.explanation).toContain('trapped');
      expect(result.explanation).toContain('bleeding');
    });

    it('correctly maps scores to Low, Medium, High, and Critical thresholds', () => {
      const lowResult = evaluateSeverity({
        category: 'Other',
        description: 'Lost wallet near bus terminus.',
        peopleAffected: 1,
      });
      expect(lowResult.severity).toBe('Low');
      expect(lowResult.score).toBeLessThan(25);

      const highResult = evaluateSeverity({
        category: 'Fire Emergency',
        description: 'Flames spreading with explosion seen in warehouse.',
        peopleAffected: 6,
        injuries: true,
      });
      expect(['High', 'Critical']).toContain(highResult.severity);
    });

    it('escalates severity score over time for unresolved incidents', () => {
      const initial = evaluateSeverity({
        category: 'Road Accident',
        description: 'Two-wheeler skid near intersection.',
        peopleAffected: 1,
        timeElapsedMinutes: 0,
      });

      const escalated = evaluateSeverity({
        category: 'Road Accident',
        description: 'Two-wheeler skid near intersection.',
        peopleAffected: 1,
        timeElapsedMinutes: 90,
      });

      expect(escalated.score).toBeGreaterThan(initial.score);
      expect(escalated.explanation).toContain('escalated');
    });
  });

  describe('2. Department Forwarding & Response Back to Area', () => {
    it('routes incidents to correct departments based on editable routing configuration', () => {
      expect(getRequiredDepartments('Fire Emergency', 'Medium')).toEqual(['Fire & Rescue']);
      expect(getRequiredDepartments('Road Accident', 'Medium')).toEqual(['Traffic Police', 'Ambulance']);
      expect(getRequiredDepartments('Medical Emergency', 'Medium')).toEqual(['Ambulance']);
      expect(getRequiredDepartments('Flood', 'Medium')).toEqual(['Disaster Management', 'Rescue Team']);
      expect(getRequiredDepartments('Building Collapse', 'Medium')).toEqual([
        'Fire & Rescue',
        'Disaster Management',
        'Ambulance',
      ]);
      expect(getRequiredDepartments('Other', 'Medium')).toEqual(['Control Room']);

      // Critical incidents are always forwarded to Control Room as well
      const criticalFire = getRequiredDepartments('Fire Emergency', 'Critical');
      expect(criticalFire).toContain('Fire & Rescue');
      expect(criticalFire).toContain('Control Room');
    });

    it('automatically creates dispatches scoped to the incident area on submit', async () => {
      const submission = await submitEmergencyReport({
        title: 'Chemical Factory Blaze',
        type: 'Fire',
        category: 'Fire Emergency',
        description: 'Chemical tanker fire with black smoke spreading across industrial street.',
        latitude: 13.0418,
        longitude: 80.2341,
        area: 'Guindy',
        peopleAffected: 4,
      });

      const dispatches = getStoredDispatches().filter((d) => d.trackingId === submission.report.trackingId);
      expect(dispatches.length).toBeGreaterThanOrEqual(1);
      expect(dispatches[0].area).toBe('Guindy');
      expect(dispatches[0].department).toBe('Fire & Rescue');
      expect(dispatches[0].status).toBe('Forwarded');
    });

    it('rolls up overall incident status based on all department dispatch responses', () => {
      expect(calculateRolledUpIncidentStatus(['Resolved', 'Resolved'])).toBe('Resolved');
      expect(calculateRolledUpIncidentStatus(['Responding', 'Acknowledged'])).toBe('In Progress');
      expect(calculateRolledUpIncidentStatus(['Acknowledged', 'Forwarded'])).toBe('Pending');
      expect(calculateRolledUpIncidentStatus(['Forwarded', 'Forwarded'])).toBe('Reported');
    });

    it('publishes response to area advisory feed when department updates response', () => {
      const dispatches = getStoredDispatches();
      expect(dispatches.length).toBeGreaterThan(0);
      const targetDispatch = dispatches[0];

      updateDepartmentResponse(
        targetDispatch.id,
        'Responding',
        '6 min',
        'Fire engine en route with sirens enabled. Please clear North Usman road.'
      );

      const advisories = getStoredAdvisories();
      const latestAdv = advisories.find((a) => a.trackingId === targetDispatch.trackingId);
      expect(latestAdv).toBeDefined();
      expect(latestAdv?.department).toBe(targetDispatch.department);
      expect(latestAdv?.message).toContain('6 min');
    });
  });

  describe('3. Tracking ID & Duplicate / Cluster Detection', () => {
    it('generates a sequential tracking code like EMG-100X on report submission', async () => {
      const sub = await submitEmergencyReport({
        type: 'Other',
        description: 'Power transmission line spark.',
        latitude: 13.0827,
        longitude: 80.2707,
        area: 'Egmore',
        peopleAffected: 0,
      });

      expect(sub.report.trackingId).toMatch(/^EMG-\d{4}$/);
      expect(sub.report.id).toMatch(/^REP-\d{4}$/);
    });

    it('detects reports within 200m and 15 mins as duplicates/cluster, increments report count and escalates severity', async () => {
      const initial = await submitEmergencyReport({
        type: 'Fire',
        category: 'Fire Emergency',
        description: 'Fire in ground floor storage unit.',
        latitude: 13.0300,
        longitude: 80.2400,
        area: 'Alwarpet',
        peopleAffected: 2,
      });

      expect(initial.isLinkedCluster).toBeFalsy();

      // Submit identical category report ~50 meters away immediately
      const duplicate = await submitEmergencyReport({
        type: 'Fire',
        category: 'Fire Emergency',
        description: 'Heavy smoke coming from ground floor storage unit.',
        latitude: 13.0302, // ~25 meters offset
        longitude: 80.2402,
        area: 'Alwarpet',
        peopleAffected: 3,
      });

      expect(duplicate.isLinkedCluster).toBe(true);
      expect(duplicate.duplicateWarning).toContain('Linked to existing active');
      expect(duplicate.report.reportCount).toBeGreaterThanOrEqual(2);
      expect(duplicate.report.severityExplanation).toContain('clustered reports');
    });
  });

  describe('4. Admin Actions & Station Management', () => {
    it('allows admin to update status and delete incidents', () => {
      const reports = getStoredReports();
      const firstReport = reports[0];

      updateReportStatus(firstReport.id, 'Resolved', 'Area inspection complete', 'Triage Officer');
      const updated = getStoredReports().find((r) => r.id === firstReport.id);
      expect(updated?.status).toBe('Resolved');
      expect(updated?.statusHistory?.some((h) => h.status === 'Resolved')).toBe(true);

      const deleted = deleteEmergencyReport(firstReport.id);
      expect(deleted).toBe(true);
      const remaining = getStoredReports().find((r) => r.id === firstReport.id);
      expect(remaining).toBeUndefined();
    });

    it('identifies nearest station using Haversine calculation', () => {
      // Marina Beach Coordinates
      const nearest = findNearestStation(13.0500, 80.2824, 'Fire & Rescue');
      expect(nearest).not.toBeNull();
      expect(nearest?.station.name).toContain('Marina');
      expect(nearest?.distanceKm).toBeLessThan(3);
    });
  });
});
