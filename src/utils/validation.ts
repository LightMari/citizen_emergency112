import { z } from 'zod';

export const EMERGENCY_TYPES = [
  'Fire',
  'Fire Emergency',
  'Medical',
  'Medical Emergency',
  'Flood',
  'Earthquake',
  'Road Accident',
  'Building Collapse',
  'Violence/Crime',
  'Other',
] as const;

export const HAZARDS = [
  'Fire/smoke',
  'Gas leak',
  'Structural collapse risk',
  'Hazardous materials',
  'Armed threat',
  'Rising water',
] as const;

export const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'] as const;

export const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;

export const EmergencyReportSchema = z
  .object({
    title: z.string().max(200).optional(),
    area: z.string().max(100).optional(),
    type: z.enum(EMERGENCY_TYPES, {
      required_error: 'Please select an emergency type.',
    }),
    category: z.string().optional(),
    description: z
      .string()
      .max(1000, 'Description cannot exceed 1000 characters')
      .default(''),
    transcript: z.string().max(2000).optional(),
    latitude: z
      .number({ required_error: 'Location is required' })
      .min(-90)
      .max(90),
    longitude: z
      .number({ required_error: 'Location is required' })
      .min(-180)
      .max(180),
    address: z.string().max(300).optional(),
    landmark: z.string().max(200).optional(),
    peopleAffected: z
      .number()
      .int()
      .min(0, 'People affected cannot be negative')
      .max(10000, 'Please enter a realistic count')
      .default(1),
    injuries: z.boolean().default(false),
    trappedPersons: z.boolean().default(false),
    hazards: z.array(z.enum(HAZARDS)).default([]),
    severity: z.enum(SEVERITY_LEVELS).optional(),
    contactPhone: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.trim() === '' || phoneRegex.test(val.replace(/\s+/g, '')),
        { message: 'Invalid phone number format' }
      ),
    contactEmail: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        { message: 'Invalid email address format' }
      ),
  })
  .refine(
    (data) => {
      const hasDesc = data.description && data.description.trim().length > 0;
      const hasTranscript = data.transcript && data.transcript.trim().length > 0;
      return hasDesc || hasTranscript;
    },
    {
      message: 'Please provide either a text description or a voice recording',
      path: ['description'],
    }
  );

export type ValidatedEmergencyReportInput = z.infer<typeof EmergencyReportSchema>;
