import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Send,
  CheckCircle2,
  Radio,
  Check,
  Filter,
} from 'lucide-react';
import { DepartmentName, DepartmentDispatch, DispatchStatus, AreaAdvisory } from '../../types/report';
import {
  getStoredDispatches,
  updateDepartmentResponse,
  getStoredAdvisories,
} from '../../services/departmentRouter';
import { updateReportStatus, subscribeToRealtimeReports } from '../../services/mockBackend';

const DEPARTMENTS: DepartmentName[] = [
  'Fire & Rescue',
  'Traffic Police',
  'Ambulance',
  'Disaster Management',
  'Rescue Team',
  'Control Room',
];

export const DepartmentDashboard: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState<DepartmentName>('Fire & Rescue');
  const [dispatches, setDispatches] = useState<DepartmentDispatch[]>(() => getStoredDispatches());
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [etaInputs, setEtaInputs] = useState<Record<string, string>>({});
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const refreshDispatches = () => {
    setDispatches(getStoredDispatches());
  };

  useEffect(() => {
    const unsubscribe = subscribeToRealtimeReports(() => {
      refreshDispatches();
    });
    return () => unsubscribe();
  }, []);

  // Filter dispatches for selected department, sorted by severity (Critical first)
  const deptDispatches = dispatches
    .filter((d) => d.department === selectedDept)
    .sort((a, b) => {
      const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      const diff = (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
      if (diff !== 0) return diff;
      return new Date(b.forwardedAt).getTime() - new Date(a.forwardedAt).getTime();
    });

  const handleUpdateStatus = (
    dispatch: DepartmentDispatch,
    newStatus: DispatchStatus,
    customMessage?: string
  ) => {
    const eta = etaInputs[dispatch.id] || dispatch.eta || '5 min';
    const message = customMessage ?? replyTexts[dispatch.id] ?? '';

    const result = updateDepartmentResponse(dispatch.id, newStatus, eta, message);
    // Update overall incident status roll-up
    updateReportStatus(
      dispatch.incidentId,
      result.rolledUpStatus,
      `${dispatch.department} marked status as ${newStatus} (ETA: ${eta})`,
      dispatch.department
    );

    refreshDispatches();
    setActionSuccess(`Dispatch #${dispatch.trackingId} updated to ${newStatus}`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'High':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'Medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  const getStatusBadge = (st: DispatchStatus) => {
    switch (st) {
      case 'Forwarded':
        return 'bg-graphite-raised text-graphite-secondary border-graphite-border';
      case 'Acknowledged':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Responding':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      case 'Resolved':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
    }
  };

  const recentAdvisories = getStoredAdvisories().slice(0, 4);

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-graphite-card border border-graphite-border rounded-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-sky-400 stroke-[1.75]" />
            <h1 className="text-base sm:text-lg font-semibold text-graphite-text">
              Department Operations Command
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/25">
              Targeted Dispatch Inbox
            </span>
          </div>
          <p className="text-xs text-graphite-secondary mt-0.5">
            Auto-forwarded incidents scoped by jurisdiction. Responses automatically roll up status & update Area Advisory Feed.
          </p>
        </div>

        {/* Department Selector */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-graphite-muted" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value as DepartmentName)}
            className="bg-graphite-raised border border-graphite-border rounded-control px-3 py-1.5 text-xs font-semibold text-graphite-text focus:outline-none focus:border-graphite-border-strong"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept} ({dispatches.filter((d) => d.department === dept && d.status !== 'Resolved').length} active)
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-control text-xs text-emerald-300 flex items-center space-x-2">
          <Check className="w-4 h-4 stroke-[2]" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Grid: Department Inbox & Live Area Advisories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Department Inbox (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between text-xs text-graphite-muted px-1">
            <span>
              <strong>{selectedDept}</strong> Inbox ({deptDispatches.length} incidents)
            </span>
            <span>Sorted by Severity (Critical first)</span>
          </div>

          {deptDispatches.length > 0 ? (
            <div className="space-y-3">
              {deptDispatches.map((dispatch) => {
                const isCritical = dispatch.severity === 'Critical';
                return (
                  <div
                    key={dispatch.id}
                    className={`bg-graphite-card border rounded-panel p-4 transition-all duration-150 space-y-3 ${
                      isCritical
                        ? 'border-red-500/40 bg-red-500/[0.03] shadow-sm'
                        : 'border-graphite-border'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-sky-400">
                            #{dispatch.trackingId}
                          </span>
                          <h3 className="text-sm font-semibold text-graphite-text">
                            {dispatch.incidentTitle}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-graphite-muted">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-red-400" />
                            <span>Area: <strong>{dispatch.area}</strong></span>
                          </span>
                          <span>•</span>
                          <span>Category: {dispatch.incidentCategory}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(
                            dispatch.severity
                          )}`}
                        >
                          {dispatch.severity}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getStatusBadge(
                            dispatch.status
                          )}`}
                        >
                          {dispatch.status}
                        </span>
                      </div>
                    </div>

                    {/* Response Metadata */}
                    {dispatch.responseMessage && (
                      <div className="p-2.5 bg-graphite-deep rounded border border-graphite-border text-xs text-graphite-secondary">
                        <span className="text-[10px] font-mono uppercase text-graphite-muted block">
                          Current Advisory Response
                        </span>
                        <p className="text-graphite-text mt-0.5">{dispatch.responseMessage}</p>
                        <span className="text-[10px] text-graphite-muted block mt-1">
                          ETA: {dispatch.eta} • Logged {dispatch.respondedAt ? new Date(dispatch.respondedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                        </span>
                      </div>
                    )}

                    {/* Department Response Controls */}
                    <div className="pt-2 border-t border-graphite-border space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* ETA Input */}
                        <div>
                          <label className="block text-[10px] font-mono text-graphite-muted mb-1">
                            Response ETA
                          </label>
                          <input
                            type="text"
                            value={etaInputs[dispatch.id] ?? dispatch.eta}
                            onChange={(e) =>
                              setEtaInputs((prev) => ({ ...prev, [dispatch.id]: e.target.value }))
                            }
                            placeholder="e.g. 8 min"
                            className="w-full bg-graphite-raised border border-graphite-border rounded-control p-1.5 text-xs text-graphite-text focus:outline-none"
                          />
                        </div>

                        {/* Reply Text Box */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-mono text-graphite-muted mb-1">
                            Area Advisory Broadcast Message
                          </label>
                          <input
                            type="text"
                            value={replyTexts[dispatch.id] ?? ''}
                            onChange={(e) =>
                              setReplyTexts((prev) => ({ ...prev, [dispatch.id]: e.target.value }))
                            }
                            placeholder="e.g. Responding with 2 units. Evacuate 50m perimeter."
                            className="w-full bg-graphite-raised border border-graphite-border rounded-control p-1.5 text-xs text-graphite-text focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] text-graphite-muted">
                          Forwarded {new Date(dispatch.forwardedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                dispatch,
                                'Acknowledged',
                                `${selectedDept} has acknowledged incident #${dispatch.trackingId}. Triage team mobilized.`
                              )
                            }
                            className="px-2.5 py-1 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-control font-medium transition-colors"
                          >
                            Acknowledge
                          </button>

                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                dispatch,
                                'Responding',
                                replyTexts[dispatch.id] ||
                                  `${selectedDept} is responding to ${dispatch.area}, ETA ${etaInputs[dispatch.id] || dispatch.eta || '8 min'}.`
                              )
                            }
                            className="px-3 py-1 text-xs bg-sky-500 hover:bg-sky-400 text-white rounded-control font-medium flex items-center space-x-1 transition-colors"
                          >
                            <Send className="w-3 h-3 stroke-[2]" />
                            <span>Responding + Broadcast</span>
                          </button>

                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                dispatch,
                                'Resolved',
                                `${selectedDept} has completed operations at ${dispatch.area}. Area safe.`
                              )
                            }
                            className="px-2.5 py-1 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-control font-medium transition-colors flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3 h-3 stroke-[2]" />
                            <span>Mark Resolved</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-graphite-card border border-graphite-border rounded-panel text-graphite-muted text-xs">
              No active dispatches currently pending for {selectedDept}.
            </div>
          )}
        </div>

        {/* Live Area Advisory Feed (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-graphite-muted px-1">
            <span className="flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Live Area Advisory Feed</span>
            </span>
            <span className="font-mono text-[10px]">Real-time Citizen Alerts</span>
          </div>

          <div className="bg-graphite-card border border-graphite-border rounded-panel p-3.5 space-y-3">
            {recentAdvisories.length > 0 ? (
              <div className="space-y-2.5">
                {recentAdvisories.map((adv: AreaAdvisory) => (
                  <div
                    key={adv.id}
                    className="p-2.5 rounded bg-graphite-deep border border-graphite-border space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-400 text-[11px]">{adv.area} Sector</span>
                      <span className="text-[10px] text-graphite-muted font-mono">
                        {new Date(adv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-graphite-text">
                      {adv.department}:
                    </div>
                    <p className="text-graphite-secondary text-xs leading-relaxed">
                      "{adv.message}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-graphite-muted">
                No active area advisories broadcasted yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
