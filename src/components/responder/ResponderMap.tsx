import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import {
  EmergencyReport,
  PriorityTier,
  ResponseTeam,
  TeamCategory,
  TeamAvailabilityStatus,
} from '../../types/report';
import { calculateDistanceKm, calculateEstimatedTravelMinutes } from '../../utils/teamAssignment';
import { Play, RotateCcw } from 'lucide-react';

interface MapProps {
  reports: EmergencyReport[];
  teams?: ResponseTeam[];
  selectedReport?: EmergencyReport | null;
  onSelectReport: (report: EmergencyReport) => void;
  onSelectTeam?: (team: ResponseTeam) => void;
}

// Marker generator for priority tiers
const createPriorityIcon = (tier: PriorityTier) => {
  const colors: Record<PriorityTier, { bg: string; text: string }> = {
    P1: { bg: '#e5484d', text: '#ffffff' },
    P2: { bg: '#f97316', text: '#ffffff' },
    P3: { bg: '#eab308', text: '#111214' },
    P4: { bg: '#3b82f6', text: '#ffffff' },
  };

  const c = colors[tier] || colors.P4;
  const isP1 = tier === 'P1';

  return L.divIcon({
    className: 'custom-responder-marker',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        ${
          isP1
            ? `<div style="position: absolute; inset: -4px; border-radius: 50%; background: #e5484d; opacity: 0.45; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : ''
        }
        <div style="width: 24px; height: 24px; background: ${c.bg}; border: 1.5px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; color: ${
      c.text
    }; font-size: 10px; font-weight: 700; font-family: monospace; z-index: 2;">
          ${tier}
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
};

// Marker generator for Response Teams
const createTeamIcon = (category: TeamCategory, availability: TeamAvailabilityStatus) => {
  const isAvail = availability === 'Available';
  const borderCol = isAvail ? '#22c55e' : '#f59e0b';
  const bgCol = '#111214';

  let iconChar = '🚒';
  if (category === 'Medical') iconChar = '🚑';
  else if (category === 'Rescue') iconChar = '🛟';
  else if (category === 'Police') iconChar = '🚓';
  else if (category === 'Disaster') iconChar = '🌊';

  return L.divIcon({
    className: 'custom-team-marker',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -2px; border-radius: 50%; background: ${borderCol}; opacity: 0.35;"></div>
        <div style="width: 28px; height: 28px; background: ${bgCol}; border: 2px solid ${borderCol}; border-radius: 50%; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; font-size: 13px; z-index: 2;">
          ${iconChar}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

// Simulated en route vehicle icon
const createEnRouteIcon = () => {
  return L.divIcon({
    className: 'custom-enroute-marker',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -4px; border-radius: 50%; background: #38bdf8; opacity: 0.5; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 24px; height: 24px; background: #0284c7; border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; z-index: 3;">
          ⚡
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export const ResponderMap: React.FC<MapProps> = ({
  reports,
  teams = [],
  selectedReport,
  onSelectReport,
  onSelectTeam,
}) => {
  const defaultCenter: [number, number] = [13.0827, 80.2707]; // Chennai City Center, Tamil Nadu

  // Map layer visibility controls
  const [showIncidents, setShowIncidents] = useState(true);
  const [showTeams, setShowTeams] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  // Live GPS Route Dispatch Simulation state
  const [simulatingReportId, setSimulatingReportId] = useState<string | null>(null);
  const [simStep, setSimStep] = useState(0);

  // Filter out resolved reports from main view if needed, but display active ones
  const activeReports = reports.filter((r) => !r.isFalseReport);

  // Simulation timer
  useEffect(() => {
    if (!simulatingReportId) return;

    const interval = setInterval(() => {
      setSimStep((prev) => {
        if (prev >= 10) {
          clearInterval(interval);
          setSimulatingReportId(null);
          return 0;
        }
        return prev + 1;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [simulatingReportId]);

  // Compute active assigned routes
  const activeRoutes = activeReports
    .filter((r) => r.assignedTeamId && (r.status === 'Assigned' || r.status === 'In Progress' || r.status === 'Dispatched'))
    .map((report) => {
      const team = teams.find((t) => t.id === report.assignedTeamId);
      if (!team) return null;
      const distance = report.distanceKm || calculateDistanceKm(report.latitude, report.longitude, team.latitude, team.longitude);
      const eta = report.estimatedArrivalMinutes || calculateEstimatedTravelMinutes(distance);
      return {
        report,
        team,
        distance,
        eta,
        linePositions: [
          [team.latitude, team.longitude] as [number, number],
          [report.latitude, report.longitude] as [number, number],
        ],
      };
    })
    .filter((route): route is NonNullable<typeof route> => route !== null);

  // Simulated vehicle position
  const activeSimRoute = activeRoutes.find((r) => r.report.id === simulatingReportId);
  const simVehiclePos: [number, number] | null = activeSimRoute
    ? [
        activeSimRoute.team.latitude +
          (activeSimRoute.report.latitude - activeSimRoute.team.latitude) * (simStep / 10),
        activeSimRoute.team.longitude +
          (activeSimRoute.report.longitude - activeSimRoute.team.longitude) * (simStep / 10),
      ]
    : null;

  return (
    <div className="w-full h-full min-h-[420px] rounded-card overflow-hidden border border-graphite-border bg-graphite-deep relative">
      <MapContainer
        center={
          selectedReport
            ? [selectedReport.latitude, selectedReport.longitude]
            : reports.length > 0
            ? [reports[0].latitude, reports[0].longitude]
            : defaultCenter
        }
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 1. INCIDENT MARKERS */}
        {showIncidents &&
          activeReports.map((report) => (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={createPriorityIcon(report.priorityTier)}
            >
              <Popup className="emergency-popup">
                <div className="p-1 space-y-1.5 text-graphite-text max-w-[240px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-graphite-text">
                      {report.type} Incident
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-graphite-muted">
                      {report.priorityTier} ({report.priorityScore})
                    </span>
                  </div>
                  <p className="text-[11px] line-clamp-2 text-graphite-secondary leading-snug">
                    {report.description}
                  </p>
                  <div className="text-[10px] text-graphite-muted truncate">
                    {report.address || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                  </div>

                  {report.assignedTeamName && (
                    <div className="p-1.5 bg-sky-500/10 border border-sky-500/25 rounded text-[10px] text-sky-200">
                      Dispatched: <strong>{report.assignedTeamName}</strong>
                      <div className="font-mono">
                        Distance: {report.distanceKm} km • ETA ~{report.estimatedArrivalMinutes} min
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectReport(report)}
                      className="flex-1 py-1.5 px-2 bg-graphite-raised hover:bg-graphite-surface border border-graphite-border text-graphite-text rounded-control text-xs font-medium text-center block transition-colors duration-150"
                    >
                      Inspect Incident
                    </button>
                    {report.assignedTeamId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatingReportId(report.id);
                          setSimStep(0);
                        }}
                        className="py-1.5 px-2 bg-sky-500 hover:bg-sky-400 text-white rounded-control text-xs font-semibold flex items-center space-x-1"
                        title="Simulate team en route"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 2. RESPONSE TEAM MARKERS (Deliverable 5) */}
        {showTeams &&
          teams.map((team) => (
            <Marker
              key={team.id}
              position={[team.latitude, team.longitude]}
              icon={createTeamIcon(team.category, team.availability)}
            >
              <Popup className="emergency-popup">
                <div className="p-1 space-y-1.5 text-graphite-text max-w-[220px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-graphite-text">{team.name}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        team.availability === 'Available'
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : 'bg-amber-500/10 text-amber-300'
                      }`}
                    >
                      {team.availability}
                    </span>
                  </div>
                  <div className="text-[11px] text-graphite-secondary">
                    <div>Station: {team.stationName}</div>
                    <div className="text-graphite-muted text-[10px]">{team.vehicleType}</div>
                  </div>
                  {team.assignedIncidentId && (
                    <div className="text-[10px] font-mono text-amber-300 bg-amber-500/10 p-1 rounded">
                      En route to #{team.assignedIncidentId}
                    </div>
                  )}
                  {onSelectTeam && (
                    <button
                      type="button"
                      onClick={() => onSelectTeam(team)}
                      className="w-full mt-1 py-1 px-2 bg-graphite-raised hover:bg-graphite-surface border border-graphite-border text-graphite-text rounded text-[11px]"
                    >
                      Select Team
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 3. ROUTE POLYLINES BETWEEN ASSIGNED TEAMS & INCIDENTS (Deliverable 5) */}
        {showRoutes &&
          activeRoutes.map((route) => (
            <React.Fragment key={`route-${route.report.id}-${route.team.id}`}>
              <Polyline
                positions={route.linePositions}
                pathOptions={{
                  color: route.report.priorityTier === 'P1' ? '#e5484d' : '#38bdf8',
                  weight: 3.5,
                  dashArray: '8, 8',
                  opacity: 0.85,
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs p-1">
                    <strong className="block text-sky-400">
                      Dispatched Route: {route.team.name}
                    </strong>
                    <span>Incident #{route.report.id} ({route.report.type})</span>
                    <div className="font-mono text-[10px] text-graphite-muted mt-0.5">
                      Distance: {route.distance} km • ETA: ~{route.eta} mins
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            </React.Fragment>
          ))}

        {/* 4. SIMULATED VEHICLE MARKER EN ROUTE */}
        {simVehiclePos && (
          <Marker position={simVehiclePos} icon={createEnRouteIcon()}>
            <Tooltip permanent direction="top" offset={[0, -12]}>
              <span className="text-[10px] font-mono font-bold text-sky-400">
                Unit En Route ({Math.round(simStep * 10)}% Progress)
              </span>
            </Tooltip>
          </Marker>
        )}
      </MapContainer>

      {/* Map Layer Controls & Simulation Widget */}
      <div className="absolute top-3 right-3 z-20 bg-graphite-deep/95 backdrop-blur-md border border-graphite-border rounded-control p-2 text-xs space-y-1.5 shadow-md">
        <span className="text-[10px] font-mono uppercase tracking-wider text-graphite-muted block">
          Map Layers & Routes
        </span>
        <div className="flex flex-col space-y-1 text-[11px]">
          <label className="inline-flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showIncidents}
              onChange={(e) => setShowIncidents(e.target.checked)}
              className="rounded bg-graphite-raised border-graphite-border text-red-500"
            />
            <span className="text-graphite-text">Incidents ({activeReports.length})</span>
          </label>
          <label className="inline-flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showTeams}
              onChange={(e) => setShowTeams(e.target.checked)}
              className="rounded bg-graphite-raised border-graphite-border text-emerald-500"
            />
            <span className="text-graphite-text">Response Teams ({teams.length})</span>
          </label>
          <label className="inline-flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={(e) => setShowRoutes(e.target.checked)}
              className="rounded bg-graphite-raised border-graphite-border text-sky-500"
            />
            <span className="text-graphite-text">Dispatch Routes ({activeRoutes.length})</span>
          </label>
        </div>

        {/* Active Simulation Bar */}
        {simulatingReportId && (
          <div className="pt-2 border-t border-graphite-border space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-sky-300">
              <span>Simulating Dispatch</span>
              <span>{Math.round(simStep * 10)}%</span>
            </div>
            <div className="w-full bg-graphite-raised h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-400 h-full transition-all duration-300"
                style={{ width: `${simStep * 10}%` }}
              />
            </div>
            <button
              onClick={() => setSimulatingReportId(null)}
              className="text-[10px] text-red-400 hover:underline flex items-center space-x-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Stop simulation</span>
            </button>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-graphite-deep/90 backdrop-blur-md border border-graphite-border rounded-control p-2.5 text-xs space-y-1.5 shadow-sm">
        <span className="text-[10px] font-mono uppercase tracking-wider text-graphite-muted block">
          Incident & Team Legend
        </span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-graphite-secondary">P1 Critical</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span className="text-graphite-secondary">P2 High</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            <span className="text-graphite-secondary">P3 Med</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-graphite-secondary">P4 Low</span>
          </span>
          <span className="flex items-center space-x-1 pl-1 border-l border-graphite-border">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-graphite-secondary">Team Avail</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-graphite-secondary">Team Busy</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-3 border-b-2 border-dashed border-sky-400"></span>
            <span className="text-graphite-secondary">Route</span>
          </span>
        </div>
      </div>
    </div>
  );
};
