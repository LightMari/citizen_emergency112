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

// Extended status covering the complete incident lifecycle as per hackathon specification:
// Reported (or Received) -> Assigned -> In Progress -> Resolved (with legacy Verified/Dispatched support)
export type ReportStatus =
  | 'Reported'
  | 'Received'
  | 'Verified'
  | 'Assigned'
  | 'In Progress'
  | 'Dispatched'
  | 'Resolved';

export type PriorityTier = 'P1' | 'P2' | 'P3' | 'P4';
export type PriorityRank = 'Critical' | 'High' | 'Medium' | 'Low';

export interface ReportMedia {
  id: string;
  reportId?: string;
  kind: 'image' | 'video' | 'audio';
  url: string; // Base64 or object URL or stored path
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export interface EmergencyReport {
  id: string;
  type: EmergencyType;
  description: string;
  transcript?: string;
  latitude: number;
  longitude: number;
  address?: string;
  landmark?: string;
  peopleAffected: number;
  injuries: boolean;
  trappedPersons: boolean;
  hazards: HazardType[];
  severity?: SeverityLevel;
  priorityScore: number; // 0 - 100
  priorityTier: PriorityTier;
  priorityRank?: PriorityRank;
  status: ReportStatus;
  contactPhone?: string;
  isFalseReport?: boolean;
  falseReportReason?: string;
  isPotentialDuplicate?: boolean;
  duplicateOfId?: string;
  syncStatus: 'synced' | 'pending';
  media: ReportMedia[];
  createdAt: string;
  updatedAt: string;

  // Lifecycle & Team Assignment Fields (Deliverables 2, 3, 4)
  assignedTeamId?: string | null;
  assignedTeamName?: string | null;
  assignedAt?: string | null;
  estimatedArrivalMinutes?: number | null;
  distanceKm?: number | null;
  enRouteCoordinates?: { latitude: number; longitude: number } | null;
}

// Emergency Response Team Management Types (Deliverable 2)
export type TeamCategory = 'Fire' | 'Medical' | 'Rescue' | 'Police' | 'Disaster' | 'General';
export type TeamAvailabilityStatus = 'Available' | 'Busy';

export interface ResponseTeam {
  id: string; // e.g. "TEAM-FIRE-01"
  name: string; // e.g. "TNFRS T. Nagar Station - Unit 1"
  category: TeamCategory;
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
  type: EmergencyType | '';
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
