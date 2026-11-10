export type EmergencyCategory =
  | 'Fire Emergency'
  | 'Road Accident'
  | 'Medical Emergency'
  | 'Flood'
  | 'Building Collapse'
  | 'Other';

// Primary categories supported in the application
export type EmergencyType =
  | 'Fire'
  | 'Medical'
  | 'Flood'
  | 'Earthquake'
  | 'Road Accident'
  | 'Building Collapse'
  | 'Violence/Crime'
  | 'Other';

export type HazardType =
  | 'Fire/smoke'
  | 'Gas leak'
  | 'Structural collapse risk'
  | 'Hazardous materials'
  | 'Armed threat'
  | 'Rising water';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

// Core lifecycle status as specified in Hackathon prompt:
export type ReportStatus =
  | 'Reported'
  | 'Pending'
  | 'In Progress'
  | 'Resolved'
  | 'Received'
  | 'Verified'
  | 'Assigned'
  | 'Dispatched';

export type PriorityTier = 'P1' | 'P2' | 'P3' | 'P4';
export type PriorityRank = 'Critical' | 'High' | 'Medium' | 'Low';

export interface ReportMedia {
  id: string;
  reportId?: string;
  kind: 'image' | 'video' | 'audio';
  url: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export interface StatusHistoryEntry {
  status: ReportStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

// 1. Core Incident Model
export interface EmergencyReport {
  id: string; // e.g. "REP-9021"
  trackingId?: string; // e.g. "EMG-1001" (Code Clash 2026 Tracking ID)
  title?: string; // Title of the report
  type: EmergencyType; // Category
  category?: EmergencyCategory; // Canonical category
  description: string;
  transcript?: string;
  latitude: number;
  longitude: number;
  area?: string; // Reported area / locality (e.g., T. Nagar, Guindy, Velachery)
  address?: string;
  landmark?: string;
  peopleAffected: number;
  injuries: boolean;
  trappedPersons: boolean;
  hazards: HazardType[];
  severity?: SeverityLevel; // Low, Medium, High, Critical
  severityScore?: number; // 0 - 100
  severityExplanation?: string; // Explainable line: "Critical: 12 people + building collapse + keyword 'trapped'"
  priorityScore: number; // 0 - 100
  priorityTier: PriorityTier;
  priorityRank?: PriorityRank;
  status: ReportStatus; // Reported, Pending, In Progress, Resolved
  statusHistory?: StatusHistoryEntry[]; // Full audit trail of status changes
  contactPhone?: string;
  contactEmail?: string;
  reportCount?: number; // Clustered report count (e.g. 7 reports linked)
  isFalseReport?: boolean;
  falseReportReason?: string;
  isPotentialDuplicate?: boolean;
  duplicateOfId?: string;
  syncStatus: 'synced' | 'pending';
  media: ReportMedia[];
  createdAt: string;
  updatedAt: string;

  // Assignment fields
  assignedTeamId?: string | null;
  assignedTeamName?: string | null;
  assignedAt?: string | null;
  estimatedArrivalMinutes?: number | null;
  distanceKm?: number | null;
}

// 3. Department Forwarding & Response Models
export type DepartmentName =
  | 'Fire & Rescue'
  | 'Traffic Police'
  | 'Ambulance'
  | 'Disaster Management'
  | 'Rescue Team'
  | 'Control Room';

export type DispatchStatus = 'Forwarded' | 'Acknowledged' | 'Responding' | 'Resolved';

export interface DepartmentDispatch {
  id: string; // e.g. "DISP-1001-FIRE"
  incidentId: string; // References EmergencyReport.id or trackingId
  trackingId: string; // e.g. "EMG-1001"
  incidentTitle: string;
  incidentCategory: EmergencyCategory;
  severity: SeverityLevel;
  department: DepartmentName;
  area: string;
  status: DispatchStatus;
  eta: string; // e.g. "8 min"
  responseMessage: string; // e.g. "Fire & Rescue is responding, ETA 8 min. Avoid Main Road."
  forwardedAt: string;
  respondedAt: string | null;
}

// Area Advisory Feed Model
export interface AreaAdvisory {
  id: string;
  incidentId: string;
  trackingId: string;
  area: string;
  department: DepartmentName;
  message: string;
  severity: SeverityLevel;
  timestamp: string;
}

// 9. Round-2 Readiness: Department Stations & Response Teams
export type TeamCategory = 'Fire' | 'Medical' | 'Rescue' | 'Police' | 'Disaster' | 'General';
export type TeamAvailabilityStatus = 'Available' | 'Busy';

export interface DepartmentStation {
  id: string;
  name: string;
  department: DepartmentName;
  category: TeamCategory;
  latitude: number;
  longitude: number;
  available: boolean;
  address: string;
  contactPhone: string;
  vehicleType: string;
  personnelCount: number;
}

export interface ResponseTeam {
  id: string;
  name: string;
  category: TeamCategory;
  department?: DepartmentName;
  latitude: number;
  longitude: number;
  address: string;
  availability: TeamAvailabilityStatus;
  assignedIncidentId?: string | null;
  assignedIncidentType?: EmergencyType | null;
  contactPhone: string;
  stationName: string;
  vehicleType: string;
  personnelCount: number;
  updatedAt: string;
}

export interface DraftReportFormData {
  title?: string;
  type: EmergencyType | '';
  category?: EmergencyCategory;
  area?: string;
  description: string;
  transcript: string;
  audioBlob?: Blob | null;
  audioUrl?: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string;
  landmark: string;
  peopleAffected: number;
  injuries: boolean;
  trappedPersons: boolean;
  hazards: HazardType[];
  severity?: SeverityLevel;
  contactPhone: string;
  contactEmail?: string;
  mediaFiles: Array<{
    id: string;
    file: File | Blob;
    kind: 'image' | 'video' | 'audio';
    previewUrl: string;
    name: string;
    size: number;
    mimeType: string;
    compressed?: boolean;
  }>;
}
