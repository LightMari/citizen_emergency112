import React, { useState } from 'react';
import {
  X,
  Zap,
  MapPin,
  Clock,
  CheckCircle2,
  Flame,
  HeartPulse,
  LifeBuoy,
  Shield,
  Radio,
  Users,
  Navigation,
} from 'lucide-react';
import { EmergencyReport, ResponseTeam, TeamCategory } from '../../types/report';
import { evaluateTeamCandidates, findBestFitTeam } from '../../utils/teamAssignment';
import { assignTeamToIncident, unassignTeamFromIncident } from '../../services/mockBackend';

interface TeamAssignmentModalProps {
  report: EmergencyReport;
  teams: ResponseTeam[];
  onClose: () => void;
  onAssigned: () => void;
}

export const TeamAssignmentModal: React.FC<TeamAssignmentModalProps> = ({
  report,
  teams,
  onClose,
  onAssigned,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    report.assignedTeamId || null
  );

  const candidates = evaluateTeamCandidates(report, teams);
  const bestFit = findBestFitTeam(report, teams);

  const handleAssign = (teamId: string) => {
    assignTeamToIncident(report.id, teamId);
    onAssigned();
    onClose();
  };

  const handleUnassign = () => {
    unassignTeamFromIncident(report.id);
    onAssigned();
    onClose();
  };

  const handleAutoAssign = () => {
    if (!bestFit) return;
    handleAssign(bestFit.team.id);
  };

  const getCategoryIcon = (category: TeamCategory) => {
    switch (category) {
      case 'Fire':
        return <Flame className="w-3.5 h-3.5 text-red-400 stroke-[2]" />;
      case 'Medical':
        return <HeartPulse className="w-3.5 h-3.5 text-emerald-400 stroke-[2]" />;
      case 'Rescue':
        return <LifeBuoy className="w-3.5 h-3.5 text-amber-400 stroke-[2]" />;
      case 'Police':
        return <Shield className="w-3.5 h-3.5 text-sky-400 stroke-[2]" />;
      case 'Disaster':
        return <Radio className="w-3.5 h-3.5 text-cyan-400 stroke-[2]" />;
      default:
        return <Users className="w-3.5 h-3.5 text-gray-400 stroke-[2]" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-deep/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-graphite-card border border-graphite-border-strong max-w-xl w-full rounded-panel shadow-2xl overflow-hidden my-auto text-graphite-text max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-graphite-border flex items-center justify-between bg-graphite-deep/95">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded bg-sky-500/10 border border-sky-500/25 text-sky-300">
              <Navigation className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-graphite-text">
                Dispatch Nearest Response Team
              </h2>
              <p className="text-[11px] text-graphite-muted">
                Incident #{report.id} • {report.type} • {report.address || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-graphite-muted hover:text-graphite-text rounded-control transition-colors"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* 1-Click Auto Assign Banner */}
        {bestFit && (
          <div className="p-3 bg-sky-500/10 border-b border-sky-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-sky-200">
              <Zap className="w-4 h-4 text-sky-400 shrink-0 fill-sky-400/20 stroke-[2]" />
              <div>
                <span className="font-semibold text-white">Recommended Nearest Match: </span>
                <span>
                  {bestFit.team.name} ({bestFit.distanceKm} km • ~{bestFit.etaMinutes} min ETA)
                </span>
              </div>
            </div>

            <button
              onClick={handleAutoAssign}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-control text-xs font-semibold shrink-0 transition-colors flex items-center space-x-1"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Auto-Dispatch</span>
            </button>
          </div>
        )}

        {/* Team Candidates List */}
        <div className="p-4 overflow-y-auto space-y-2.5 max-h-[55vh]">
          <div className="text-[11px] font-mono text-graphite-muted uppercase tracking-wider">
            Available Response Units Ranked by Distance & Suitability
          </div>

          {candidates.map((candidate) => {
            const isAssigned = report.assignedTeamId === candidate.team.id;
            const isSelected = selectedTeamId === candidate.team.id;
            const isBestMatch = bestFit?.team.id === candidate.team.id;

            return (
              <div
                key={candidate.team.id}
                onClick={() => setSelectedTeamId(candidate.team.id)}
                className={`p-3 rounded-card border cursor-pointer transition-all duration-150 space-y-2 ${
                  isAssigned
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : isSelected
                    ? 'border-sky-500/50 bg-sky-500/5'
                    : candidate.isAvailable
                    ? 'border-graphite-border hover:border-graphite-border-strong bg-graphite-card'
                    : 'border-graphite-border/50 bg-graphite-raised/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-graphite-raised border border-graphite-border">
                      {getCategoryIcon(candidate.team.category)}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-graphite-text">
                          {candidate.team.name}
                        </span>
                        {isBestMatch && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            Nearest Best Match
                          </span>
                        )}
                        {isAssigned && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Currently Assigned
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-graphite-muted flex items-center space-x-2 mt-0.5">
                        <span className="font-mono">{candidate.team.id}</span>
                        <span>•</span>
                        <span>{candidate.team.vehicleType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Distance and ETA Badge */}
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-graphite-text flex items-center justify-end space-x-1">
                      <MapPin className="w-3 h-3 text-red-400 stroke-[2]" />
                      <span>{candidate.distanceKm} km</span>
                    </div>
                    <div className="text-[10px] text-graphite-muted flex items-center justify-end space-x-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5 stroke-[2]" />
                      <span>ETA ~{candidate.etaMinutes} mins</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-graphite-border/60">
                  <span className="text-graphite-muted truncate max-w-[280px]">
                    Base: {candidate.team.stationName}
                  </span>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        candidate.isCategoryMatch
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                      }`}
                    >
                      {candidate.isCategoryMatch ? 'Suitable Category' : 'Alternative Category'}
                    </span>

                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        candidate.isAvailable
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                      }`}
                    >
                      {candidate.isAvailable ? 'Available' : 'Busy'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-graphite-border bg-graphite-deep flex items-center justify-between gap-3">
          {report.assignedTeamId ? (
            <button
              onClick={handleUnassign}
              className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/25 rounded-control transition-colors"
            >
              Unassign Current Team
            </button>
          ) : (
            <span className="text-[11px] text-graphite-muted">
              Select any unit to dispatch directly to incident location
            </span>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-graphite-secondary hover:text-graphite-text transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!selectedTeamId}
              onClick={() => selectedTeamId && handleAssign(selectedTeamId)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-control text-xs font-semibold transition-colors flex items-center space-x-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2]" />
              <span>Confirm & Dispatch Team</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
