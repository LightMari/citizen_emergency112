import {
  EmergencyCategory,
  EmergencyReport,
  DepartmentName,
  DepartmentDispatch,
  DispatchStatus,
  AreaAdvisory,
  ReportStatus,
  SeverityLevel,
} from '../types/report';
import { normalizeCategory } from '../utils/severityEngine';

const DISPATCHES_STORAGE_KEY = 'citizen_emergency_dispatches_v1';
const ADVISORIES_STORAGE_KEY = 'citizen_emergency_advisories_v1';
const ROUTING_CONFIG_STORAGE_KEY = 'citizen_emergency_routing_config_v1';

// 1. Configurable Routing Table (Editable object)
export const DEFAULT_ROUTING_CONFIG: Record<EmergencyCategory, DepartmentName[]> = {
  'Fire Emergency': ['Fire & Rescue'],
  'Road Accident': ['Traffic Police', 'Ambulance'],
  'Medical Emergency': ['Ambulance'],
  'Flood': ['Disaster Management', 'Rescue Team'],
  'Building Collapse': ['Fire & Rescue', 'Disaster Management', 'Ambulance'],
  'Other': ['Control Room'],
};

export function getRoutingConfig(): Record<EmergencyCategory, DepartmentName[]> {
  if (typeof window === 'undefined') return DEFAULT_ROUTING_CONFIG;
  const stored = localStorage.getItem(ROUTING_CONFIG_STORAGE_KEY);
  if (!stored) return DEFAULT_ROUTING_CONFIG;
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_ROUTING_CONFIG;
  }
}

export function saveRoutingConfig(config: Record<EmergencyCategory, DepartmentName[]>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROUTING_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

// 2. Initial Sample Dispatches for Demos
export const INITIAL_SEED_DISPATCHES: DepartmentDispatch[] = [
  {
    id: 'DISP-1001-FIRE',
    incidentId: 'REP-9021',
    trackingId: 'EMG-1001',
    incidentTitle: 'Textile Showroom Electrical Fire',
    incidentCategory: 'Fire Emergency',
    severity: 'Critical',
    department: 'Fire & Rescue',
    area: 'T. Nagar',
    status: 'Responding',
    eta: '5 min',
    responseMessage: 'TNFRS Station 01 T. Nagar en route with 2 water bowsers. Avoid Ranganathan Street.',
    forwardedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'DISP-1001-CTRL',
    incidentId: 'REP-9021',
    trackingId: 'EMG-1001',
    incidentTitle: 'Textile Showroom Electrical Fire',
    incidentCategory: 'Fire Emergency',
    severity: 'Critical',
    department: 'Control Room',
    area: 'T. Nagar',
    status: 'Acknowledged',
    eta: 'Standing by',
    responseMessage: 'GCC Central Command notified; power grid cutoff requested for T. Nagar market sector.',
    forwardedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
  {
    id: 'DISP-1002-POL',
    incidentId: 'REP-8412',
    trackingId: 'EMG-1002',
    incidentTitle: 'Multi-Vehicle Collision on Flyover',
    incidentCategory: 'Road Accident',
    severity: 'High',
    department: 'Traffic Police',
    area: 'Guindy',
    status: 'Responding',
    eta: '8 min',
    responseMessage: 'Guindy Traffic division directing traffic diversion towards Inner Ring Road.',
    forwardedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
  },
  {
    id: 'DISP-1002-AMB',
    incidentId: 'REP-8412',
    trackingId: 'EMG-1002',
    incidentTitle: 'Multi-Vehicle Collision on Flyover',
    incidentCategory: 'Road Accident',
    severity: 'High',
    department: 'Ambulance',
    area: 'Guindy',
    status: 'Responding',
    eta: '6 min',
    responseMessage: '108 Ambulance Unit 04 dispatched from Kilpauk hub.',
    forwardedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
  },
  {
    id: 'DISP-1003-DM',
    incidentId: 'REP-7731',
    trackingId: 'EMG-1003',
    incidentTitle: 'Canal Overflow & Road Inundation',
    incidentCategory: 'Flood',
    severity: 'Medium',
    department: 'Disaster Management',
    area: 'Velachery',
    status: 'Forwarded',
    eta: '15 min',
    responseMessage: '',
    forwardedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    respondedAt: null,
  },
  {
    id: 'DISP-1003-RESC',
    incidentId: 'REP-7731',
    trackingId: 'EMG-1003',
    incidentTitle: 'Canal Overflow & Road Inundation',
    incidentCategory: 'Flood',
    severity: 'Medium',
    department: 'Rescue Team',
    area: 'Velachery',
    status: 'Forwarded',
    eta: '20 min',
    responseMessage: '',
    forwardedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    respondedAt: null,
  },
  {
    id: 'DISP-1004-AMB',
    incidentId: 'REP-6520',
    trackingId: 'EMG-1004',
    incidentTitle: 'Promenade Collapse & Cardiac Distress',
    incidentCategory: 'Medical Emergency',
    severity: 'Critical',
    department: 'Ambulance',
    area: 'Triplicane',
    status: 'Responding',
    eta: '4 min',
    responseMessage: '108 ALS Ambulance en route with automated external defibrillator.',
    forwardedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: 'DISP-1004-CTRL',
    incidentId: 'REP-6520',
    trackingId: 'EMG-1004',
    incidentTitle: 'Promenade Collapse & Cardiac Distress',
    incidentCategory: 'Medical Emergency',
    severity: 'Critical',
    department: 'Control Room',
    area: 'Triplicane',
    status: 'Acknowledged',
    eta: '',
    responseMessage: 'Monitored via Marina CCTV camera #14; beach patrol flagged.',
    forwardedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
];

// Initial Area Advisories Feed for Chennai Neighborhoods
export const INITIAL_SEED_ADVISORIES: AreaAdvisory[] = [
  {
    id: 'ADV-1001',
    incidentId: 'REP-9021',
    trackingId: 'EMG-1001',
    area: 'T. Nagar',
    department: 'Fire & Rescue',
    message: 'Fire & Rescue is responding, ETA 5 min. Avoid Ranganathan Street; heavy smoke.',
    severity: 'Critical',
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'ADV-1002',
    incidentId: 'REP-8412',
    trackingId: 'EMG-1002',
    area: 'Guindy',
    department: 'Traffic Police',
    message: 'Traffic diversion active on Kathipara flyover down-ramp. Use GST road ground level.',
    severity: 'High',
    timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
  },
  {
    id: 'ADV-1003',
    incidentId: 'REP-6520',
    trackingId: 'EMG-1004',
    area: 'Triplicane',
    department: 'Ambulance',
    message: '108 ALS Unit responding to Marina Beach promenade. Clear pathway near lighthouse.',
    severity: 'Critical',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
];

// Dispatches Storage
export function getStoredDispatches(): DepartmentDispatch[] {
  if (typeof window === 'undefined') return INITIAL_SEED_DISPATCHES;
  const stored = localStorage.getItem(DISPATCHES_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(DISPATCHES_STORAGE_KEY, JSON.stringify(INITIAL_SEED_DISPATCHES));
    return INITIAL_SEED_DISPATCHES;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_SEED_DISPATCHES;
  }
}

export function saveStoredDispatches(dispatches: DepartmentDispatch[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DISPATCHES_STORAGE_KEY, JSON.stringify(dispatches));
}

// Area Advisories Storage
export function getStoredAdvisories(): AreaAdvisory[] {
  if (typeof window === 'undefined') return INITIAL_SEED_ADVISORIES;
  const stored = localStorage.getItem(ADVISORIES_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(ADVISORIES_STORAGE_KEY, JSON.stringify(INITIAL_SEED_ADVISORIES));
    return INITIAL_SEED_ADVISORIES;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_SEED_ADVISORIES;
  }
}

export function saveStoredAdvisories(advisories: AreaAdvisory[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADVISORIES_STORAGE_KEY, JSON.stringify(advisories));
}

// 3. Stub placeholder for external SMS / Email / Webhook notification
export function notifyDepartment(dispatch: DepartmentDispatch) {
  // Stub placeholder for hackathon demo
  console.log(
    `[NOTIFY DEPARTMENT STUB] Dispatched alert to ${dispatch.department} for Area: "${dispatch.area}". Incident #${dispatch.trackingId} (${dispatch.incidentCategory}, Severity: ${dispatch.severity})`
  );
}

/**
 * Returns required departments for an emergency category and severity.
 */
export function getRequiredDepartments(
  category: EmergencyCategory | string,
  severity?: SeverityLevel | string
): DepartmentName[] {
  const normCat = normalizeCategory(category);
  const routing = getRoutingConfig();
  const list = [...(routing[normCat] || ['Control Room'])];
  if (severity === 'Critical' && !list.includes('Control Room')) {
    list.push('Control Room');
  }
  return list;
}

/**
 * Calculates rolled-up status from an array of dispatch statuses.
 */
export function calculateRolledUpIncidentStatus(statuses: DispatchStatus[]): ReportStatus {
  if (statuses.length === 0) return 'Reported';
  if (statuses.every((s) => s === 'Resolved')) return 'Resolved';
  if (statuses.some((s) => s === 'Responding')) return 'In Progress';
  if (statuses.some((s) => s === 'Acknowledged')) return 'Pending';
  return 'Reported';
}

/**
 * On submit, automatically creates one "dispatch" per required department,
 * scoped to the reported area.
 */
export function createDispatchesForIncident(
  report: Pick<EmergencyReport, 'id' | 'trackingId' | 'title' | 'category' | 'severity' | 'area'>
): DepartmentDispatch[] {
  const normCat = normalizeCategory(report.category || 'Other');
  const targetDepartments = getRequiredDepartments(normCat, report.severity);

  const existingDispatches = getStoredDispatches();
  const now = new Date().toISOString();

  const newDispatches: DepartmentDispatch[] = targetDepartments.map((dept) => {
    const dispatch: DepartmentDispatch = {
      id: `DISP-${report.trackingId || report.id.replace('REP-', '')}-${dept.substring(0, 4).toUpperCase().trim()}-${Math.floor(100 + Math.random() * 900)}`,
      incidentId: report.id,
      trackingId: report.trackingId || report.id,
      incidentTitle: report.title || `${normCat} in ${report.area || 'Chennai'}`,
      incidentCategory: normCat,
      severity: report.severity || 'High',
      department: dept,
      area: report.area || 'Chennai Central',
      status: 'Forwarded',
      eta: '5-10 min',
      responseMessage: '',
      forwardedAt: now,
      respondedAt: null,
    };

    // Trigger notification stub
    notifyDepartment(dispatch);
    return dispatch;
  });

  const updated = [...newDispatches, ...existingDispatches];
  saveStoredDispatches(updated);
  return newDispatches;
}

/**
 * Rolls up the overall incident status based on all its department dispatches.
 */
export function rollupIncidentStatus(incidentId: string): ReportStatus {
  const dispatches = getStoredDispatches().filter(
    (d) => d.incidentId === incidentId || d.trackingId === incidentId
  );
  return calculateRolledUpIncidentStatus(dispatches.map((d) => d.status));
}

/**
 * Department updates dispatch status, ETA, and response message.
 * Rolls up the incident status and publishes to Area Advisory Feed.
 */
export function updateDepartmentResponse(
  dispatchId: string,
  newStatus: DispatchStatus,
  eta: string,
  responseMessage: string
): {
  dispatch: DepartmentDispatch;
  rolledUpStatus: ReportStatus;
  advisory?: AreaAdvisory;
} {
  const dispatches = getStoredDispatches();
  const index = dispatches.findIndex((d) => d.id === dispatchId);
  if (index === -1) throw new Error(`Dispatch #${dispatchId} not found`);

  const now = new Date().toISOString();
  const updatedDispatch: DepartmentDispatch = {
    ...dispatches[index],
    status: newStatus,
    eta: eta.trim() || dispatches[index].eta,
    responseMessage: responseMessage.trim(),
    respondedAt: now,
  };
  dispatches[index] = updatedDispatch;
  saveStoredDispatches(dispatches);

  // Compute rolled-up incident status
  const rolledUpStatus = rollupIncidentStatus(updatedDispatch.incidentId);

  // Publish to Area Advisory Feed if response message or ETA is provided
  let newAdvisory: AreaAdvisory | undefined;
  if (responseMessage.trim() || newStatus === 'Responding') {
    const advisories = getStoredAdvisories();
    const effectiveEta = eta.trim() || updatedDispatch.eta;
    const baseMsg = responseMessage.trim();
    let message = '';
    if (baseMsg) {
      message = baseMsg.includes(effectiveEta)
        ? baseMsg
        : `${baseMsg} (ETA: ${effectiveEta})`;
    } else {
      message = `${updatedDispatch.department} is responding to ${updatedDispatch.incidentCategory}, ETA ${effectiveEta}.`;
    }

    newAdvisory = {
      id: `ADV-${Math.floor(1000 + Math.random() * 9000)}`,
      incidentId: updatedDispatch.incidentId,
      trackingId: updatedDispatch.trackingId,
      area: updatedDispatch.area,
      department: updatedDispatch.department,
      message,
      severity: updatedDispatch.severity,
      timestamp: now,
    };

    saveStoredAdvisories([newAdvisory, ...advisories]);
  }

  return {
    dispatch: updatedDispatch,
    rolledUpStatus,
    advisory: newAdvisory,
  };
}
