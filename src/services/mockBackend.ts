import {
  EmergencyReport,
  EmergencyType,
  EmergencyCategory,
  ReportStatus,
  ResponseTeam,
  TeamAvailabilityStatus,
  DepartmentStation,
} from '../types/report';
import { checkForDuplicateReport } from '../utils/deduplication';
import { calculateDistanceKm, calculateEstimatedTravelMinutes, findBestFitTeam } from '../utils/teamAssignment';
import { evaluateSeverity, normalizeCategory } from '../utils/severityEngine';
import {
  createDispatchesForIncident,
  INITIAL_SEED_DISPATCHES,
  INITIAL_SEED_ADVISORIES,
  saveStoredDispatches,
  saveStoredAdvisories,
} from './departmentRouter';
import { offlineDb } from './offlineDb';

const STORAGE_KEY = 'citizen_emergency_reports_v1';
const TEAMS_STORAGE_KEY = 'citizen_emergency_response_teams_v1';
const STATIONS_STORAGE_KEY = 'citizen_emergency_stations_v1';
const RATE_LIMIT_KEY = 'citizen_emergency_rate_limit';
const BROADCAST_CHANNEL_NAME = 'citizen_emergency_realtime_channel';

// 9. Round-2 Readiness: Seed 2-3 stations per department across Chennai (Deliverable 9)
export const INITIAL_DEPARTMENT_STATIONS: DepartmentStation[] = [
  // Fire & Rescue
  {
    id: 'STN-FIRE-01',
    name: 'TNFRS Station 01 (T. Nagar)',
    department: 'Fire & Rescue',
    category: 'Fire',
    latitude: 13.0415,
    longitude: 80.2337,
    available: true,
    address: 'Usman Road, T. Nagar, Chennai 600017',
    contactPhone: '+91 44 2434 0101',
    vehicleType: 'Heavy Water Tender (4,500 L)',
    personnelCount: 6,
  },
  {
    id: 'STN-FIRE-02',
    name: 'TNFRS Marina Coastal Squad',
    department: 'Fire & Rescue',
    category: 'Fire',
    latitude: 13.0588,
    longitude: 80.2755,
    available: true,
    address: 'Kamarajar Promenade, Triplicane, Chennai 600005',
    contactPhone: '+91 44 2844 0101',
    vehicleType: 'Rapid Intervention Vehicle',
    personnelCount: 5,
  },
  {
    id: 'STN-FIRE-03',
    name: 'TNFRS Kilpauk Station',
    department: 'Fire & Rescue',
    category: 'Fire',
    latitude: 13.0805,
    longitude: 80.2421,
    available: true,
    address: 'Kilpauk Garden Road, Chennai 600010',
    contactPhone: '+91 44 2644 0101',
    vehicleType: 'Turn-table Ladder Unit',
    personnelCount: 5,
  },

  // Traffic Police
  {
    id: 'STN-POL-01',
    name: 'Guindy Traffic Police Range',
    department: 'Traffic Police',
    category: 'Police',
    latitude: 13.0067,
    longitude: 80.2033,
    available: true,
    address: 'Kathipara Junction, Guindy, Chennai 600032',
    contactPhone: '+91 44 2235 0100',
    vehicleType: 'Interception Patrol Cruiser',
    personnelCount: 4,
  },
  {
    id: 'STN-POL-02',
    name: 'Mylapore Range Pegasus Squad',
    department: 'Traffic Police',
    category: 'Police',
    latitude: 13.0368,
    longitude: 80.2676,
    available: true,
    address: 'Luz Church Road, Mylapore, Chennai 600004',
    contactPhone: '+91 44 2498 0100',
    vehicleType: 'Highway Patrol SUV',
    personnelCount: 3,
  },
  {
    id: 'STN-POL-03',
    name: 'Anna Nagar Traffic Sector',
    department: 'Traffic Police',
    category: 'Police',
    latitude: 13.0850,
    longitude: 80.2100,
    available: true,
    address: '2nd Avenue, Anna Nagar, Chennai 600040',
    contactPhone: '+91 44 2621 0100',
    vehicleType: 'Traffic Control Mobile Unit',
    personnelCount: 4,
  },

  // Ambulance
  {
    id: 'STN-AMB-01',
    name: '108 ALS Ambulance Hub (Kilpauk)',
    department: 'Ambulance',
    category: 'Medical',
    latitude: 13.0780,
    longitude: 80.2450,
    available: true,
    address: 'EVR Periyar Salai, Kilpauk, Chennai 600010',
    contactPhone: '+91 108',
    vehicleType: 'Advanced Life Support (ALS) Ambulance',
    personnelCount: 3,
  },
  {
    id: 'STN-AMB-02',
    name: '108 Trauma Unit (RGGGH Central)',
    department: 'Ambulance',
    category: 'Medical',
    latitude: 13.0815,
    longitude: 80.2785,
    available: true,
    address: 'Poonamallee High Rd, Chennai Central 600003',
    contactPhone: '+91 108',
    vehicleType: 'Critical Mobile ICU',
    personnelCount: 4,
  },
  {
    id: 'STN-AMB-03',
    name: '108 Stanley Hospital Station',
    department: 'Ambulance',
    category: 'Medical',
    latitude: 13.1070,
    longitude: 80.2870,
    available: true,
    address: 'Old Jail Rd, Royapuram, Chennai 600001',
    contactPhone: '+91 108',
    vehicleType: 'Emergency Life Support Unit',
    personnelCount: 3,
  },

  // Disaster Management
  {
    id: 'STN-DM-01',
    name: 'TNDMA South Flood Base (Velachery)',
    department: 'Disaster Management',
    category: 'Disaster',
    latitude: 12.9815,
    longitude: 80.2180,
    available: true,
    address: 'Velachery Bypass Road, Chennai 600042',
    contactPhone: '+91 44 2243 1078',
    vehicleType: 'Inflatable Boat & De-watering Pumps',
    personnelCount: 6,
  },
  {
    id: 'STN-DM-02',
    name: 'North Chennai Disaster Response Depot',
    department: 'Disaster Management',
    category: 'Disaster',
    latitude: 13.1612,
    longitude: 80.3015,
    available: true,
    address: 'Manali Express Rd, Tiruvottiyur 600019',
    contactPhone: '+91 44 2573 1078',
    vehicleType: 'Multi-Terrain Hazmat Recovery Vehicle',
    personnelCount: 7,
  },

  // Rescue Team
  {
    id: 'STN-RESC-01',
    name: 'SDRF Koyambedu USAR Team',
    department: 'Rescue Team',
    category: 'Rescue',
    latitude: 13.0694,
    longitude: 80.1948,
    available: true,
    address: 'Koyambedu Wholesale Market Rd, Chennai 600107',
    contactPhone: '+91 44 2479 1078',
    vehicleType: 'Heavy Hydraulic Collapse Extrication Truck',
    personnelCount: 8,
  },
  {
    id: 'STN-RESC-02',
    name: 'NDRF Coastal Search & Rescue',
    department: 'Rescue Team',
    category: 'Rescue',
    latitude: 13.0500,
    longitude: 80.2824,
    available: true,
    address: 'Marina Promenade, Chennai 600005',
    contactPhone: '+91 44 2844 1078',
    vehicleType: 'Amphibious Rescue Transport',
    personnelCount: 6,
  },

  // Control Room
  {
    id: 'STN-CTRL-01',
    name: 'GCC Ripon Building Central Command',
    department: 'Control Room',
    category: 'General',
    latitude: 13.0827,
    longitude: 80.2707,
    available: true,
    address: 'Sydenhams Rd, Periamet, Chennai 600003',
    contactPhone: '+91 44 2538 4520',
    vehicleType: 'Mobile Dispatch Command Van',
    personnelCount: 12,
  },
  {
    id: 'STN-CTRL-02',
    name: 'TN 112 State Emergency Center',
    department: 'Control Room',
    category: 'General',
    latitude: 13.0418,
    longitude: 80.2500,
    available: true,
    address: 'Cathedral Road, Chennai 600086',
    contactPhone: '+91 112',
    vehicleType: 'Satellite Communication Unit',
    personnelCount: 10,
  },
];

// Seed 8-10 Sample Incidents with Tracking IDs EMG-1001 to EMG-1008
export const INITIAL_SEED_REPORTS: EmergencyReport[] = [
  {
    id: 'REP-9021',
    trackingId: 'EMG-1001',
    title: 'Textile Showroom Electrical Fire',
    type: 'Fire',
    category: 'Fire Emergency',
    description: 'Commercial textile showroom electrical panel fire. Heavy black smoke spreading to upper floors with trapped sales staff.',
    latitude: 13.0418,
    longitude: 80.2341,
    area: 'T. Nagar',
    address: 'Ranganathan St, T. Nagar, Chennai, Tamil Nadu 600017',
    landmark: 'Near Usman Road Junction',
    peopleAffected: 6,
    injuries: true,
    trappedPersons: true,
    hazards: ['Fire/smoke', 'Structural collapse risk'],
    severity: 'Critical',
    severityScore: 92,
    severityExplanation: "Critical: 6 people + fire emergency + keyword 'trapped' + spreading",
    priorityScore: 92,
    priorityTier: 'P1',
    priorityRank: 'Critical',
    status: 'In Progress',
    statusHistory: [
      { status: 'Reported', timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), note: 'Initial citizen telemetry logged' },
      { status: 'Pending', timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(), note: 'Dispatched to Fire & Rescue and Control Room' },
      { status: 'In Progress', timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(), note: 'TNFRS Station 01 acknowledged with ETA 5 min' },
    ],
    reportCount: 3,
    assignedTeamId: 'TNFRS-ENG-01',
    assignedTeamName: 'TNFRS Station 01 (T. Nagar)',
    assignedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    distanceKm: 0.15,
    estimatedArrivalMinutes: 3,
    contactPhone: '+91 94440 12345',
    isFalseReport: false,
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'REP-8412',
    trackingId: 'EMG-1002',
    title: 'Multi-Vehicle Collision on Flyover',
    type: 'Road Accident',
    category: 'Road Accident',
    description: 'Multi-vehicle collision on flyover descent. MTC bus and two-wheeler involved. Driver bleeding and disoriented on highway.',
    latitude: 13.0067,
    longitude: 80.2033,
    area: 'Guindy',
    address: 'Kathipara Junction, Guindy, Chennai, Tamil Nadu 600032',
    landmark: 'Near Guindy Metro Station',
    peopleAffected: 3,
    injuries: true,
    trappedPersons: false,
    hazards: ['Gas leak'],
    severity: 'High',
    severityScore: 68,
    severityExplanation: "High: 3 people + road accident + keyword 'bleeding'",
    priorityScore: 68,
    priorityTier: 'P2',
    priorityRank: 'High',
    status: 'In Progress',
    statusHistory: [
      { status: 'Reported', timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(), note: 'Citizen emergency alert logged' },
      { status: 'In Progress', timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(), note: 'Traffic Police and 108 Ambulance responding' },
    ],
    reportCount: 1,
    contactPhone: '+91 98401 56789',
    isFalseReport: false,
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'REP-7731',
    trackingId: 'EMG-1003',
    title: 'Canal Overflow & Road Inundation',
    type: 'Flood',
    category: 'Flood',
    description: 'Monsoon canal water overflow. Knee-deep inundation on residential road with stalled vehicles and children needing evacuation.',
    latitude: 12.9759,
    longitude: 80.2212,
    area: 'Velachery',
    address: 'Velachery Main Rd, Velachery, Chennai, Tamil Nadu 600042',
    landmark: 'Near Velachery MRTS Station',
    peopleAffected: 4,
    injuries: false,
    trappedPersons: false,
    hazards: ['Rising water'],
    severity: 'Medium',
    severityScore: 46,
    severityExplanation: "Medium: 4 people + flood + keyword 'children'",
    priorityScore: 46,
    priorityTier: 'P3',
    priorityRank: 'Medium',
    status: 'Pending',
    statusHistory: [
      { status: 'Reported', timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(), note: 'Reported via web portal' },
      { status: 'Pending', timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(), note: 'Forwarded to Disaster Management & Rescue Team' },
    ],
    reportCount: 1,
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
  },
  {
    id: 'REP-6520',
    trackingId: 'EMG-1004',
    title: 'Promenade Collapse & Cardiac Distress',
    type: 'Medical',
    category: 'Medical Emergency',
    description: 'Morning walker collapsed near beach promenade, unconscious and breathing heavily. Bystanders administering CPR.',
    latitude: 13.0500,
    longitude: 80.2824,
    area: 'Triplicane',
    address: 'Kamarajar Salai, Marina Beach, Triplicane, Chennai, Tamil Nadu 600005',
    landmark: 'Opposite Marina Beach Lighthouse',
    peopleAffected: 1,
    injuries: true,
    trappedPersons: false,
    hazards: [],
    severity: 'Critical',
    severityScore: 78,
    severityExplanation: "Critical: 1 person + medical emergency + keyword 'unconscious'",
    priorityScore: 78,
    priorityTier: 'P1',
    priorityRank: 'Critical',
    status: 'In Progress',
    statusHistory: [
      { status: 'Reported', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), note: 'Reported via One-Touch SOS' },
      { status: 'In Progress', timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), note: '108 ALS Ambulance unit responding, ETA 4 min' },
    ],
    reportCount: 1,
    contactPhone: '+91 94441 98765',
    isFalseReport: false,
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'REP-5119',
    trackingId: 'EMG-1005',
    title: 'Masonry Wall Collapse during Renovation',
    type: 'Building Collapse',
    category: 'Building Collapse',
    description: 'Old heritage commercial building masonry wall collapsed. Rubble trapping two construction workers beneath debris.',
    latitude: 13.0881,
    longitude: 80.2801,
    area: 'Sowcarpet',
    address: 'Mint Street, Sowcarpet, Chennai, Tamil Nadu 600079',
    landmark: 'Near Ekambareswarar Temple',
    peopleAffected: 5,
    injuries: true,
    trappedPersons: true,
    hazards: ['Structural collapse risk'],
    severity: 'Critical',
    severityScore: 88,
    severityExplanation: "Critical: 5 people + building collapse + keyword 'trapped'",
    priorityScore: 88,
    priorityTier: 'P1',
    priorityRank: 'Critical',
    status: 'In Progress',
    statusHistory: [
      { status: 'Reported', timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(), note: 'Emergency alert logged' },
      { status: 'In Progress', timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(), note: 'SDRF Urban Rescue 02 extrication underway' },
    ],
    reportCount: 2,
    assignedTeamId: 'SDRF-USAR-02',
    assignedTeamName: 'SDRF Urban Search & Rescue 02',
    assignedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
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
    trackingId: 'EMG-1006',
    title: 'Industrial LPG Pipeline Flash Fire',
    type: 'Fire',
    category: 'Fire Emergency',
    description: 'Industrial LPG pipeline leakage and flash fire near refinery processing gate. High thermal radiation spreading towards perimeter.',
    latitude: 13.1612,
    longitude: 80.3015,
    area: 'Manali',
    address: 'Manali Express Rd, Tiruvottiyur, Chennai, Tamil Nadu 600019',
    landmark: 'Near Manali Industrial Estate',
    peopleAffected: 8,
    injuries: true,
    trappedPersons: false,
    hazards: ['Gas leak', 'Fire/smoke', 'Hazardous materials'],
    severity: 'Critical',
    severityScore: 94,
    severityExplanation: "Critical: 8 people + fire emergency + keyword 'spreading' + gas leak",
    priorityScore: 94,
    priorityTier: 'P1',
    priorityRank: 'Critical',
    status: 'In Progress',
    statusHistory: [
      { status: 'Reported', timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(), note: 'Industrial safety officer reported' },
      { status: 'In Progress', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), note: 'TNFRS foam tender units responding' },
    ],
    reportCount: 1,
    contactPhone: '+91 97910 22334',
    isFalseReport: false,
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'REP-3208',
    trackingId: 'EMG-1007',
    title: 'Bus Terminus Crowd Incident',
    type: 'Other',
    category: 'Other',
    description: 'Crowd surge disturbance near long-distance bus terminus during festival rush. Area secured by police patrol.',
    latitude: 13.0694,
    longitude: 80.2057,
    area: 'Koyambedu',
    address: 'Koyambedu Wholesale Market Rd, Chennai, Tamil Nadu 600107',
    landmark: 'Near CMBT Platform 1 Gate',
    peopleAffected: 12,
    injuries: false,
    trappedPersons: false,
    hazards: [],
    severity: 'Medium',
    severityScore: 35,
    severityExplanation: "Medium: 12 people + other incident",
    priorityScore: 35,
    priorityTier: 'P3',
    priorityRank: 'Medium',
    status: 'Resolved',
    statusHistory: [
      { status: 'Reported', timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(), note: 'Crowd panic reported' },
      { status: 'In Progress', timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString(), note: 'Police deployed' },
      { status: 'Resolved', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), note: 'Crowd dispersed safely' },
    ],
    reportCount: 1,
    contactPhone: '+91 98402 11223',
    isFalseReport: false,
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'REP-2104',
    trackingId: 'EMG-1008',
    title: 'Residential High-Rise Kitchen Smoke',
    type: 'Fire',
    category: 'Fire Emergency',
    description: 'Apartment 4th floor kitchen cylinder regulator gas leak with dense smoke spreading into corridor. Resident safely evacuated.',
    latitude: 13.0850,
    longitude: 80.2100,
    area: 'Anna Nagar',
    address: '2nd Avenue, Anna Nagar, Chennai, Tamil Nadu 600040',
    landmark: 'Near Roundtana Tower',
    peopleAffected: 2,
    injuries: false,
    trappedPersons: false,
    hazards: ['Gas leak', 'Fire/smoke'],
    severity: 'High',
    severityScore: 62,
    severityExplanation: "High: 2 people + fire emergency + keyword 'spreading' + gas leak",
    priorityScore: 62,
    priorityTier: 'P2',
    priorityRank: 'High',
    status: 'Reported',
    statusHistory: [
      { status: 'Reported', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), note: 'Reported by resident via web portal' },
    ],
    reportCount: 1,
    contactPhone: '+91 98405 66778',
    isFalseReport: false,
    syncStatus: 'synced',
    media: [],
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
];

// BroadcastChannel
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel error:', e);
  }
}

export type RealtimeEvent =
  | { type: 'NEW_REPORT'; report: EmergencyReport }
  | { type: 'STATUS_UPDATED'; reportId: string; status: ReportStatus; updatedAt: string }
  | { type: 'REPORT_DELETED'; reportId: string }
  | { type: 'REPORT_FLAGGED_FALSE'; reportId: string; reason: string }
  | { type: 'DISPATCH_UPDATED'; dispatchId: string }
  | { type: 'ADVISORY_PUBLISHED'; area: string }
  | { type: 'TEAM_UPDATED'; team: ResponseTeam };

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

export function broadcastEvent(event: RealtimeEvent) {
  listeners.forEach((fn) => fn(event));
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(event);
    } catch (e) {
      console.warn('BroadcastChannel postMessage error:', e);
    }
  }
}

// Reports storage
export function getStoredReports(): EmergencyReport[] {
  if (typeof window === 'undefined') return INITIAL_SEED_REPORTS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_REPORTS));
    return INITIAL_SEED_REPORTS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_SEED_REPORTS;
  }
}

export function saveStoredReports(reports: EmergencyReport[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  offlineDb.cachedReports.bulkPut(reports).catch(() => {});
}

// Delete incident (Deliverable 1 Admin feature)
export function deleteEmergencyReport(reportId: string): boolean {
  const reports = getStoredReports();
  const filtered = reports.filter((r) => r.id !== reportId && r.trackingId !== reportId);
  if (filtered.length === reports.length) return false;

  saveStoredReports(filtered);
  broadcastEvent({ type: 'REPORT_DELETED', reportId });
  return true;
}

// Response Teams Storage
export function getStoredTeams(): ResponseTeam[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(TEAMS_STORAGE_KEY);
  if (!stored) {
    // Generate initial teams from department stations
    const initialTeams: ResponseTeam[] = INITIAL_DEPARTMENT_STATIONS.map((stn) => ({
      id: `TEAM-${stn.id.replace('STN-', '')}`,
      name: stn.name,
      category: stn.category,
      department: stn.department,
      latitude: stn.latitude,
      longitude: stn.longitude,
      address: stn.address,
      availability: stn.available ? 'Available' : 'Busy',
      assignedIncidentId: null,
      assignedIncidentType: null,
      contactPhone: stn.contactPhone,
      stationName: stn.name,
      vehicleType: stn.vehicleType,
      personnelCount: stn.personnelCount,
      updatedAt: new Date().toISOString(),
    }));
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(initialTeams));
    return initialTeams;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
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
  broadcastEvent({ type: 'TEAM_UPDATED', team: newTeam });
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

export function assignTeamToIncident(
  incidentId: string,
  teamId: string
): { report: EmergencyReport; team: ResponseTeam } {
  const reports = getStoredReports();
  const teams = getStoredTeams();

  const reportIndex = reports.findIndex((r) => r.id === incidentId || r.trackingId === incidentId);
  const teamIndex = teams.findIndex((t) => t.id === teamId);

  if (reportIndex === -1) throw new Error(`Incident #${incidentId} not found`);
  if (teamIndex === -1) throw new Error(`Team #${teamId} not found`);

  const report = reports[reportIndex];
  const team = teams[teamIndex];

  const distanceKm = calculateDistanceKm(report.latitude, report.longitude, team.latitude, team.longitude);
  const estimatedArrivalMinutes = calculateEstimatedTravelMinutes(distanceKm);
  const now = new Date().toISOString();

  const updatedReport: EmergencyReport = {
    ...report,
    status: 'Assigned',
    assignedTeamId: team.id,
    assignedTeamName: team.name,
    assignedAt: now,
    distanceKm,
    estimatedArrivalMinutes,
    updatedAt: now,
    statusHistory: [
      ...(report.statusHistory || []),
      { status: 'Assigned', timestamp: now, note: `Dispatched unit: ${team.name}` },
    ],
  };
  reports[reportIndex] = updatedReport;

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
    type: 'STATUS_UPDATED',
    reportId: report.id,
    status: 'Assigned',
    updatedAt: now,
  });

  return { report: updatedReport, team: updatedTeam };
}

export function autoAssignNearestTeam(incidentId: string): { report: EmergencyReport; team: ResponseTeam } | null {
  const reports = getStoredReports();
  const teams = getStoredTeams();
  const report = reports.find((r) => r.id === incidentId || r.trackingId === incidentId);
  if (!report) return null;

  const bestFit = findBestFitTeam(report, teams);
  if (!bestFit) return null;

  return assignTeamToIncident(report.id, bestFit.team.id);
}

export function unassignTeamFromIncident(incidentId: string): { report: EmergencyReport; team?: ResponseTeam } {
  const reports = getStoredReports();
  const teams = getStoredTeams();

  const reportIndex = reports.findIndex((r) => r.id === incidentId || r.trackingId === incidentId);
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

  return { report: updatedReport, team: unassignedTeam };
}

// 5. Cluster / Duplicate Detection & Report Submission
export async function submitEmergencyReport(
  data: {
    title?: string;
    type: EmergencyType;
    category?: EmergencyCategory;
    description: string;
    transcript?: string;
    latitude: number;
    longitude: number;
    area?: string;
    address?: string;
    landmark?: string;
    peopleAffected: number;
    injuries?: boolean;
    trappedPersons?: boolean;
    hazards?: any[];
    severity?: any;
    contactPhone?: string;
    contactEmail?: string;
    media?: any[];
  },
  isOffline = false
): Promise<{ report: EmergencyReport; duplicateWarning?: string; isLinkedCluster?: boolean }> {
  const normCat = normalizeCategory(data.category || data.type);

  // 2. Explainable Severity Engine
  const severityEval = evaluateSeverity({
    category: normCat,
    description: data.description,
    peopleAffected: data.peopleAffected,
    trappedPersons: data.trappedPersons,
    injuries: data.injuries,
  });

  const existing = getStoredReports();
  const now = new Date().toISOString();

  // 5. Duplicate / Cluster Detection: same category within ~200m and 15 mins
  const dupCheck = checkForDuplicateReport(
    {
      type: normCat,
      latitude: data.latitude,
      longitude: data.longitude,
      createdAt: now,
    },
    existing,
    200, // 200 metres radius
    15 // 15 minutes window
  );

  // If duplicate / cluster exists: link to existing incident, raise score, do not duplicate dispatches!
  if (dupCheck.isDuplicate && dupCheck.duplicateOf) {
    const parentId = dupCheck.duplicateOf.id;
    const parentIndex = existing.findIndex((r) => r.id === parentId);

    if (parentIndex !== -1) {
      const parent = existing[parentIndex];
      const newReportCount = (parent.reportCount || 1) + 1;
      const raisedScore = Math.min(100, (parent.severityScore || 50) + 8);
      const updatedParent: EmergencyReport = {
        ...parent,
        reportCount: newReportCount,
        severityScore: raisedScore,
        priorityScore: raisedScore,
        severityExplanation: `${parent.severityExplanation} (+${newReportCount} clustered reports within 200m)`,
        updatedAt: now,
        statusHistory: [
          ...(parent.statusHistory || []),
          { status: parent.status, timestamp: now, note: `Additional co-located citizen report linked (#${newReportCount})` },
        ],
      };

      existing[parentIndex] = updatedParent;
      saveStoredReports(existing);

      broadcastEvent({
        type: 'STATUS_UPDATED',
        reportId: parent.id,
        status: parent.status,
        updatedAt: now,
      });

      return {
        report: updatedParent,
        isLinkedCluster: true,
        duplicateWarning: `Linked to existing active ${normCat} incident #${parent.trackingId || parent.id} (${dupCheck.distanceMeters}m away). Severity escalated.`,
      };
    }
  }

  // Generate Tracking ID (e.g. EMG-1009)
  const lastNum = existing.length + 1001;
  const trackingId = `EMG-${lastNum}`;
  const id = `REP-${Math.floor(1000 + Math.random() * 9000)}`;

  const derivedArea = data.area || (data.address ? data.address.split(',')[1]?.trim() : 'Chennai Central') || 'Chennai Central';
  const rawType = String(data.type || data.category || 'Other');
  const mappedType: EmergencyType = rawType.includes('Fire')
    ? 'Fire'
    : rawType.includes('Medical')
    ? 'Medical'
    : rawType.includes('Flood')
    ? 'Flood'
    : rawType.includes('Accident')
    ? 'Road Accident'
    : rawType.includes('Collapse')
    ? 'Building Collapse'
    : 'Other';

  const newReport: EmergencyReport = {
    id,
    trackingId,
    title: data.title || `${normCat} near ${derivedArea}`,
    type: mappedType,
    category: normCat,
    description: data.description,
    transcript: data.transcript,
    latitude: data.latitude,
    longitude: data.longitude,
    area: derivedArea,
    address: data.address,
    landmark: data.landmark,
    peopleAffected: data.peopleAffected,
    injuries: Boolean(data.injuries),
    trappedPersons: Boolean(data.trappedPersons),
    hazards: data.hazards || [],
    severity: severityEval.severity,
    severityScore: severityEval.score,
    severityExplanation: severityEval.explanation,
    priorityScore: severityEval.score,
    priorityTier: severityEval.score >= 75 ? 'P1' : severityEval.score >= 50 ? 'P2' : severityEval.score >= 25 ? 'P3' : 'P4',
    priorityRank: severityEval.severity,
    status: 'Reported',
    statusHistory: [
      {
        status: 'Reported',
        timestamp: now,
        note: `Citizen emergency telemetry reported in ${derivedArea}`,
      },
    ],
    contactPhone: data.contactPhone,
    contactEmail: data.contactEmail,
    reportCount: 1,
    syncStatus: isOffline ? 'pending' : 'synced',
    media: data.media || [],
    createdAt: now,
    updatedAt: now,
  };

  if (isOffline) {
    await offlineDb.offlineQueue.put({
      id: newReport.id,
      reportData: newReport,
      queuedAt: now,
      retryCount: 0,
    });
    return { report: newReport };
  }

  // 3. Automatically create dispatches for required departments
  createDispatchesForIncident(newReport);

  const updated = [newReport, ...existing];
  saveStoredReports(updated);

  broadcastEvent({ type: 'NEW_REPORT', report: newReport });
  return { report: newReport };
}

// Update report status (Admin / Department action)
export function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  note = 'Status updated by triage command',
  updatedBy = 'Admin'
) {
  const reports = getStoredReports();
  const index = reports.findIndex((r) => r.id === reportId || r.trackingId === reportId);
  if (index === -1) return;

  const now = new Date().toISOString();
  reports[index].status = status;
  reports[index].updatedAt = now;
  reports[index].statusHistory = [
    ...(reports[index].statusHistory || []),
    { status, timestamp: now, note, updatedBy },
  ];

  // If marked resolved, free assigned team
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
    reportId: reports[index].id,
    status,
    updatedAt: now,
  });
}

export function flagFalseReport(reportId: string, reason: string) {
  const reports = getStoredReports();
  const index = reports.findIndex((r) => r.id === reportId || r.trackingId === reportId);
  if (index === -1) return;

  const now = new Date().toISOString();
  reports[index].isFalseReport = true;
  reports[index].falseReportReason = reason;
  reports[index].updatedAt = now;
  saveStoredReports(reports);

  broadcastEvent({
    type: 'REPORT_FLAGGED_FALSE',
    reportId: reports[index].id,
    reason,
  });
}

// 9. Round-2 Readiness: Department Stations & Nearest Station Haversine lookup
export function getStoredStations(): DepartmentStation[] {
  if (typeof window === 'undefined') return INITIAL_DEPARTMENT_STATIONS;
  const stored = localStorage.getItem(STATIONS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STATIONS_STORAGE_KEY, JSON.stringify(INITIAL_DEPARTMENT_STATIONS));
    return INITIAL_DEPARTMENT_STATIONS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_DEPARTMENT_STATIONS;
  }
}

export function findNearestStation(
  latitude: number,
  longitude: number,
  department?: string
): { station: DepartmentStation; distanceKm: number } | null {
  const stations = getStoredStations();
  const candidates = department
    ? stations.filter((s) => s.department === department && s.available)
    : stations.filter((s) => s.available);
  if (candidates.length === 0) return null;

  let bestStation = candidates[0];
  let minDistance = calculateDistanceKm(latitude, longitude, bestStation.latitude, bestStation.longitude);

  for (let i = 1; i < candidates.length; i++) {
    const d = calculateDistanceKm(latitude, longitude, candidates[i].latitude, candidates[i].longitude);
    if (d < minDistance) {
      minDistance = d;
      bestStation = candidates[i];
    }
  }

  return { station: bestStation, distanceKm: minDistance };
}

// Reset Demo Data
export function resetDemoData() {
  saveStoredReports(INITIAL_SEED_REPORTS);
  saveStoredDispatches(INITIAL_SEED_DISPATCHES);
  saveStoredAdvisories(INITIAL_SEED_ADVISORIES);
  localStorage.removeItem(TEAMS_STORAGE_KEY);
  localStorage.removeItem(STATIONS_STORAGE_KEY);
  localStorage.removeItem(RATE_LIMIT_KEY);
  offlineDb.offlineQueue.clear().catch(() => {});
  return {
    reports: INITIAL_SEED_REPORTS,
    dispatches: INITIAL_SEED_DISPATCHES,
    advisories: INITIAL_SEED_ADVISORIES,
  };
}
