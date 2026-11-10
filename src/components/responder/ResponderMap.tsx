import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  EmergencyReport,
  PriorityTier,
  ResponseTeam,
  TeamCategory,
  TeamAvailabilityStatus,
} from '../../types/report';
import { calculateDistanceKm, calculateEstimatedTravelMinutes } from '../../utils/teamAssignment';
import { Play, Layers, Compass } from 'lucide-react';

interface MapProps {
  reports: EmergencyReport[];
  teams?: ResponseTeam[];
  selectedReport?: EmergencyReport | null;
  onSelectReport: (report: EmergencyReport) => void;
  onSelectTeam?: (team: ResponseTeam) => void;
}

// Helper component to smoothly pan/zoom map to selected coordinates
const MapController: React.FC<{ target: [number, number] | null }> = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, Math.max(map.getZoom(), 14), { duration: 0.9 });
    }
  }, [target, map]);
  return null;
};

// Category emoji icon helper
const getCategoryIconSymbol = (type = '', category = '') => {
  const t = (type + ' ' + category).toLowerCase();
  if (t.includes('fire')) return '🔥';
  if (t.includes('medical') || t.includes('cardiac')) return '🚑';
  if (t.includes('road') || t.includes('accident')) return '🚗';
  if (t.includes('flood') || t.includes('water')) return '🌊';
  if (t.includes('collapse') || t.includes('building')) return '🏢';
  return '🚨';
};

/**
 * True teardrop emergency location needle pin.
 * Anchor at [16, 42] ensures the sharp bottom tip points directly to the street/GPS coordinate.
 */
const createIncidentPin = (report: EmergencyReport, isSelected = false) => {
  const tier = report.priorityTier || 'P3';
  const colors: Record<PriorityTier, { gradientFrom: string; gradientTo: string; border: string; text: string }> = {
    P1: { gradientFrom: '#ef4444', gradientTo: '#b91c1c', border: '#ffffff', text: '#ffffff' },
    P2: { gradientFrom: '#f97316', gradientTo: '#c2410c', border: '#ffffff', text: '#ffffff' },
    P3: { gradientFrom: '#eab308', gradientTo: '#a16207', border: '#ffffff', text: '#111214' },
    P4: { gradientFrom: '#3b82f6', gradientTo: '#1d4ed8', border: '#ffffff', text: '#ffffff' },
  };

  const c = colors[tier] || colors.P4;
  const isP1 = tier === 'P1';
  const symbol = getCategoryIconSymbol(report.type, report.category);

  return L.divIcon({
    className: 'custom-incident-needle-pin',
    html: `
      <div style="position: relative; width: 34px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; transform: ${
        isSelected ? 'scale(1.18) translateY(-4px)' : 'scale(1)'
      }; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); z-index: ${isSelected ? 50 : isP1 ? 40 : 20};">
        
        <!-- Ground Radar Pulse at needle tip [17, 42] -->
        ${
          isP1 || isSelected
            ? `<div style="position: absolute; bottom: 0px; left: 17px; transform: translateX(-50%); width: 22px; height: 11px; background: ${
                isP1 ? 'rgba(239, 68, 68, 0.55)' : 'rgba(56, 189, 248, 0.55)'
              }; border-radius: 50%; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></div>`
            : ''
        }

        <!-- Teardrop Needle Pin SVG -->
        <svg viewBox="0 0 34 44" width="34" height="44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.65));">
          <defs>
            <linearGradient id="pinGrad-${report.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${c.gradientFrom}"/>
              <stop offset="100%" stop-color="${c.gradientTo}"/>
            </linearGradient>
          </defs>
          <!-- Pin Body with pointed bottom tip at (17, 42) -->
          <path d="M17 42C17 42 32 27 32 16C32 7.716 25.284 1 17 1C8.716 1 2 7.716 2 16C2 27 17 42 17 42Z" 
                fill="url(#pinGrad-${report.id})" 
                stroke="${isSelected ? '#38bdf8' : c.border}" 
                stroke-width="${isSelected ? '2.5' : '1.75'}"/>
          <!-- Inner circle background for icon -->
          <circle cx="17" cy="16" r="10.5" fill="#0f1115" stroke="${c.gradientFrom}" stroke-width="1.2"/>
        </svg>

        <!-- Category Symbol in center of pin head -->
        <div style="position: absolute; top: 7px; left: 17px; transform: translateX(-50%); font-size: 11px; line-height: 1; pointer-events: none;">
          ${symbol}
        </div>

        <!-- Priority Tier Pill Badge at top right -->
        <div style="position: absolute; top: -3px; right: -4px; background: ${c.gradientFrom}; color: ${
      c.text
    }; border: 1.5px solid #ffffff; border-radius: 9999px; font-size: 9px; font-weight: 800; font-family: monospace; padding: 0.5px 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.6); pointer-events: none; line-height: 1.2;">
          ${tier}
        </div>
      </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [0, -42],
  });
};

// Response Teams pinpoint station marker
const createTeamIcon = (category: TeamCategory, availability: TeamAvailabilityStatus) => {
  const isAvail = availability === 'Available';
  const borderCol = isAvail ? '#22c55e' : '#f59e0b';
  const bgCol = '#0f1115';

  let iconChar = '🚒';
  if (category === 'Medical') iconChar = '🚑';
  else if (category === 'Rescue') iconChar = '🛟';
  else if (category === 'Police') iconChar = '🚓';
  else if (category === 'Disaster') iconChar = '🌊';

  return L.divIcon({
    className: 'custom-team-marker',
    html: `
      <div style="position: relative; width: 32px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <!-- Pin Needle SVG -->
        <svg viewBox="0 0 32 40" width="32" height="40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.6));">
          <path d="M16 38C16 38 29 25 29 15C29 7.82 23.18 2 16 2C8.82 2 3 7.82 3 15C3 25 16 38 16 38Z" 
                fill="${bgCol}" 
                stroke="${borderCol}" 
                stroke-width="2"/>
          <circle cx="16" cy="15" r="9.5" fill="${borderCol}" fill-opacity="0.2"/>
        </svg>
        <div style="position: absolute; top: 6px; left: 16px; transform: translateX(-50%); font-size: 12px; pointer-events: none;">
          ${iconChar}
        </div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 38],
    popupAnchor: [0, -38],
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

  // Mobile layer controls collapse state
  const [mobileLayersOpen, setMobileLayersOpen] = useState(false);

  return (
    <div className="w-full h-full min-h-[380px] sm:min-h-[500px] md:min-h-[580px] rounded-card overflow-hidden border border-graphite-border bg-graphite-deep relative">
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

        {/* Dynamic map panner when selectedReport changes */}
        <MapController target={selectedReport ? [selectedReport.latitude, selectedReport.longitude] : null} />

        {/* 1. ACCURATE NEEDLE TEARDROP INCIDENT PIN MARKERS */}
        {showIncidents &&
          activeReports.map((report) => (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={createIncidentPin(report, selectedReport?.id === report.id)}
            >
              <Popup className="emergency-popup">
                <div className="p-1 space-y-1.5 text-graphite-text max-w-[260px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-graphite-text flex items-center space-x-1">
                      <span>{getCategoryIconSymbol(report.type, report.category)}</span>
                      <span>{report.title || `${report.type} Incident`}</span>
                    </span>
                    <span className="font-mono tabular-nums text-[11px] font-bold text-amber-300 bg-graphite-raised px-1.5 py-0.5 rounded border border-graphite-border">
                      {report.trackingId || report.id}
                    </span>
                  </div>
                  <p className="text-[11px] line-clamp-2 text-graphite-secondary leading-snug">
                    {report.description}
                  </p>
                  <div className="text-[10px] text-graphite-muted truncate flex items-center space-x-1">
                    <Compass className="w-3 h-3 text-sky-400 shrink-0" />
                    <span className="truncate">
                      {report.area ? `${report.area} • ` : ''}
                      {report.address || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                    </span>
                  </div>

                  {report.assignedTeamName && (
                    <div className="p-1.5 bg-sky-500/10 border border-sky-500/25 rounded text-[10px] text-sky-200">
                      Dispatched: <strong>{report.assignedTeamName}</strong>
                      <div className="font-mono text-[9px] text-sky-300">
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
                        className="py-1.5 px-2 bg-sky-500 hover:bg-sky-400 text-white rounded-control text-xs font-semibold flex items-center space-x-1 shrink-0"
                        title="Simulate team en route"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span className="text-[10px]">Simulate</span>
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

      {/* Map Layer Controls & Simulation Widget - Fully Mobile Responsive */}
      <div className="absolute top-3 right-3 z-[400] text-xs">
        {/* Mobile toggle button */}
        <button
          onClick={() => setMobileLayersOpen((prev) => !prev)}
          className="sm:hidden px-2.5 py-1.5 bg-graphite-deep/95 backdrop-blur-md border border-graphite-border-strong rounded-control shadow-lg flex items-center space-x-1.5 text-graphite-text font-medium"
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Layers</span>
          <span className="text-[10px] text-graphite-muted">({activeReports.length + teams.length})</span>
        </button>

        {/* Layer Box (Always visible on desktop sm+, toggled on mobile) */}
        <div
          className={`${
            mobileLayersOpen ? 'block' : 'hidden'
          } sm:block mt-1 sm:mt-0 bg-graphite-deep/95 backdrop-blur-md border border-graphite-border-strong rounded-control p-2.5 space-y-2 shadow-xl min-w-[190px]`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-graphite-muted block">
              Map Layers & Routes
            </span>
            <span className="sm:hidden text-[10px] text-sky-400 cursor-pointer" onClick={() => setMobileLayersOpen(false)}>
              ✕
            </span>
          </div>
          <div className="flex flex-col space-y-1.5 text-[11px]">
            <label className="inline-flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showIncidents}
                onChange={(e) => setShowIncidents(e.target.checked)}
                className="rounded bg-graphite-raised border-graphite-border text-red-500 focus:ring-0"
              />
              <span className="text-graphite-text font-medium">📍 Incidents ({activeReports.length})</span>
            </label>
            <label className="inline-flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showTeams}
                onChange={(e) => setShowTeams(e.target.checked)}
                className="rounded bg-graphite-raised border-graphite-border text-emerald-500 focus:ring-0"
              />
              <span className="text-graphite-text font-medium">🚒 Teams ({teams.length})</span>
            </label>
            <label className="inline-flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showRoutes}
                onChange={(e) => setShowRoutes(e.target.checked)}
                className="rounded bg-graphite-raised border-graphite-border text-sky-500 focus:ring-0"
              />
              <span className="text-graphite-text font-medium">⚡ Routes ({activeRoutes.length})</span>
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
                <span>Stop simulation</span>
              </button>
            </div>
          )}
        </div>
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
