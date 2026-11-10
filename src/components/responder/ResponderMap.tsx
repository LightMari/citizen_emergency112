import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { EmergencyReport, PriorityTier } from '../../types/report';

interface MapProps {
  reports: EmergencyReport[];
  onSelectReport: (report: EmergencyReport) => void;
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

  return L.divIcon({
    className: 'custom-responder-marker',
    html: `
      <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 22px; height: 22px; background: ${c.bg}; border: 1.5px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; color: ${c.text}; font-size: 10px; font-weight: 600; font-family: monospace;">
          ${tier}
        </div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
};

export const ResponderMap: React.FC<MapProps> = ({ reports, onSelectReport }) => {
  const defaultCenter: [number, number] = [13.0827, 80.2707]; // Chennai City Center, Tamil Nadu

  return (
    <div className="w-full h-full min-h-[360px] rounded-card overflow-hidden border border-graphite-border bg-graphite-deep relative">
      <MapContainer
        center={reports.length > 0 ? [reports[0].latitude, reports[0].longitude] : defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createPriorityIcon(report.priorityTier)}
          >
            <Popup className="emergency-popup">
              <div className="p-1 space-y-1.5 text-graphite-text max-w-[220px]">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs text-graphite-text">
                    {report.type}
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
                <button
                  type="button"
                  onClick={() => onSelectReport(report)}
                  className="w-full mt-1 py-1.5 px-2 bg-graphite-raised hover:bg-graphite-surface border border-graphite-border text-graphite-text rounded-control text-xs font-medium text-center block transition-colors duration-150"
                >
                  Inspect Incident
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-graphite-deep/90 backdrop-blur-md border border-graphite-border rounded-control p-2.5 text-xs space-y-1 shadow-sm">
        <span className="text-[10px] font-mono uppercase tracking-wider text-graphite-muted block">
          Priority tiers
        </span>
        <div className="flex items-center space-x-2.5 text-[11px] font-mono">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emergency-accent"></span>
            <span className="text-graphite-secondary">P1 Critical</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span className="text-graphite-secondary">P2 High</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            <span className="text-graphite-secondary">P3 Mid</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-graphite-secondary">P4 Low</span>
          </span>
        </div>
      </div>
    </div>
  );
};
