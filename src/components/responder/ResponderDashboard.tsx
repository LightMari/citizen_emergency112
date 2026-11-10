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
import { rankIncidents } from '../../utils/priority';
import { useI18n } from '../../i18n';

interface ResponderDashboardProps {
  initialViewMode?: 'split' | 'list' | 'map' | 'teams' | 'analytics';
}

export const ResponderDashboard: React.FC<ResponderDashboardProps> = ({
  initialViewMode = 'split',
}) => {
  const { t } = useI18n();
  const [reports, setReports] = useState<EmergencyReport[]>(() => rankIncidents(getStoredReports()));
  const [teams, setTeams] = useState<ResponseTeam[]>(() => getStoredTeams());
  const [selectedReport, setSelectedReport] = useState<EmergencyReport | null>(null);
  const [assigningReport, setAssigningReport] = useState<EmergencyReport | null>(null);

  // Filters & View state
  const [typeFilter, setTypeFilter] = useState<EmergencyType | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<PriorityTier | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map' | 'teams' | 'analytics'>(initialViewMode);
  const [newReportAlert, setNewReportAlert] = useState<EmergencyReport | null>(null);

  const refreshAll = () => {
    setReports(rankIncidents(getStoredReports()));
    setTeams(getStoredTeams());
  };

  // Synchronize view mode if initialViewMode prop changes from navbar
  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

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
  const p1Count = reports.filter((r) => r.priorityTier === 'P1').length;
  const p2Count = reports.filter((r) => r.priorityTier === 'P2').length;
  const p3Count = reports.filter((r) => r.priorityTier === 'P3').length;
  const p4Count = reports.filter((r) => r.priorityTier === 'P4').length;

  const handleAutoAssign = (report: EmergencyReport) => {
    const updated = autoAssignNearestTeam(report.id);
    if (updated) {
      refreshAll();
    }
  };

  // When viewed from the dedicated "Charts" Nav Tab, render full Operational Analytics
  if (initialViewMode === 'analytics' || viewMode === 'analytics') {
    return (
      <div className="space-y-5 animate-fade-in">
        {/* CHARTS HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-graphite-card border border-graphite-border rounded-panel p-4 sm:p-5">
          <div>
            <div className="flex items-center space-x-2">
              <img
                src="/tamilnadu-logo.svg"
                alt="Tamil Nadu Government"
                className="w-5 h-5 object-contain shrink-0"
              />
              <h1 className="text-base sm:text-lg font-semibold text-graphite-text">
                Emergency Response Analytics & Criteria Charts
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 rounded-control">
                Live GCC Intelligence
              </span>
            </div>
            <p className="text-xs text-graphite-secondary mt-0.5">
              Criteria-based incident distribution, priority triage ranking, response team fleet readiness, and resolution metrics
            </p>
          </div>

          <button
            onClick={refreshAll}
            className="self-start sm:self-auto px-3 py-1.5 bg-graphite-raised hover:bg-sky-500/5 border border-graphite-border hover:border-sky-500/40 text-graphite-secondary hover:text-sky-300 rounded-control text-xs font-medium transition-colors duration-150 flex items-center space-x-1.5"
            title="Refresh analytics data"
          >
            <RefreshCw className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* FULL CRITERIA BAR CHARTS COMPONENT */}
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
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* REALTIME CRITICAL BANNER ALERT (Flashing Audio Alert) */}
      {newReportAlert && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 bg-red-950/40 border-2 border-red-500 rounded-panel text-red-200 flex items-center justify-between shadow-[0_0_24px_rgba(239,68,68,0.35)] animate-pulse"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-red-400 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-red-100 uppercase tracking-wide">
                  New Emergency Incident Reported!
                </span>
                <span className="font-mono text-xs px-2 py-0.5 bg-red-500 text-white rounded font-bold">
                  {newReportAlert.priorityTier}
                </span>
                <span className="font-mono text-xs text-red-300">
                  #{newReportAlert.trackingId || newReportAlert.id}
                </span>
              </div>
              <p className="text-xs text-red-200/90 mt-0.5 line-clamp-1">
                {newReportAlert.type} • {newReportAlert.description}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center space-x-1 text-xs text-red-300 bg-red-500/10 px-2.5 py-1 rounded border border-red-500/30">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Tone Dispatched</span>
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
            Automated incident prioritization, nearest team dispatch, route visualization, and triage queue
          </p>
        </div>

        {/* View Mode Toggle Buttons - Fully Responsive for Mobile */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-graphite-deep border border-graphite-border p-0.5 rounded-control flex items-center overflow-x-auto no-scrollbar gap-0.5 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('split')}
              className={`hidden md:inline-flex px-2.5 py-1.5 rounded-[6px] text-xs font-medium items-center space-x-1.5 transition-colors duration-150 shrink-0 ${
                viewMode === 'split'
                  ? 'bg-graphite-surface text-graphite-text border border-graphite-border-strong font-semibold'
                  : 'text-graphite-secondary hover:text-graphite-text'
              }`}
              title="Split View (List & Map)"
            >
              <LayoutGrid className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-[6px] text-xs font-medium flex items-center justify-center space-x-1 transition-colors duration-150 shrink-0 ${
                viewMode === 'list'
                  ? 'bg-graphite-surface text-graphite-text border border-graphite-border-strong font-semibold shadow-sm'
                  : 'text-graphite-secondary hover:text-graphite-text'
              }`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-[6px] text-xs font-medium flex items-center justify-center space-x-1 transition-colors duration-150 shrink-0 ${
                viewMode === 'map'
                  ? 'bg-graphite-surface text-graphite-text border border-graphite-border-strong font-semibold shadow-sm'
                  : 'text-graphite-secondary hover:text-graphite-text'
              }`}
              title="Map & Routes"
            >
              <MapIcon className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Map</span>
            </button>
            <button
              onClick={() => setViewMode('teams')}
              className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-[6px] text-xs font-medium flex items-center justify-center space-x-1 transition-colors duration-150 shrink-0 ${
                viewMode === 'teams'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-semibold shadow-sm'
                  : 'text-graphite-secondary hover:text-emerald-300 hover:bg-emerald-500/5'
              }`}
              title="Emergency Response Teams Roster"
            >
              <Users className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Teams</span>
            </button>
          </div>

          <button
            onClick={refreshAll}
            className="p-2 bg-graphite-card hover:bg-sky-500/5 border border-graphite-border hover:border-sky-500/40 text-graphite-secondary hover:text-sky-300 rounded-control transition-colors duration-150 shrink-0"
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

      {/* FILTER CONTROLS BAR */}
      {viewMode !== 'teams' && (
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

      {/* MAIN WORKSPACE: LIST & MAP */}
      {viewMode !== 'teams' && (
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
                    const isUnassigned = !report.assignedTeamId && report.status !== 'Resolved';
                    const isCritical = report.priorityTier === 'P1' || report.severity === 'Critical';
                    const tierBadgeColor = {
                      P1: 'bg-red-500/10 text-red-300 border-red-500/40',
                      P2: 'bg-orange-500/10 text-orange-300 border-orange-500/40',
                      P3: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/40',
                      P4: 'bg-blue-500/10 text-blue-300 border-blue-500/40',
                    }[report.priorityTier] || 'bg-blue-500/10 text-blue-300 border-blue-500/40';

                    return (
                      <div
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className={`cursor-pointer ${
                          isCritical
                            ? 'border-red-500/50 bg-red-950/20 shadow-[0_0_14px_rgba(239,68,68,0.15)] hover:border-red-500/80'
                            : 'border-graphite-border bg-graphite-card'
                        } border rounded-card p-3.5 transition-all duration-150 hover:bg-graphite-surface hover:border-graphite-border-strong`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            {/* Priority Rank Pill (Deliverable 1) */}
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${tierBadgeColor}`}
                            >
                              {report.priorityTier}
                            </span>
                            <span className="font-semibold text-xs sm:text-sm text-graphite-text">
                              {report.title || `${report.type} Incident`}
                            </span>
                            {/* Duplicate Cluster Badge (Deliverable 5) */}
                            {(report.reportCount || 1) > 1 && (
                              <span className="px-1.5 py-0.2 bg-purple-500/15 border border-purple-500/40 text-purple-300 text-[10px] font-mono rounded font-semibold">
                                {report.reportCount} reports
                              </span>
                            )}
                          </div>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-medium rounded-control border ${
                              {
                                Reported: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/30',
                                Pending: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
                                Received: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
                                Verified: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
                                Assigned: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
                                'In Progress': 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                                Dispatched: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
                                Resolved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
                              }[report.status] || 'bg-zinc-500/10 text-zinc-300 border-zinc-500/30'
                            }`}
                          >
                            {report.status}
                          </span>
                        </div>

                        {/* Explainable Severity Line (Deliverable 2) */}
                        {report.severityExplanation && (
                          <div className="mt-1.5 text-[11px] text-amber-200/90 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            {report.severityExplanation}
                          </div>
                        )}

                        <p className="text-xs text-graphite-secondary line-clamp-2 mt-1.5 leading-relaxed">
                          {report.description}
                        </p>

                        {/* Nearest Team Quick Assign / Status (Deliverable 3 & 4) */}
                        <div className="mt-2.5 pt-2 border-t border-graphite-border/70 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 text-[11px] text-graphite-muted">
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-emergency-accent" />
                              <span>{report.area || report.address || 'Chennai'}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center space-x-1 font-mono">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          </div>

                          {/* Team assignment badge / quick button */}
                          {report.assignedTeamName ? (
                            <div className="flex items-center space-x-1.5 text-[11px] text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
                              <Truck className="w-3 h-3 text-sky-400" />
                              <span className="font-medium">{report.assignedTeamName}</span>
                              {report.estimatedArrivalMinutes && (
                                <span className="font-mono text-[10px] text-sky-200/80">
                                  (~{report.estimatedArrivalMinutes}m)
                                </span>
                              )}
                            </div>
                          ) : (
                            isUnassigned && (
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAutoAssign(report);
                                  }}
                                  className="px-2 py-0.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 rounded text-[11px] font-medium flex items-center space-x-1 transition-colors"
                                  title="Auto-dispatch nearest available team via GPS coordinates"
                                >
                                  <Zap className="w-3 h-3 text-emerald-400" />
                                  <span>Auto-Assign Nearest</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAssigningReport(report);
                                  }}
                                  className="px-2 py-0.5 bg-graphite-raised hover:bg-graphite-surface border border-graphite-border text-graphite-secondary text-[11px] rounded"
                                >
                                  Choose...
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-graphite-card border border-graphite-border rounded-card p-8 text-center text-graphite-muted text-xs">
                  No emergency reports match the selected filters.
                </div>
              )}
            </div>
          )}

          {/* MAP & ROUTE VIEW (Deliverable 5) */}
          {(viewMode === 'split' || viewMode === 'map') && (
            <div
              className={`rounded-card overflow-hidden border border-graphite-border bg-graphite-deep ${
                viewMode === 'split' ? 'lg:col-span-6 h-[540px] lg:h-[680px]' : 'col-span-1 h-[680px]'
              }`}
            >
              <ResponderMap
                reports={filteredReports}
                teams={teams}
                selectedReport={selectedReport}
                onSelectReport={(r) => setSelectedReport(r)}
                onSelectTeam={() => {}}
              />
            </div>
          )}
        </div>
      )}

      {/* INSPECT & TRIAGE INCIDENT MODAL (Deliverable 4) */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdated={refreshAll}
        />
      )}

      {/* ASSIGN NEAREST TEAM MODAL (Deliverable 3) */}
      {assigningReport && (
        <TeamAssignmentModal
          report={assigningReport}
          teams={teams}
          onClose={() => setAssigningReport(null)}
          onAssigned={() => {
            setAssigningReport(null);
            refreshAll();
          }}
        />
      )}
    </div>
  );
};
