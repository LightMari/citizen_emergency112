import { EmergencyReport, ReportStatus } from '../types/report';
import { calculatePriorityScore } from '../utils/priority';
import { checkForDuplicateReport } from '../utils/deduplication';
import { offlineDb } from './offlineDb';

const STORAGE_KEY = 'citizen_emergency_reports_v1';
const RATE_LIMIT_KEY = 'citizen_emergency_rate_limit';
const BROADCAST_CHANNEL_NAME = 'citizen_emergency_realtime_channel';

// Realistic sample seed reports for Chennai, Tamil Nadu
export const INITIAL_SEED_REPORTS: EmergencyReport[] = [
  {
    id: 'REP-9021',
    type: 'Fire',
    description: 'Commercial textile showroom electrical panel fire. Heavy black smoke spreading to upper floors. Dense foot traffic in bazaar.',
    latitude: 13.0418,
    longitude: 80.2341,
    address: 'Ranganathan St, T. Nagar, Chennai, Tamil Nadu 600017',
    landmark: 'Near Usman Road Junction',
    peopleAffected: 6,
    injuries: true,
    trappedPersons: true,
    hazards: ['Fire/smoke', 'Structural collapse risk'],
    severity: 'Critical',
    priorityScore: 90,
    priorityTier: 'P1',
    status: 'Dispatched',
    contactPhone: '+91 94440 12345',
    isFalseReport: false,
    syncStatus: 'synced',
    media: [
      {
        id: 'med-1',
        reportId: 'REP-9021',
        kind: 'image',
        name: 'smoke_building.jpg',
        url: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=800&q=80',
        size: 245000,
        mimeType: 'image/jpeg',
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'REP-8412',
    type: 'Road Accident',
    description: 'Multi-vehicle collision on flyover descent. MTC bus and two-wheeler involved. Driver disoriented and injured.',
    latitude: 13.0067,
    longitude: 80.2033,
    address: 'Kathipara Junction, Guindy, Chennai, Tamil Nadu 600032',
    landmark: 'Near Guindy Metro Station',
    peopleAffected: 3,
    injuries: true,
    trappedPersons: false,
    hazards: ['Gas leak'],
    severity: 'High',
    priorityScore: 65,
    priorityTier: 'P2',
    status: 'Verified',
    contactPhone: '+91 98401 56789',
    isFalseReport: false,
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: 'REP-7731',
    type: 'Flood',
    description: 'Monsoon canal water overflow. Knee-deep inundation on residential road with stalled vehicles and basement waterlogging.',
    latitude: 12.9759,
    longitude: 80.2212,
    address: 'Velachery Main Rd, Velachery, Chennai, Tamil Nadu 600042',
    landmark: 'Near Velachery MRTS Station',
    peopleAffected: 4,
    injuries: false,
    trappedPersons: false,
    hazards: ['Rising water'],
    severity: 'Medium',
    priorityScore: 40,
    priorityTier: 'P3',
    status: 'Received',
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
  {
    id: 'REP-6520',
    type: 'Medical',
    description: 'Morning walker collapsed near beach promenade, breathing heavily, bystanders administering CPR. 108 ambulance summoned.',
    latitude: 13.0500,
    longitude: 80.2824,
    address: 'Kamarajar Salai, Marina Beach, Triplicane, Chennai, Tamil Nadu 600005',
    landmark: 'Opposite Marina Beach Lighthouse',
    peopleAffected: 1,
    injuries: true,
    trappedPersons: false,
    hazards: [],
    severity: 'Critical',
    priorityScore: 75,
    priorityTier: 'P1',
    status: 'Resolved',
    contactPhone: '+91 91760 88990',
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'REP-5219',
    type: 'Building Collapse',
    description: 'Heritage commercial structure second floor balcony collapsed onto narrow street. Two pedestrians trapped beneath masonry rubble.',
    latitude: 13.0891,
    longitude: 80.2825,
    address: 'NSC Bose Rd, Sowcarpet, George Town, Chennai, Tamil Nadu 600001',
    landmark: 'Near Flower Bazaar Police Station',
    peopleAffected: 5,
    injuries: true,
    trappedPersons: true,
    hazards: ['Structural collapse risk'],
    severity: 'Critical',
    priorityScore: 88,
    priorityTier: 'P1',
    status: 'Dispatched',
    contactPhone: '+91 98410 44321',
    isFalseReport: false,
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: 'REP-4180',
    type: 'Other',
    description: 'Ammonia refrigeration valve leak detected in industrial ice packing warehouse. Pungent fumes leaking towards neighboring quarters.',
    latitude: 13.1652,
    longitude: 80.2911,
    address: 'Ennore Expressway, Tiruvottiyur, Chennai, Tamil Nadu 600019',
    landmark: 'Near Ennore Thermal Station gate',
    peopleAffected: 2,
    injuries: false,
    trappedPersons: false,
    hazards: ['Gas leak', 'Hazardous materials'],
    severity: 'High',
    priorityScore: 68,
    priorityTier: 'P2',
    status: 'Verified',
    contactPhone: '+91 94441 77665',
    isFalseReport: false,
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
  },
  {
    id: 'REP-3304',
    type: 'Violence/Crime',
    description: 'Crowd disturbance and armed altercation near long-distance bus terminus platforms. Commuters sheltering inside waiting hall.',
    latitude: 13.0694,
    longitude: 80.2056,
    address: 'CMBT Bus Terminus, Koyambedu, Chennai, Tamil Nadu 600107',
    landmark: 'Near Platform 3 entrance',
    peopleAffected: 8,
    injuries: true,
    trappedPersons: false,
    hazards: ['Armed threat'],
    severity: 'High',
    priorityScore: 72,
    priorityTier: 'P2',
    status: 'Received',
    contactPhone: '+91 97909 33210',
    isFalseReport: false,
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
];

// Broadcast channel for cross-tab communication (simulating WebSockets)
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
}

export type RealtimeEvent =
  | { type: 'NEW_REPORT'; report: EmergencyReport }
  | { type: 'STATUS_UPDATED'; reportId: string; status: ReportStatus; updatedAt: string }
  | { type: 'REPORT_FLAGGED_FALSE'; reportId: string; reason: string };

type EventListener = (event: RealtimeEvent) => void;
const listeners: Set<EventListener> = new Set();

if (broadcastChannel) {
  broadcastChannel.onmessage = (messageEvent) => {
    listeners.forEach((fn) => fn(messageEvent.data));
  };
}

export function subscribeToRealtimeReports(listener: EventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function broadcastEvent(event: RealtimeEvent) {
  listeners.forEach((fn) => fn(event));
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(event);
    } catch (e) {
      console.warn('BroadcastChannel postMessage error:', e);
    }
  }
}

// Storage helpers
export function getStoredReports(): EmergencyReport[] {
  if (typeof window === 'undefined') return INITIAL_SEED_REPORTS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_REPORTS));
    return INITIAL_SEED_REPORTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse stored reports', e);
    return INITIAL_SEED_REPORTS;
  }
}

export function saveStoredReports(reports: EmergencyReport[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  // Also update Dexie cached reports in background
  offlineDb.cachedReports.bulkPut(reports).catch(() => {});
}

// Rate-limiting check: max 5 reports in 10 minutes
export function checkRateLimit(): { allowed: boolean; remainingSeconds: number } {
  if (typeof window === 'undefined') return { allowed: true, remainingSeconds: 0 };
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxSubmissions = 5;

  const raw = localStorage.getItem(RATE_LIMIT_KEY);
  let timestamps: number[] = raw ? JSON.parse(raw) : [];
  timestamps = timestamps.filter((t) => now - t < windowMs);

  if (timestamps.length >= maxSubmissions) {
    const oldest = timestamps[0];
    const remainingSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, remainingSeconds };
  }

  return { allowed: true, remainingSeconds: 0 };
}

export function recordRateLimitSubmission() {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const raw = localStorage.getItem(RATE_LIMIT_KEY);
  let timestamps: number[] = raw ? JSON.parse(raw) : [];
  timestamps = timestamps.filter((t) => now - t < windowMs);
  timestamps.push(now);
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(timestamps));
}

// Submit a new report
export async function submitEmergencyReport(
  data: Omit<EmergencyReport, 'id' | 'priorityScore' | 'priorityTier' | 'status' | 'syncStatus' | 'createdAt' | 'updatedAt'>,
  isOffline = false
): Promise<{ report: EmergencyReport; duplicateWarning?: string }> {
  // Check rate limit
  const rateLimit = checkRateLimit();
  if (!rateLimit.allowed) {
    throw new Error(
      `Rate limit exceeded: Please wait ${rateLimit.remainingSeconds} seconds before submitting another report.`
    );
  }

  // Calculate priority score & tier
  const priority = calculatePriorityScore({
    severity: data.severity,
    trappedPersons: data.trappedPersons,
    injuries: data.injuries,
    peopleAffected: data.peopleAffected,
    hazards: data.hazards,
  });

  const existing = getStoredReports();

  // Check duplicate
  const dupCheck = checkForDuplicateReport(
    {
      type: data.type,
      latitude: data.latitude,
      longitude: data.longitude,
    },
    existing
  );

  const id = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const newReport: EmergencyReport = {
    ...data,
    id,
    priorityScore: priority.score,
    priorityTier: priority.tier,
    status: 'Received',
    syncStatus: isOffline ? 'pending' : 'synced',
    isPotentialDuplicate: dupCheck.isDuplicate,
    duplicateOfId: dupCheck.duplicateOf?.id,
    createdAt: now,
    updatedAt: now,
  };

  recordRateLimitSubmission();

  if (isOffline) {
    // Save to IndexedDB offline queue
    await offlineDb.offlineQueue.put({
      id: newReport.id,
      reportData: newReport,
      queuedAt: now,
      retryCount: 0,
    });
    return {
      report: newReport,
      duplicateWarning: dupCheck.isDuplicate
        ? `Similar ${data.type} report exists within ${dupCheck.distanceMeters}m.`
        : undefined,
    };
  }

  // Save to active reports
  const updated = [newReport, ...existing];
  saveStoredReports(updated);

  // Broadcast realtime event
  broadcastEvent({ type: 'NEW_REPORT', report: newReport });

  return {
    report: newReport,
    duplicateWarning: dupCheck.isDuplicate
      ? `A similar active ${data.type} report (#${dupCheck.duplicateOf?.id}) was filed ${dupCheck.timeDiffMinutes} min ago (${dupCheck.distanceMeters}m away). Linked for responders.`
      : undefined,
  };
}

// Update report status (Responder action)
export function updateReportStatus(reportId: string, status: ReportStatus) {
  const reports = getStoredReports();
  const index = reports.findIndex((r) => r.id === reportId);
  if (index === -1) return;

  const now = new Date().toISOString();
  reports[index].status = status;
  reports[index].updatedAt = now;
  saveStoredReports(reports);

  broadcastEvent({
    type: 'STATUS_UPDATED',
    reportId,
    status,
    updatedAt: now,
  });
}

// Mark report as false alarm
export function flagFalseReport(reportId: string, reason: string) {
  const reports = getStoredReports();
  const index = reports.findIndex((r) => r.id === reportId);
  if (index === -1) return;

  const now = new Date().toISOString();
  reports[index].isFalseReport = true;
  reports[index].falseReportReason = reason;
  reports[index].updatedAt = now;
  saveStoredReports(reports);

  broadcastEvent({
    type: 'REPORT_FLAGGED_FALSE',
    reportId,
    reason,
  });
}

// Reset data to seeds (helpful for testing & demo)
export function resetDemoData() {
  saveStoredReports(INITIAL_SEED_REPORTS);
  localStorage.removeItem(RATE_LIMIT_KEY);
  offlineDb.offlineQueue.clear().catch(() => {});
  return INITIAL_SEED_REPORTS;
}
