import React, { useState } from 'react';
import {
  X,
  MapPin,
  Phone,
  Volume2,
  AlertOctagon,
  AlertCircle,
} from 'lucide-react';
import { EmergencyReport, ReportStatus, PriorityTier } from '../../types/report';
import { updateReportStatus, flagFalseReport } from '../../services/mockBackend';
import { formatBytes } from '../../utils/compression';
import { calculatePriorityScore } from '../../utils/priority';

interface ModalProps {
  report: EmergencyReport;
  onClose: () => void;
  onUpdated?: () => void;
}

export const ReportDetailModal: React.FC<ModalProps> = ({ report, onClose, onUpdated }) => {
  const [showFalseReportPrompt, setShowFalseReportPrompt] = useState(false);
  const [falseReason, setFalseReason] = useState('');

  const priorityBreakdown = calculatePriorityScore({
    severity: report.severity,
    trappedPersons: report.trappedPersons,
    injuries: report.injuries,
    peopleAffected: report.peopleAffected,
    hazards: report.hazards,
  });

  const handleStatusChange = (status: ReportStatus) => {
    updateReportStatus(report.id, status);
    if (onUpdated) onUpdated();
    onClose();
  };

  const handleFlagFalse = () => {
    if (!falseReason.trim()) return;
    flagFalseReport(report.id, falseReason);
    if (onUpdated) onUpdated();
    onClose();
  };

  const priorityColors: Record<PriorityTier, string> = {
    P1: 'bg-emergency-subtle text-emergency-accent border-emergency-border',
    P2: 'bg-orange-500/10 text-orange-300 border-orange-500/25',
    P3: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/25',
    P4: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-deep/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
    >
      <div className="bg-graphite-card border border-graphite-border-strong max-w-2xl w-full rounded-panel shadow-2xl overflow-hidden my-auto text-graphite-text max-h-[90vh] flex flex-col">
        {/* MODAL HEADER */}
        <div className="p-4 border-b border-graphite-border flex items-center justify-between bg-graphite-deep/95 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-mono tabular-nums border ${
                priorityColors[report.priorityTier]
              }`}
            >
              {report.priorityTier} • Score {report.priorityScore}
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-medium text-graphite-text">
                  {report.type} Incident
                </h2>
                <span className="font-mono text-xs text-graphite-muted">#{report.id}</span>
              </div>
              <span className="text-[11px] text-graphite-muted block">
                Logged {new Date(report.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-graphite-muted hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/5 bg-graphite-raised border border-graphite-border rounded-control transition-colors duration-150"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Duplicate Notice */}
          {report.isPotentialDuplicate && (
            <div className="p-3 bg-graphite-raised border border-graphite-border rounded-control text-xs flex items-center space-x-2 text-graphite-secondary">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 stroke-[1.5]" />
              <span>
                <strong className="text-graphite-text font-medium">Duplicate cluster:</strong> Co-located with incident #{report.duplicateOfId}. Triage together.
              </span>
            </div>
          )}

          {/* False Report Banner */}
          {report.isFalseReport && (
            <div className="p-3 bg-emergency-subtle border border-emergency-border rounded-control text-xs text-emergency-accent flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 shrink-0 stroke-[1.5]" />
              <span>
                <strong className="font-medium">Flagged as false alarm:</strong> {report.falseReportReason}
              </span>
            </div>
          )}

          {/* PRIORITY SCORING BREAKDOWN */}
          <div className="bg-graphite-deep border border-graphite-border rounded-control p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-graphite-secondary">Priority triage score</span>
              <span className="font-mono tabular-nums text-graphite-text font-medium">{report.priorityScore} / 100</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-graphite-raised p-2 rounded border border-graphite-border">
                <span className="text-[11px] text-graphite-muted block">Severity</span>
                <span className="font-mono tabular-nums text-graphite-text">+{priorityBreakdown.breakdown.severityScore}</span>
              </div>
              <div className="bg-graphite-raised p-2 rounded border border-graphite-border">
                <span className="text-[11px] text-graphite-muted block">Trapped</span>
                <span className="font-mono tabular-nums text-graphite-text">+{priorityBreakdown.breakdown.trappedScore}</span>
              </div>
              <div className="bg-graphite-raised p-2 rounded border border-graphite-border">
                <span className="text-[11px] text-graphite-muted block">Casualties</span>
                <span className="font-mono tabular-nums text-graphite-text">+{priorityBreakdown.breakdown.peopleAffectedScore}</span>
              </div>
              <div className="bg-graphite-raised p-2 rounded border border-graphite-border">
                <span className="text-[11px] text-graphite-muted block">Hazards</span>
                <span className="font-mono tabular-nums text-graphite-text">+{priorityBreakdown.breakdown.hazardsScore}</span>
              </div>
            </div>
          </div>

          {/* INCIDENT DESCRIPTION */}
          <div className="space-y-1">
            <span className="text-[11px] text-graphite-muted font-medium block">
              Incident description
            </span>
            <div className="bg-graphite-deep border border-graphite-border rounded-control p-3 text-xs sm:text-sm text-graphite-text leading-relaxed">
              {report.description}
            </div>
          </div>

          {/* VOICE MEMO / AUDIO */}
          {report.media.some((m) => m.kind === 'audio') && (
            <div className="bg-graphite-deep border border-graphite-border rounded-control p-3 space-y-2">
              <div className="flex items-center space-x-2 text-xs text-graphite-secondary">
                <Volume2 className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Citizen voice memo</span>
              </div>
              {report.media
                .filter((m) => m.kind === 'audio')
                .map((a, i) => (
                  <audio key={i} src={a.url} controls className="h-8 w-full" />
                ))}
            </div>
          )}

          {/* PHOTOS & VIDEOS */}
          {report.media.some((m) => m.kind === 'image' || m.kind === 'video') && (
            <div className="space-y-1.5">
              <span className="text-[11px] text-graphite-muted font-medium block">
                Attached telemetry media
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {report.media
                  .filter((m) => m.kind === 'image' || m.kind === 'video')
                  .map((m, i) => (
                    <div
                      key={i}
                      className="border border-graphite-border rounded-control overflow-hidden bg-graphite-deep aspect-video relative group"
                    >
                      {m.kind === 'image' ? (
                        <img src={m.url} alt="Scene telemetry" className="w-full h-full object-cover" />
                      ) : (
                        <video src={m.url} className="w-full h-full object-cover" />
                      )}
                      <span className="absolute bottom-1 right-1 text-[10px] font-mono tabular-nums bg-graphite-deep/85 px-1 py-0.5 rounded text-graphite-muted">
                        {formatBytes(m.size)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TELEMETRY LOCATION DETAILS */}
          <div className="bg-graphite-deep border border-graphite-border rounded-control p-3 space-y-1.5 text-xs">
            <div className="flex items-center space-x-2 text-graphite-text">
              <MapPin className="w-3.5 h-3.5 text-emergency-accent shrink-0 stroke-[1.5]" />
              <span className="font-medium">{report.address || 'GPS Coordinates Only'}</span>
            </div>
            <div className="flex items-center space-x-4 text-[11px] text-graphite-muted font-mono tabular-nums pl-5">
              <span>Lat: {report.latitude.toFixed(5)}</span>
              <span>Lng: {report.longitude.toFixed(5)}</span>
              {report.landmark && <span className="text-graphite-secondary">Landmark: {report.landmark}</span>}
            </div>
          </div>

          {/* KEY IMPACT STATS */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-graphite-deep p-2.5 rounded-control border border-graphite-border text-center">
              <span className="text-[11px] text-graphite-muted block">People affected</span>
              <span className="text-sm font-mono tabular-nums font-medium text-graphite-text mt-0.5 block">
                {report.peopleAffected}
              </span>
            </div>

            <div className="bg-graphite-deep p-2.5 rounded-control border border-graphite-border text-center">
              <span className="text-[11px] text-graphite-muted block">Life safety risk</span>
              <span className={`text-sm font-medium mt-0.5 block ${report.injuries || report.trappedPersons ? 'text-emergency-accent' : 'text-graphite-secondary'}`}>
                {report.trappedPersons ? 'Trapped' : report.injuries ? 'Injuries' : 'None reported'}
              </span>
            </div>

            <div className="bg-graphite-deep p-2.5 rounded-control border border-graphite-border text-center">
              <span className="text-[11px] text-graphite-muted block">Severity</span>
              <span className="text-sm font-medium text-graphite-text mt-0.5 block">
                {report.severity || 'Medium'}
              </span>
            </div>
          </div>

          {/* ACTIVE HAZARDS */}
          {report.hazards.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] text-graphite-muted font-medium block">
                Reported hazards
              </span>
              <div className="flex flex-wrap gap-1.5">
                {report.hazards.map((h) => (
                  <span
                    key={h}
                    className="bg-graphite-deep border border-graphite-border text-graphite-secondary px-2.5 py-1 rounded text-xs font-mono"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CONTACT PHONE */}
          {report.contactPhone && (
            <div className="flex items-center space-x-2 bg-graphite-deep p-2.5 rounded-control border border-graphite-border text-xs">
              <Phone className="w-3.5 h-3.5 text-graphite-muted stroke-[1.5]" />
              <span className="text-graphite-muted">Callback contact:</span>
              <a
                href={`tel:${report.contactPhone}`}
                className="font-mono text-graphite-text hover:underline"
              >
                {report.contactPhone}
              </a>
            </div>
          )}

          {/* FALSE REPORT PROMPT */}
          {showFalseReportPrompt ? (
            <div className="p-3 bg-emergency-subtle border border-emergency-border rounded-control space-y-2.5">
              <span className="text-xs font-medium text-emergency-accent block">
                Flag as false alarm / prank
              </span>
              <input
                type="text"
                value={falseReason}
                onChange={(e) => setFalseReason(e.target.value)}
                placeholder="Reason (e.g., prank call, incorrect address, no hazard found)"
                className="w-full bg-graphite-card border border-graphite-border rounded-control p-2 text-xs text-graphite-text placeholder:text-graphite-muted focus:outline-none"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowFalseReportPrompt(false)}
                  className="px-2.5 py-1 bg-graphite-raised hover:bg-graphite-surface border border-graphite-border text-xs rounded-control text-graphite-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFlagFalse}
                  className="px-2.5 py-1 bg-emergency-accent hover:bg-emergency-accent-hover text-white text-xs font-medium rounded-control"
                >
                  Confirm False Report
                </button>
              </div>
            </div>
          ) : (
            !report.isFalseReport && (
              <div className="text-right">
                <button
                  onClick={() => setShowFalseReportPrompt(true)}
                  className="text-[11px] text-graphite-muted hover:text-emergency-accent underline"
                >
                  Flag as false report
                </button>
              </div>
            )
          )}
        </div>

        {/* MODAL FOOTER: STATUS WORKFLOW ACTIONS */}
        <div className="p-3.5 border-t border-graphite-border bg-graphite-deep flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-xs text-graphite-muted">
            Status: <span className="text-graphite-text font-medium">{report.status}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusChange('Verified')}
              disabled={report.status === 'Verified'}
              className="h-8 px-3 bg-graphite-raised hover:bg-blue-500/5 hover:border-blue-500/40 border border-graphite-border text-graphite-text hover:text-blue-300 text-xs font-medium rounded-control transition-colors duration-150 disabled:opacity-40"
            >
              Verify Incident
            </button>
            <button
              onClick={() => handleStatusChange('Dispatched')}
              disabled={report.status === 'Dispatched'}
              className="h-8 px-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/50 text-orange-200 text-xs font-medium rounded-control transition-colors duration-150 disabled:opacity-40"
            >
              Dispatch Units
            </button>
            <button
              onClick={() => handleStatusChange('Resolved')}
              disabled={report.status === 'Resolved'}
              className="h-8 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 text-xs font-medium rounded-control transition-colors duration-150 disabled:opacity-40"
            >
              Mark Resolved
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
