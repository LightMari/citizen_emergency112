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

export type ReportStatus = 'Received' | 'Verified' | 'Dispatched' | 'Resolved';

export type PriorityTier = 'P1' | 'P2' | 'P3' | 'P4';

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
