import React, { useState } from 'react';
import {
  X,
  MapPin,
  Phone,
  Volume2,
  AlertOctagon,
  AlertCircle,
  Truck,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { EmergencyReport, ReportStatus, PriorityRank } from '../../types/report';
import { updateReportStatus, flagFalseReport, getStoredTeams } from '../../services/mockBackend';
import { formatBytes } from '../../utils/compression';
import { calculatePriorityScore, getPriorityRank } from '../../utils/priority';
import { TeamAssignmentModal } from './TeamAssignmentModal';

interface ModalProps {
  report: EmergencyReport;
  onClose: () => void;
  onUpdated?: () => void;
}

export const ReportDetailModal: React.FC<ModalProps> = ({ report, onClose, onUpdated }) => {
  const [showFalseReportPrompt, setShowFalseReportPrompt] = useState(false);
  const [falseReason, setFalseReason] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Calculate elapsed time in minutes
  const elapsedMinutes = Math.max(
    0,
    Math.round((Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60))
  );

  const priorityBreakdown = calculatePriorityScore({
    severity: report.severity,
    trappedPersons: report.trappedPersons,
    injuries: report.injuries,
    peopleAffected: report.peopleAffected,
    hazards: report.hazards,
    timeSinceReportingMinutes: elapsedMinutes,
    category: report.type,
  });

  const priorityRank: PriorityRank = report.priorityRank || getPriorityRank(report.priorityTier);

  const handleStatusChange = (status: ReportStatus) => {
    updateReportStatus(report.id, status);
    if (onUpdated) onUpdated();
  };

  const handleFlagFalse = () => {
    if (!falseReason.trim()) return;
    flagFalseReport(report.id, falseReason);
    if (onUpdated) onUpdated();
    onClose();
  };

  const priorityRankBadges: Record<PriorityRank, string> = {
    Critical: 'bg-red-500/10 text-red-400 border-red-500/30',
    High: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  // Full 4-stage lifecycle tracker (Deliverable 4)
  const lifecycleStages: Array<{ status: ReportStatus; label: string }> = [
    { status: 'Reported', label: '1. Reported' },
    { status: 'Assigned', label: '2. Assigned' },
    { status: 'In Progress', label: '3. In Progress' },
    { status: 'Resolved', label: '4. Resolved' },
  ];

  const getStageIndex = (st: ReportStatus): number => {
    switch (st) {
      case 'Reported':
      case 'Received':
        return 0;
      case 'Assigned':
      case 'Verified':
        return 1;
      case 'In Progress':
      case 'Dispatched':
        return 2;
      case 'Resolved':
        return 3;
      default:
        return 0;
    }
  };

  const currentStageIdx = getStageIndex(report.status);

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-deep/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
      >
        <div className="bg-graphite-card border border-graphite-border-strong max-w-2xl w-full rounded-panel shadow-2xl overflow-hidden my-auto text-graphite-text max-h-[92vh] flex flex-col">
          {/* MODAL HEADER */}
          <div className="p-4 border-b border-graphite-border flex items-center justify-between bg-graphite-deep/95 sticky top-0 z-10">
            <div className="flex items-center space-x-3">
              <span
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
                  priorityRankBadges[priorityRank]
                }`}
              >
                {priorityRank} • {report.priorityTier} ({report.priorityScore})
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm sm:text-base font-semibold text-graphite-text">
                    {report.type} Incident
                  </h2>
                  <span className="font-mono text-xs text-graphite-muted">#{report.id}</span>
                </div>
                <span className="text-[11px] text-graphite-muted block">
                  Logged {new Date(report.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} ({elapsedMinutes}m ago)
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

          {/* LIFECYCLE STEPPER BAR (Deliverable 4) */}
          <div className="bg-graphite-deep px-4 py-2.5 border-b border-graphite-border">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[10px] font-mono uppercase text-graphite-muted">Incident Lifecycle Status</span>
              <span className="text-[11px] font-medium text-graphite-text">Current: {report.status}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {lifecycleStages.map((stage, idx) => {
                const isPassed = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                return (
                  <button
                    key={stage.status}
                    onClick={() => handleStatusChange(stage.status)}
                    className={`px-2 py-1.5 rounded text-[11px] font-medium border text-center transition-all ${
                      isCurrent
                        ? 'bg-sky-500/20 text-sky-200 border-sky-500/50 font-semibold shadow-sm'
                        : isPassed
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                        : 'bg-graphite-raised text-graphite-muted border-graphite-border hover:text-graphite-text'
                    }`}
                  >
                    {stage.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MODAL BODY */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
            {/* ASSIGNED TEAM CARD (Deliverables 2, 3, 4) */}
            <div className="p-3.5 bg-graphite-deep rounded-card border border-graphite-border space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-sky-400 stroke-[1.75]" />
                  <span className="text-xs font-semibold text-graphite-text">Emergency Response Team Assignment</span>
                </div>
                {report.assignedTeamId ? (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="text-[11px] text-sky-400 hover:text-sky-300 underline"
                  >
                    Reassign Team
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-white rounded text-[11px] font-semibold flex items-center space-x-1"
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    <span>Dispatch Nearest Team</span>
                  </button>
                )}
              </div>

              {report.assignedTeamId ? (
                <div className="bg-graphite-card p-3 rounded border border-graphite-border space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-white">{report.assignedTeamName}</span>
                        <span className="text-[10px] font-mono text-graphite-muted">({report.assignedTeamId})</span>
                      </div>
                      <div className="text-[11px] text-graphite-secondary mt-0.5">
                        Assigned {report.assignedAt ? new Date(report.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-sky-300">
                        {report.distanceKm ? `${report.distanceKm} km away` : 'Calculating route...'}
                      </span>
                      <div className="text-[10px] text-graphite-muted">
                        ETA ~{report.estimatedArrivalMinutes || 5} mins
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-emerald-300 pt-1 border-t border-graphite-border">
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2]" />
                    <span>Unit acknowledged dispatch. En route with sirens enabled.</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-graphite-raised rounded border border-dashed border-graphite-border text-center text-xs text-graphite-muted">
                  No response team assigned yet. Click "Dispatch Nearest Team" to calculate coordinates and assign the closest unit.
                </div>
              )}
            </div>

            {/* Duplicate Notice */}
            {report.isPotentialDuplicate && (
              <div className="p-3 bg-graphite-raised border border-graphite-border rounded-control text-xs flex items-center space-x-2 text-graphite-secondary">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 stroke-[1.5]" />
                <span>
                  <strong className="text-graphite-text font-medium">Duplicate cluster:</strong> Co-located with incident #{report.duplicateOfId}. Triage together.
                </span>
              </div>
            )}

            {/* DESCRIPTION */}
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-graphite-muted block">
                Incident Summary
              </span>
              <p className="text-xs sm:text-sm text-graphite-text leading-relaxed bg-graphite-deep p-3 rounded-control border border-graphite-border">
                {report.description}
              </p>
            </div>

            {/* LOCATION DETAILS */}
            <div className="p-3 bg-graphite-deep rounded-control border border-graphite-border space-y-1 text-xs">
              <div className="flex items-center space-x-2 text-graphite-text font-medium">
                <MapPin className="w-3.5 h-3.5 text-emergency-accent shrink-0 stroke-[1.5]" />
                <span>{report.address || 'Chennai GPS Coordinates'}</span>
              </div>
              {report.landmark && (
                <div className="text-graphite-secondary pl-5 text-[11px]">
                  Landmark: {report.landmark}
                </div>
              )}
              <div className="text-graphite-muted font-mono text-[10px] pl-5">
                Coordinates: {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
              </div>
            </div>

            {/* HAZARDS & IMPACTS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-graphite-deep border border-graphite-border rounded-control">
                <span className="text-graphite-muted text-[10px] block">People Affected</span>
                <span className="text-graphite-text font-medium text-sm tabular-nums">
                  {report.peopleAffected} {report.peopleAffected === 1 ? 'person' : 'persons'}
                </span>
              </div>
              <div className="p-2.5 bg-graphite-deep border border-graphite-border rounded-control">
                <span className="text-graphite-muted text-[10px] block">Injuries Reported</span>
                <span
                  className={`font-medium text-sm ${
                    report.injuries ? 'text-emergency-accent' : 'text-graphite-secondary'
                  }`}
                >
                  {report.injuries ? 'Yes • Confirmed' : 'None reported'}
                </span>
              </div>
              <div className="p-2.5 bg-graphite-deep border border-graphite-border rounded-control col-span-2 sm:col-span-1">
                <span className="text-graphite-muted text-[10px] block">Persons Trapped</span>
                <span
                  className={`font-medium text-sm ${
                    report.trappedPersons ? 'text-emergency-accent' : 'text-graphite-secondary'
                  }`}
                >
                  {report.trappedPersons ? 'CRITICAL • Trapped' : 'None trapped'}
                </span>
              </div>
            </div>

            {/* ACTIVE HAZARD TAGS */}
            {report.hazards && report.hazards.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-graphite-muted block">
                  Identified Hazard Factors
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {report.hazards.map((hazard) => (
                    <span
                      key={hazard}
                      className="px-2 py-1 bg-emergency-subtle border border-emergency-border text-emergency-accent rounded text-xs flex items-center space-x-1"
                    >
                      <AlertOctagon className="w-3 h-3 stroke-[1.5]" />
                      <span>{hazard}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 4-FACTOR PRIORITIZATION BREAKDOWN (Deliverable 1) */}
            <div className="p-3 bg-graphite-deep border border-graphite-border rounded-control space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-graphite-muted">
                  Intelligent Priority Score Breakdown (0 - 100)
                </span>
                <span className="font-mono text-graphite-text font-semibold">
                  Score: {report.priorityScore} / 100
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-graphite-secondary">
                <div className="bg-graphite-raised p-2 rounded">
                  <span className="text-graphite-muted block text-[10px]">1. Severity ({report.severity || 'Low'})</span>
                  <span className="font-mono text-graphite-text">+{priorityBreakdown.breakdown.severityScore} pts</span>
                </div>
                <div className="bg-graphite-raised p-2 rounded">
                  <span className="text-graphite-muted block text-[10px]">2. People Affected ({report.peopleAffected})</span>
                  <span className="font-mono text-graphite-text">+{priorityBreakdown.breakdown.peopleAffectedScore} pts</span>
                </div>
                <div className="bg-graphite-raised p-2 rounded">
                  <span className="text-graphite-muted block text-[10px]">3. Time Elapsed ({elapsedMinutes}m)</span>
                  <span className="font-mono text-graphite-text">+{priorityBreakdown.breakdown.timeScore} pts</span>
                </div>
                <div className="bg-graphite-raised p-2 rounded">
                  <span className="text-graphite-muted block text-[10px]">4. Category ({report.type})</span>
                  <span className="font-mono text-graphite-text">+{priorityBreakdown.breakdown.categoryScore} pts</span>
                </div>
              </div>
            </div>

            {/* AUDIO TRANSCRIPT */}
            {report.transcript && (
              <div className="space-y-1">
                <div className="flex items-center space-x-1.5 text-[11px] font-mono uppercase tracking-wider text-graphite-muted">
                  <Volume2 className="w-3 h-3 text-graphite-muted stroke-[1.5]" />
                  <span>Citizen Audio Voice Note (Transcript)</span>
                </div>
                <blockquote className="p-3 bg-graphite-deep rounded-control border border-graphite-border text-xs text-graphite-text italic">
                  "{report.transcript}"
                </blockquote>
              </div>
            )}

            {/* ATTACHED MEDIA */}
            {report.media && report.media.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-graphite-muted block">
                  Citizen Media Evidence ({report.media.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {report.media.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-control overflow-hidden border border-graphite-border bg-graphite-deep aspect-video flex items-center justify-center"
                    >
                      {item.kind === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <Volume2 className="w-6 h-6 text-graphite-secondary mx-auto mb-1 stroke-[1.5]" />
                          <span className="text-[10px] text-graphite-muted block truncate max-w-[100px]">
                            {item.name}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 p-1 bg-graphite-deep/80 text-[10px] text-graphite-muted font-mono flex justify-between">
                        <span className="truncate">{item.name}</span>
                        <span>{formatBytes(item.size)}</span>
                      </div>
                    </div>
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
                onClick={() => handleStatusChange('Assigned')}
                disabled={report.status === 'Assigned'}
                className="h-8 px-3 bg-graphite-raised hover:bg-sky-500/10 hover:border-sky-500/40 border border-graphite-border text-graphite-text hover:text-sky-300 text-xs font-medium rounded-control transition-colors duration-150 disabled:opacity-40"
              >
                Mark Assigned
              </button>
              <button
                onClick={() => handleStatusChange('In Progress')}
                disabled={report.status === 'In Progress'}
                className="h-8 px-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/50 text-orange-200 text-xs font-medium rounded-control transition-colors duration-150 disabled:opacity-40"
              >
                Set In Progress
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

      {/* TEAM ASSIGNMENT MODAL POPUP */}
      {showAssignModal && (
        <TeamAssignmentModal
          report={report}
          teams={getStoredTeams()}
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => {
            if (onUpdated) onUpdated();
          }}
        />
      )}
    </>
  );
};
