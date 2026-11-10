import React, { useState, useEffect } from 'react';
import {
  Filter,
  Map as MapIcon,
  List as ListIcon,
  LayoutGrid,
  Bell,
  Clock,
  MapPin,
  Volume2,
  RefreshCw,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Users,
  Zap,
  Truck,
} from 'lucide-react';
import {
  EmergencyReport,
  EmergencyType,
  PriorityTier,
  ReportStatus,
  ResponseTeam,
} from '../../types/report';
import {
  getStoredReports,
  getStoredTeams,
  subscribeToRealtimeReports,
  autoAssignNearestTeam,
} from '../../services/mockBackend';
import { ResponderMap } from './ResponderMap';
import { ReportDetailModal } from './ReportDetailModal';
import { ResponderAnalyticsCharts } from './ResponderAnalyticsCharts';
import { ResponseTeamManager } from './ResponseTeamManager';
import { TeamAssignmentModal } from './TeamAssignmentModal';
import { rankIncidents, getPriorityRank } from '../../utils/priority';
import { useI18n } from '../../i18n';

export const ResponderDashboard: React.FC = () => {
  const { t } = useI18n();
  const [reports, setReports] = useState<EmergencyReport[]>(() => rankIncidents(getStoredReports()));
  const [teams, setTeams] = useState<ResponseTeam[]>(() => getStoredTeams());
  const [selectedReport, setSelectedReport] = useState<EmergencyReport | null>(null);
  const [assigningReport, setAssigningReport] = useState<EmergencyReport | null>(null);

  // Filters & View state
  const [typeFilter, setTypeFilter] = useState<EmergencyType | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<PriorityTier | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map' | 'teams' | 'analytics'>('split');
  const [showDashboardCharts, setShowDashboardCharts] = useState(true);
  const [newReportAlert, setNewReportAlert] = useState<EmergencyReport | null>(null);

  const refreshAll = () => {
    setReports(rankIncidents(getStoredReports()));
    setTeams(getStoredTeams());
  };

  useEffect(() => {
    const unsubscribe = subscribeToRealtimeReports((event) => {
      refreshAll();

      if (event.type === 'NEW_REPORT') {
        setNewReportAlert(event.report);
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.35);
        } catch {
          // Audio not allowed or unavailable
        }

        setTimeout(() => setNewReportAlert(null), 8000);
      }
    });

    return () => unsubscribe();
  }, []);

  // Filter calculations
  const filteredReports = reports.filter((r) => {
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    if (priorityFilter !== 'ALL' && r.priorityTier !== priorityFilter) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    return true;
  });

  // KPI Metrics
  const totalCount = reports.length;
  const p1Count = reports.filter((r) => r.priorityTier === 'P1' && r.status !== 'Resolved').length;
  const p2Count = reports.filter((r) => r.priorityTier === 'P2' && r.status !== 'Resolved').length;
  const p3Count = reports.filter((r) => r.priorityTier === 'P3' && r.status !== 'Resolved').length;
  const p4Count = reports.filter((r) => r.priorityTier === 'P4' && r.status !== 'Resolved').length;

  const priorityBadges: Record<PriorityTier, string> = {
    P1: 'bg-red-500/10 text-red-400 border-red-500/30',
    P2: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    P3: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    P4: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };

  const priorityHovers: Record<PriorityTier, string> = {
    P1: 'hover:border-red-500/40 hover:bg-red-500/5',
    P2: 'hover:border-orange-500/40 hover:bg-orange-500/5',
    P3: 'hover:border-yellow-500/40 hover:bg-yellow-500/5',
    P4: 'hover:border-blue-500/40 hover:bg-blue-500/5',
  };

  const statusBadges: Record<ReportStatus, string> = {
    Reported: 'bg-graphite-raised text-graphite-secondary border-graphite-border',
    Received: 'bg-graphite-raised text-graphite-secondary border-graphite-border',
    Verified: 'bg-graphite-surface text-graphite-text border-graphite-border-strong',
    Assigned: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    Dispatched: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
    'In Progress': 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    Resolved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  };

  const handleQuickAutoAssign = (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    autoAssignNearestTeam(reportId);
    refreshAll();
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* REALTIME NEW REPORT POPUP BANNER */}
      {newReportAlert && (
        <div
          role="alert"
          onClick={() => {
            setSelectedReport(newReportAlert);
            setNewReportAlert(null);
          }}
          className="cursor-pointer bg-red-500/10 border border-red-500/40 p-3 sm:p-4 rounded-card flex items-center justify-between text-graphite-text animate-pulse hover:bg-red-500/15 transition-colors duration-150"
        >
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-control bg-red-500/20 text-red-400">
              <Bell className="w-4 h-4 stroke-[2]" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-red-300 uppercase tracking-wide">
                  New Incident Telemetry Received
                </span>
                <span className="font-mono text-xs text-graphite-muted">#{newReportAlert.id}</span>
              </div>
              <p className="text-xs text-graphite-secondary line-clamp-1 mt-0.5">
                {newReportAlert.type} • {newReportAlert.address || 'Chennai Location'} • Priority {newReportAlert.priorityTier} ({newReportAlert.priorityScore})
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-medium text-red-300 underline underline-offset-2 shrink-0 ml-2">
            Inspect Now &rarr;
          </span>
        </div>
      )}

      {/* DASHBOARD HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-graphite-card border border-graphite-border rounded-panel p-4 sm:p-5">
        <div>
          <div className="flex items-center space-x-2">
            <img
              src="/tamilnadu-logo.svg"
              alt="Tamil Nadu Government"
              className="w-5 h-5 object-contain shrink-0"
            />
            <h1 className="text-base sm:text-lg font-semibold text-graphite-text">
              {t('responderPortal')}
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-control">
              Live GCC Dispatch
            </span>
          </div>
          <p className="text-xs text-graphite-secondary mt-0.5">
            Automated incident prioritization, nearest team dispatch, route visualization, and emergency analytics
          </p>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center space-x-2">
          <div className="bg-graphite-deep border border-graphite-border p-0.5 rounded-control flex flex-wrap gap-0.5">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium flex items-center space-x-1.5 transition-colors duration-150 ${
                viewMode === 'split'
                  ? 'bg-graphite-surface text-graphite-text border border-graphite-border-strong'
                  : 'text-graphite-secondary hover:text-graphite-text'
              }`}
              title="Split View (List & Map)"
            >
              <LayoutGrid className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium flex items-center space-x-1.5 transition-colors duration-150 ${
                viewMode === 'list'
                  ? 'bg-graphite-surface text-graphite-text border border-graphite-border-strong'
                  : 'text-graphite-secondary hover:text-graphite-text'
              }`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium flex items-center space-x-1.5 transition-colors duration-150 ${
                viewMode === 'map'
                  ? 'bg-graphite-surface text-graphite-text border border-graphite-border-strong'
                  : 'text-graphite-secondary hover:text-graphite-text'
              }`}
              title="Map & Routes"
            >
              <MapIcon className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="hidden sm:inline">Map</span>
            </button>
            <button
              onClick={() => setViewMode('teams')}
              className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium flex items-center space-x-1.5 transition-colors duration-150 ${
                viewMode === 'teams'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-graphite-secondary hover:text-emerald-300 hover:bg-emerald-500/5'
              }`}
              title="Emergency Response Teams Roster"
            >
              <Users className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="hidden sm:inline">Teams ({teams.length})</span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium flex items-center space-x-1.5 transition-colors duration-150 ${
                viewMode === 'analytics'
                  ? 'bg-red-500/10 text-red-200 border border-red-500/40 shadow-sm'
                  : 'text-graphite-secondary hover:text-red-300 hover:bg-red-500/5'
              }`}
              title="Criteria Bar Charts & Analytics"
            >
              <BarChart3 className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="hidden sm:inline">Charts</span>
            </button>
          </div>

          <button
            onClick={refreshAll}
            className="p-2 bg-graphite-card hover:bg-sky-500/5 border border-graphite-border hover:border-sky-500/40 text-graphite-secondary hover:text-sky-300 rounded-control transition-colors duration-150"
            title="Refresh queue"
            aria-label="Refresh queue"
          >
            <RefreshCw className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* METRIC KPI TILES (Deliverable 1: Intelligent Prioritization Ranks) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="bg-graphite-card border border-graphite-border p-3 rounded-card">
          <span className="text-[11px] text-graphite-muted block">Total active</span>
          <span className="text-xl font-mono tabular-nums font-semibold text-graphite-text block mt-1">
            {totalCount}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setPriorityFilter(priorityFilter === 'P1' ? 'ALL' : 'P1')}
          className={`border p-3 rounded-card text-left transition-colors duration-150 ${
            priorityFilter === 'P1'
              ? 'bg-red-500/10 border-red-500/70 text-red-200 shadow-sm'
              : 'bg-graphite-card border-graphite-border hover:border-red-500/40 hover:bg-red-500/5'
          }`}
        >
          <span className="text-[11px] text-red-400 block font-semibold uppercase">Critical (P1)</span>
          <span className="text-xl font-mono tabular-nums font-semibold text-graphite-text block mt-1">
            {p1Count}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPriorityFilter(priorityFilter === 'P2' ? 'ALL' : 'P2')}
          className={`border p-3 rounded-card text-left transition-colors duration-150 ${
            priorityFilter === 'P2'
              ? 'bg-orange-500/10 border-orange-500/70 text-orange-200 shadow-sm'
              : 'bg-graphite-card border-graphite-border hover:border-orange-500/40 hover:bg-orange-500/5'
          }`}
        >
          <span className="text-[11px] text-orange-300 block font-semibold uppercase">High (P2)</span>
          <span className="text-xl font-mono tabular-nums font-semibold text-graphite-text block mt-1">
            {p2Count}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPriorityFilter(priorityFilter === 'P3' ? 'ALL' : 'P3')}
          className={`border p-3 rounded-card text-left transition-colors duration-150 ${
            priorityFilter === 'P3'
              ? 'bg-yellow-500/10 border-yellow-500/70 text-yellow-200 shadow-sm'
              : 'bg-graphite-card border-graphite-border hover:border-yellow-500/40 hover:bg-yellow-500/5'
          }`}
        >
          <span className="text-[11px] text-yellow-300 block font-semibold uppercase">Medium (P3)</span>
          <span className="text-xl font-mono tabular-nums font-semibold text-graphite-text block mt-1">
            {p3Count}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPriorityFilter(priorityFilter === 'P4' ? 'ALL' : 'P4')}
          className={`border p-3 rounded-card text-left transition-colors duration-150 ${
            priorityFilter === 'P4'
              ? 'bg-blue-500/10 border-blue-500/70 text-blue-200 shadow-sm'
              : 'bg-graphite-card border-graphite-border hover:border-blue-500/40 hover:bg-blue-500/5'
          }`}
        >
          <span className="text-[11px] text-blue-300 block font-semibold uppercase">Low (P4)</span>
          <span className="text-xl font-mono tabular-nums font-semibold text-graphite-text block mt-1">
            {p4Count}
          </span>
        </button>
      </div>

      {/* FILTER CONTROLS BAR & CHARTS TOGGLE */}
      {viewMode !== 'teams' && viewMode !== 'analytics' && (
        <div className="bg-graphite-card border border-graphite-border rounded-card p-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-1.5 text-xs text-graphite-secondary">
              <Filter className="w-3.5 h-3.5 stroke-[1.5] text-graphite-muted" />
              <span>Filters:</span>
            </div>

            {/* Emergency Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-graphite-raised border border-graphite-border text-xs rounded-control px-2.5 py-1.5 text-graphite-text focus:outline-none focus:border-graphite-border-strong"
            >
              <option value="ALL">All incident types</option>
              <option value="Fire">Fire</option>
              <option value="Medical">Medical</option>
              <option value="Flood">Flood</option>
              <option value="Earthquake">Earthquake</option>
              <option value="Road Accident">Road Accident</option>
              <option value="Building Collapse">Building Collapse</option>
              <option value="Violence/Crime">Violence/Crime</option>
              <option value="Other">Other</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="bg-graphite-raised border border-graphite-border text-xs rounded-control px-2.5 py-1.5 text-graphite-text focus:outline-none focus:border-graphite-border-strong font-mono"
            >
              <option value="ALL">All priority ranks</option>
              <option value="P1">Critical (P1)</option>
              <option value="P2">High (P2)</option>
              <option value="P3">Medium (P3)</option>
              <option value="P4">Low (P4)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-graphite-raised border border-graphite-border text-xs rounded-control px-2.5 py-1.5 text-graphite-text focus:outline-none focus:border-graphite-border-strong"
            >
              <option value="ALL">All statuses</option>
              <option value="Reported">Reported</option>
              <option value="Received">Received</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Resolved">Resolved</option>
            </select>

            {(typeFilter !== 'ALL' || priorityFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setTypeFilter('ALL');
                  setPriorityFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="text-xs text-amber-300 hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Collapsible toggle for analytics bar charts section */}
          <button
            onClick={() => setShowDashboardCharts((prev) => !prev)}
            className="flex items-center space-x-1.5 text-xs text-graphite-secondary hover:text-graphite-text bg-graphite-raised border border-graphite-border px-2.5 py-1.5 rounded-control transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>{showDashboardCharts ? 'Collapse Criteria Charts' : 'Show Criteria Charts'}</span>
            {showDashboardCharts ? (
              <ChevronUp className="w-3 h-3 stroke-[2]" />
            ) : (
              <ChevronDown className="w-3 h-3 stroke-[2]" />
            )}
          </button>
        </div>
      )}

      {/* DEDICATED RESPONSE TEAMS ROSTER VIEW (Deliverable 2) */}
      {viewMode === 'teams' && (
        <ResponseTeamManager
          teams={teams}
          onTeamUpdated={refreshAll}
          onSelectTeamOnMap={() => {
            setViewMode('map');
          }}
        />
      )}

      {/* CRITERIA-BASED BAR CHART ANALYTICS SECTION (Deliverable 6) */}
      {viewMode === 'analytics' || (showDashboardCharts && viewMode !== 'teams') ? (
        <ResponderAnalyticsCharts
          reports={reports}
          teams={teams}
          selectedType={typeFilter}
          onSelectType={(t) => setTypeFilter(t)}
          selectedPriority={priorityFilter}
          onSelectPriority={(p) => setPriorityFilter(p)}
          selectedStatus={statusFilter}
          onSelectStatus={(s) => setStatusFilter(s)}
        />
      ) : null}

      {/* MAIN WORKSPACE: LIST & MAP */}
      {viewMode !== 'analytics' && viewMode !== 'teams' && (
        <div
          className={`grid gap-5 ${
            viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
          }`}
        >
          {/* LIST VIEW */}
          {(viewMode === 'split' || viewMode === 'list') && (
            <div
              className={`space-y-2.5 ${
                viewMode === 'split' ? 'lg:col-span-6' : 'col-span-1'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-graphite-muted px-1">
                <span>Queue ({filteredReports.length} incidents)</span>
                <span>Auto-ranked by Severity, People, Time & Category</span>
              </div>

              {filteredReports.length > 0 ? (
                <div className="space-y-2.5 overflow-y-auto max-h-[680px] pr-1">
                  {filteredReports.map((report) => {
                    const rank = getPriorityRank(report.priorityTier);
                    const isUnassigned = !report.assignedTeamId && report.status !== 'Resolved';

                    return (
                      <div
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className={`cursor-pointer bg-graphite-card border border-graphite-border ${
                          priorityHovers[report.priorityTier]
                        } p-3.5 rounded-control transition-colors duration-150 space-y-2.5 group`}
                      >
                        {/* Top Row: Type, Priority, Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                                priorityBadges[report.priorityTier]
                              }`}
                            >
                              {rank} • {report.priorityTier} ({report.priorityScore})
                            </span>
                            <span className="font-semibold text-xs text-graphite-text group-hover:text-emergency-accent transition-colors">
                              {report.type}
                            </span>
                            <span className="font-mono text-[11px] text-graphite-muted">
                              #{report.id}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              statusBadges[report.status]
                            }`}
                          >
                            {report.status}
                          </span>
                        </div>

                        {/* Description preview */}
                        <p className="text-xs text-graphite-secondary line-clamp-2 leading-relaxed">
                          {report.description}
                        </p>

                        {/* Team Assignment Banner on Card (Deliverable 3 & 4) */}
                        {report.assignedTeamName ? (
                          <div className="p-2 bg-sky-500/10 border border-sky-500/25 rounded text-[11px] flex items-center justify-between text-sky-200">
                            <div className="flex items-center space-x-1.5">
                              <Truck className="w-3.5 h-3.5 stroke-[2] text-sky-400" />
                              <span>Dispatched: <strong>{report.assignedTeamName}</strong></span>
                            </div>
                            <span className="font-mono text-[10px] text-sky-300">
                              {report.distanceKm} km • ~{report.estimatedArrivalMinutes}m ETA
                            </span>
                          </div>
                        ) : isUnassigned ? (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-graphite-muted">No unit assigned</span>
                            <button
                              onClick={(e) => handleQuickAutoAssign(e, report.id)}
                              className="px-2 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                              title="Automatically calculate distance and assign nearest suitable team"
                            >
                              <Zap className="w-3 h-3 fill-current" />
                              <span>Auto-Assign Nearest</span>
                            </button>
                          </div>
                        ) : null}

                        {/* Location & Tags */}
                        <div className="flex flex-wrap items-center justify-between text-[11px] text-graphite-muted pt-2 border-t border-graphite-border gap-2">
                          <div className="flex items-center space-x-1.5 truncate max-w-[260px]">
                            <MapPin className="w-3 h-3 text-emergency-accent shrink-0 stroke-[1.5]" />
                            <span className="truncate">{report.address || 'Coordinates only'}</span>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            {report.injuries && (
                              <span className="text-emergency-accent font-medium">Injuries</span>
                            )}
                            {report.trappedPersons && (
                              <span className="text-emergency-accent font-medium">Trapped</span>
                            )}
                            {report.media.some((m) => m.kind === 'audio') && (
                              <span title="Voice memo available">
                                <Volume2 className="w-3 h-3 text-graphite-secondary" />
                              </span>
                            )}
                            <span className="font-mono tabular-nums text-graphite-muted flex items-center space-x-1">
                              <Clock className="w-3 h-3 stroke-[1.5]" />
                              <span>
                                {new Date(report.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-graphite-card border border-graphite-border rounded-control p-8 text-center text-graphite-muted text-xs">
                  No incidents match active filters
                </div>
              )}
            </div>
          )}

          {/* MAP & ROUTE VIEW (Deliverable 5) */}
          {(viewMode === 'split' || viewMode === 'map') && (
            <div
              className={`min-h-[420px] ${
                viewMode === 'split' ? 'lg:col-span-6 h-[680px]' : 'col-span-1 h-[640px]'
              }`}
            >
              <ResponderMap
                reports={filteredReports}
                teams={teams}
                selectedReport={selectedReport}
                onSelectReport={(rep) => setSelectedReport(rep)}
                onSelectTeam={() => setViewMode('teams')}
              />
            </div>
          )}
        </div>
      )}

      {/* DETAIL INSPECTION MODAL (Deliverables 1, 4) */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdated={refreshAll}
        />
      )}

      {/* DIRECT TEAM ASSIGNMENT MODAL (Deliverable 3) */}
      {assigningReport && (
        <TeamAssignmentModal
          report={assigningReport}
          teams={teams}
          onClose={() => setAssigningReport(null)}
          onAssigned={refreshAll}
        />
      )}
    </div>
  );
};
