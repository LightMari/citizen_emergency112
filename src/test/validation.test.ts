import { describe, it, expect } from 'vitest';
import { EmergencyReportSchema } from '../utils/validation';

describe('Validation Logic', () => {
  it('validates a complete valid emergency report', () => {
    const validData = {
      type: 'Fire',
      description: 'Smoke visible on second floor of apartment building.',
      latitude: 37.7749,
      longitude: -122.4194,
      address: '742 Evergreen Terrace',
      peopleAffected: 3,
      injuries: false,
      trappedPersons: true,
      hazards: ['Fire/smoke', 'Structural collapse risk'],
      severity: 'Critical',
      contactPhone: '+1-555-0199',
    };

    const parseResult = EmergencyReportSchema.safeParse(validData);
    expect(parseResult.success).toBe(true);
  });

  it('fails when neither description nor transcript is provided', () => {
    const invalidData = {
      type: 'Medical',
      description: '',
      transcript: '',
      latitude: 40.7128,
      longitude: -74.006,
      peopleAffected: 1,
      injuries: true,
      trappedPersons: false,
      hazards: [],
    };

    const parseResult = EmergencyReportSchema.safeParse(invalidData);
    expect(parseResult.success).toBe(false);
    if (!parseResult.success) {
      const paths = parseResult.error.errors.map((e) => e.path.join('.'));
      expect(paths).toContain('description');
    }
  });

  it('passes when description is empty but transcript is provided', () => {
    const dataWithVoice = {
      type: 'Road Accident',
      description: '',
      transcript: 'Two car collision on 5th avenue, police needed immediately',
      latitude: 40.7128,
      longitude: -74.006,
      peopleAffected: 2,
      injuries: true,
      trappedPersons: false,
      hazards: [],
    };

    const parseResult = EmergencyReportSchema.safeParse(dataWithVoice);
    expect(parseResult.success).toBe(true);
  });

  it('fails on invalid coordinates', () => {
    const invalidCoords = {
      type: 'Flood',
      description: 'Street flooded up to car tires',
      latitude: 105.5, // Exceeds 90
      longitude: -74.006,
      peopleAffected: 1,
      injuries: false,
      trappedPersons: false,
      hazards: ['Rising water'],
    };

    const parseResult = EmergencyReportSchema.safeParse(invalidCoords);
    expect(parseResult.success).toBe(false);
  });

  it('validates phone number when provided and rejects malformed formats', () => {
    const badPhone = {
      type: 'Other',
      description: 'Emergency assistance needed',
      latitude: 40.7128,
      longitude: -74.006,
      peopleAffected: 1,
      injuries: false,
      trappedPersons: false,
      hazards: [],
      contactPhone: 'not-a-number',
    };

    const parseResult = EmergencyReportSchema.safeParse(badPhone);
    expect(parseResult.success).toBe(false);
  });
});
