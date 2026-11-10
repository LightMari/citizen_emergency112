import {
  EmergencyReport,
  ReportStatus,
  ResponseTeam,
  TeamAvailabilityStatus,
} from '../types/report';
import { calculatePriorityScore } from '../utils/priority';
import { checkForDuplicateReport } from '../utils/deduplication';
import { calculateDistanceKm, calculateEstimatedTravelMinutes, findBestFitTeam } from '../utils/teamAssignment';
import { offlineDb } from './offlineDb';

const STORAGE_KEY = 'citizen_emergency_reports_v1';
const TEAMS_STORAGE_KEY = 'citizen_emergency_response_teams_v1';
const RATE_LIMIT_KEY = 'citizen_emergency_rate_limit';
const BROADCAST_CHANNEL_NAME = 'citizen_emergency_realtime_channel';

// Realistic sample seed response teams across Chennai, Tamil Nadu (Deliverable 2)
export const INITIAL_RESPONSE_TEAMS: ResponseTeam[] = [
  {
    id: 'TNFRS-ENG-01',
    name: 'TNFRS Station 01 (T. Nagar)',
    category: 'Fire',
    latitude: 13.0415,
    longitude: 80.2337,
    address: 'Usman Road, T. Nagar, Chennai 600017',
    availability: 'Busy',
    assignedIncidentId: 'REP-9021',
    assignedIncidentType: 'Fire',
    contactPhone: '+91 44 2434 0101',
    stationName: 'T. Nagar Fire & Rescue Station',
    vehicleType: 'Heavy Water Tender (4,500 L)',
    personnelCount: 6,
    updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'AMB-108-04',
    name: '108 ALS Ambulance Unit 04',
    category: 'Medical',
    latitude: 13.0780,
    longitude: 80.2450,
    address: 'EVR Periyar Salai, Kilpauk, Chennai 600010',
    availability: 'Available',
    assignedIncidentId: null,
    assignedIncidentType: null,
    contactPhone: '+91 108',
    stationName: 'Kilpauk Medical College Hospital Hub',
    vehicleType: 'Advanced Life Support (ALS) Ambulance',
    personnelCount: 3,
    updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'AMB-108-09',
    name: '108 Trauma Unit 09 (RGGGH)',
    category: 'Medical',
    latitude: 13.0815,
    longitude: 80.2785,
    address: 'Poonamallee High Rd, Chennai Central 600003',
    availability: 'Available',
    assignedIncidentId: null,
    assignedIncidentType: null,
    contactPhone: '+91 108',
    stationName: 'Rajiv Gandhi Govt General Hospital',
    vehicleType: 'Mobile Intensive Care Unit (ICU)',
    personnelCount: 4,
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'TNFRS-RIV-03',
    name: 'TNFRS Marina Rapid Squad 03',
    category: 'Fire',
    latitude: 13.0588,
    longitude: 80.2755,
    address: 'Kamarajar Promenade, Triplicane, Chennai 600005',
    availability: 'Available',
    assignedIncidentId: null,
    assignedIncidentType: null,
    contactPhone: '+91 44 2844 0101',
    stationName: 'Marina Coastal Fire Unit',
    vehicleType: 'Rapid Intervention Vehicle (RIV)',
    personnelCount: 5,
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'SDRF-USAR-02',
    name: 'SDRF Urban Search & Rescue 02',
    category: 'Rescue',
    latitude: 13.0694,
    longitude: 80.1948,
    address: 'Koyambedu Wholesale Market Rd, Chennai 600107',
    availability: 'Available',
    assignedIncidentId: null,
    assignedIncidentType: null,
    contactPhone: '+91 44 2479 1078',
    stationName: 'Koyambedu Disaster Base',
    vehicleType: 'Heavy Hydraulic Extrication Truck',
    personnelCount: 8,
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'POL-PEG-12',
    name: 'GCP Pegasus Patrol Unit 12',
    category: 'Police',
    latitude: 13.0368,
    longitude: 80.2676,
    address: 'Luz Church Road, Mylapore, Chennai 600004',
    availability: 'Available',
    assignedIncidentId: null,
    assignedIncidentType: null,
    contactPhone: '+91 100',
    stationName: 'Mylapore Police Range',
    vehicleType: 'Emergency Response SUV',
    personnelCount: 3,
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'POL-FS-05',
    name: 'GCP Flying Squad 05 (Anna Nagar)',
    category: 'Police',
    latitude: 13.0850,
    longitude: 80.2100,
    address: '2nd Avenue, Anna Nagar, Chennai 600040',
    availability: 'Available',
    assignedIncidentId: null,
    assignedIncidentType: null,
    contactPhone: '+91 100',
    stationName: 'Anna Nagar West Division',
    vehicleType: 'Armed Rapid Patrol Vehicle',
    personnelCount: 4,
    updatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: 'TNDMA-FLD-01',
    name: 'TNDMA Flood Rescue Unit 01',
    category: 'Disaster',
    latitude: 12.9815,
    longitude: 80.2180,
    address: 'Velachery Bypass Road, Chennai 600042',
    availability: 'Available',
    assignedIncidentId: null,
    assignedIncidentType: null,
    contactPhone: '+91 44 2243 1078',
    stationName: 'South Chennai Disaster Management Center',
    vehicleType: 'Inflatable Motorboat & De-watering Pumps',
    personnelCount: 6,
    updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
];

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
    status: 'Assigned',
    assignedTeamId: 'TNFRS-ENG-01',
    assignedTeamName: 'TNFRS Station 01 (T. Nagar)',
    assignedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    distanceKm: 0.15,
    estimatedArrivalMinutes: 3,
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
    status: 'Reported',
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
    status: 'Reported',
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
    status: 'Reported',
    contactPhone: '+91 94441 98765',
    isFalseReport: false,
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'REP-5119',
    type: 'Building Collapse',
    description: 'Old three-storey heritage building masonry wall collapse during renovation. Debris blocking narrow lane with two workers trapped.',
    latitude: 13.0881,
    longitude: 80.2801,
    address: 'Mint Street, Sowcarpet, Chennai, Tamil Nadu 600079',
    landmark: 'Near Ekambareswarar Temple',
    peopleAffected: 5,
    injuries: true,
    trappedPersons: true,
    hazards: ['Structural collapse risk'],
    severity: 'Critical',
    priorityScore: 85,
    priorityTier: 'P1',
    status: 'In Progress',
    assignedTeamId: 'SDRF-USAR-02',
    assignedTeamName: 'SDRF Urban Search & Rescue 02',
    assignedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    distanceKm: 9.4,
    estimatedArrivalMinutes: 18,
    contactPhone: '+91 98400 33445',
    isFalseReport: false,
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'REP-4093',
    type: 'Fire',
    description: 'Industrial LPG pipeline leakage and flash fire near refinery processing gate. High thermal radiation observed.',
    latitude: 13.1612,
    longitude: 80.3015,
    address: 'Manali Express Rd, Tiruvottiyur, Chennai, Tamil Nadu 600019',
    landmark: 'Near Manali Industrial Estate',
    peopleAffected: 8,
    injuries: true,
    trappedPersons: false,
    hazards: ['Gas leak', 'Fire/smoke', 'Hazardous materials'],
    severity: 'Critical',
    priorityScore: 95,
    priorityTier: 'P1',
    status: 'Assigned',
    assignedTeamId: 'TNFRS-RIV-03',
    assignedTeamName: 'TNFRS Marina Rapid Squad 03',
    assignedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    distanceKm: 11.8,
    estimatedArrivalMinutes: 22,
    contactPhone: '+91 97910 22334',
    isFalseReport: false,
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'REP-3208',
    type: 'Violence/Crime',
    description: 'Crowd disturbance and armed altercation near long-distance bus terminus during peak travel rush.',
    latitude: 13.0694,
    longitude: 80.2057,
    address: 'Koyambedu Wholesale Market Rd, Koyambedu, Chennai, Tamil Nadu 600107',
    landmark: 'Near CMBT Platform 1 Gate',
    peopleAffected: 12,
    injuries: true,
    trappedPersons: false,
    hazards: ['Armed threat'],
    severity: 'High',
    priorityScore: 70,
    priorityTier: 'P2',
    status: 'Resolved',
    contactPhone: '+91 98402 11223',
    isFalseReport: false,
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];

// BroadcastChannel setup
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel initialization error:', e);
  }
}

export type RealtimeEvent =
  | { type: 'NEW_REPORT'; report: EmergencyReport }
  | { type: 'STATUS_UPDATED'; reportId: string; status: ReportStatus; updatedAt: string }
  | { type: 'REPORT_FLAGGED_FALSE'; reportId: string; reason: string }
  | {
      type: 'TEAM_ASSIGNED';
      reportId: string;
      teamId: string;
      teamName: string;
      report: EmergencyReport;
      team: ResponseTeam;
    }
  | {
      type: 'TEAM_UNASSIGNED';
      reportId: string;
      teamId: string;
      report: EmergencyReport;
      team?: ResponseTeam;
    }
  | { type: 'TEAM_UPDATED'; team: ResponseTeam }
  | { type: 'TEAM_CREATED'; team: ResponseTeam };

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

// ==========================================
// REPORTS STORAGE HELPERS
// ==========================================

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

// ==========================================
// RESPONSE TEAMS STORAGE HELPERS (Deliverable 2)
// ==========================================

export function getStoredTeams(): ResponseTeam[] {
  if (typeof window === 'undefined') return INITIAL_RESPONSE_TEAMS;
  const stored = localStorage.getItem(TEAMS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(INITIAL_RESPONSE_TEAMS));
    return INITIAL_RESPONSE_TEAMS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse stored teams', e);
    return INITIAL_RESPONSE_TEAMS;
  }
}

export function saveStoredTeams(teams: ResponseTeam[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
}

export function createResponseTeam(
  teamData: Omit<ResponseTeam, 'id' | 'updatedAt'>
): ResponseTeam {
  const teams = getStoredTeams();
  const id = `TEAM-${teamData.category.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString();

  const newTeam: ResponseTeam = {
    ...teamData,
    id,
    updatedAt: now,
  };

  const updated = [newTeam, ...teams];
  saveStoredTeams(updated);
  broadcastEvent({ type: 'TEAM_CREATED', team: newTeam });
  return newTeam;
}

export function updateTeamAvailability(
  teamId: string,
  availability: TeamAvailabilityStatus,
  assignedIncidentId: string | null = null
): ResponseTeam | undefined {
  const teams = getStoredTeams();
  const index = teams.findIndex((t) => t.id === teamId);
  if (index === -1) return undefined;

  const now = new Date().toISOString();
  teams[index].availability = availability;
  teams[index].assignedIncidentId = assignedIncidentId;
  teams[index].updatedAt = now;

  saveStoredTeams(teams);
  broadcastEvent({ type: 'TEAM_UPDATED', team: teams[index] });
  return teams[index];
}

// ==========================================
// TEAM ASSIGNMENT & LIFECYCLE (Deliverables 3 & 4)
// ==========================================

export function assignTeamToIncident(
  incidentId: string,
  teamId: string
): { report: EmergencyReport; team: ResponseTeam } {
  const reports = getStoredReports();
  const teams = getStoredTeams();

  const reportIndex = reports.findIndex((r) => r.id === incidentId);
  const teamIndex = teams.findIndex((t) => t.id === teamId);

  if (reportIndex === -1) throw new Error(`Incident #${incidentId} not found`);
  if (teamIndex === -1) throw new Error(`Response Team #${teamId} not found`);

  const report = reports[reportIndex];
  const team = teams[teamIndex];

  // Calculate distance and ETA
  const distanceKm = calculateDistanceKm(
    report.latitude,
    report.longitude,
    team.latitude,
    team.longitude
  );
  const estimatedArrivalMinutes = calculateEstimatedTravelMinutes(distanceKm);
  const now = new Date().toISOString();

  // If incident already had a different team, free that team
  if (report.assignedTeamId && report.assignedTeamId !== teamId) {
    const prevTeamIdx = teams.findIndex((t) => t.id === report.assignedTeamId);
    if (prevTeamIdx !== -1) {
      teams[prevTeamIdx].availability = 'Available';
      teams[prevTeamIdx].assignedIncidentId = null;
      teams[prevTeamIdx].assignedIncidentType = null;
    }
  }

  // Update Report
  const updatedReport: EmergencyReport = {
    ...report,
    status: 'Assigned',
    assignedTeamId: team.id,
    assignedTeamName: team.name,
    assignedAt: now,
    distanceKm,
    estimatedArrivalMinutes,
    updatedAt: now,
  };
  reports[reportIndex] = updatedReport;

  // Update Team
  const updatedTeam: ResponseTeam = {
    ...team,
    availability: 'Busy',
    assignedIncidentId: report.id,
    assignedIncidentType: report.type,
    updatedAt: now,
  };
  teams[teamIndex] = updatedTeam;

  saveStoredReports(reports);
  saveStoredTeams(teams);

  broadcastEvent({
    type: 'TEAM_ASSIGNED',
    reportId: report.id,
    teamId: team.id,
    teamName: team.name,
    report: updatedReport,
    team: updatedTeam,
  });

  return { report: updatedReport, team: updatedTeam };
}

export function autoAssignNearestTeam(
  incidentId: string
): { report: EmergencyReport; team: ResponseTeam } | null {
  const reports = getStoredReports();
  const teams = getStoredTeams();
  const report = reports.find((r) => r.id === incidentId);
  if (!report) return null;

  const bestFit = findBestFitTeam(report, teams);
  if (!bestFit) return null;

  return assignTeamToIncident(report.id, bestFit.team.id);
}

export function unassignTeamFromIncident(
  incidentId: string
): { report: EmergencyReport; team?: ResponseTeam } {
  const reports = getStoredReports();
  const teams = getStoredTeams();

  const reportIndex = reports.findIndex((r) => r.id === incidentId);
  if (reportIndex === -1) throw new Error(`Incident #${incidentId} not found`);

  const report = reports[reportIndex];
  const prevTeamId = report.assignedTeamId;
  const now = new Date().toISOString();

  let unassignedTeam: ResponseTeam | undefined;
  if (prevTeamId) {
    const teamIndex = teams.findIndex((t) => t.id === prevTeamId);
    if (teamIndex !== -1) {
      teams[teamIndex].availability = 'Available';
      teams[teamIndex].assignedIncidentId = null;
      teams[teamIndex].assignedIncidentType = null;
      teams[teamIndex].updatedAt = now;
      unassignedTeam = teams[teamIndex];
      saveStoredTeams(teams);
    }
  }

  const updatedReport: EmergencyReport = {
    ...report,
    status: 'Reported',
    assignedTeamId: null,
    assignedTeamName: null,
    assignedAt: null,
    distanceKm: null,
    estimatedArrivalMinutes: null,
    updatedAt: now,
  };
  reports[reportIndex] = updatedReport;
  saveStoredReports(reports);

  if (prevTeamId) {
    broadcastEvent({
      type: 'TEAM_UNASSIGNED',
      reportId: report.id,
      teamId: prevTeamId,
      report: updatedReport,
      team: unassignedTeam,
    });
  }

  return { report: updatedReport, team: unassignedTeam };
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
  data: Omit<
    EmergencyReport,
    | 'id'
    | 'priorityScore'
    | 'priorityTier'
    | 'priorityRank'
    | 'status'
    | 'syncStatus'
    | 'createdAt'
    | 'updatedAt'
  >,
  isOffline = false
): Promise<{ report: EmergencyReport; duplicateWarning?: string }> {
  // Check rate limit
  const rateLimit = checkRateLimit();
  if (!rateLimit.allowed) {
    throw new Error(
      `Rate limit exceeded: Please wait ${rateLimit.remainingSeconds} seconds before submitting another report.`
    );
  }

  // Calculate priority score & tier with category weighting
  const priority = calculatePriorityScore({
    severity: data.severity,
    trappedPersons: data.trappedPersons,
    injuries: data.injuries,
    peopleAffected: data.peopleAffected,
    hazards: data.hazards,
    category: data.type,
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
    priorityRank: priority.rank,
    status: 'Reported',
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

// Update report status (Responder action) - Deliverable 4
export function updateReportStatus(reportId: string, status: ReportStatus) {
  const reports = getStoredReports();
  const index = reports.findIndex((r) => r.id === reportId);
  if (index === -1) return;

  const now = new Date().toISOString();
  reports[index].status = status;
  reports[index].updatedAt = now;

  // When an incident is marked Resolved, automatically free its assigned team!
  if (status === 'Resolved' && reports[index].assignedTeamId) {
    const teams = getStoredTeams();
    const teamIndex = teams.findIndex((t) => t.id === reports[index].assignedTeamId);
    if (teamIndex !== -1) {
      teams[teamIndex].availability = 'Available';
      teams[teamIndex].assignedIncidentId = null;
      teams[teamIndex].assignedIncidentType = null;
      teams[teamIndex].updatedAt = now;
      saveStoredTeams(teams);
      broadcastEvent({ type: 'TEAM_UPDATED', team: teams[teamIndex] });
    }
  }

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
  saveStoredTeams(INITIAL_RESPONSE_TEAMS);
  localStorage.removeItem(RATE_LIMIT_KEY);
  offlineDb.offlineQueue.clear().catch(() => {});
  return { reports: INITIAL_SEED_REPORTS, teams: INITIAL_RESPONSE_TEAMS };
}
