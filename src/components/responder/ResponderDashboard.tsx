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
} from 'lucide-react';
import { EmergencyReport, EmergencyType, PriorityTier, ReportStatus } from '../../types/report';
import { getStoredReports, subscribeToRealtimeReports } from '../../services/mockBackend';
import { ResponderMap } from './ResponderMap';
import { ReportDetailModal } from './ReportDetailModal';
import { ResponderAnalyticsCharts } from './ResponderAnalyticsCharts';
import { useI18n } from '../../i18n';

export const ResponderDashboard: React.FC = () => {
  const { t } = useI18n();
  const [reports, setReports] = useState<EmergencyReport[]>(() => getStoredReports());
  const [selectedReport, setSelectedReport] = useState<EmergencyReport | null>(null);

  // Filters & View state
  const [typeFilter, setTypeFilter] = useState<EmergencyType | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<PriorityTier | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map' | 'analytics'>('split');
  const [showDashboardCharts, setShowDashboardCharts] = useState(true);
  const [newReportAlert, setNewReportAlert] = useState<EmergencyReport | null>(null);

  const refreshReports = () => {
    setReports(getStoredReports());
  };

  useEffect(() => {
    const unsubscribe = subscribeToRealtimeReports((event) => {
      refreshReports();

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
    P1: 'bg-emergency-subtle text-emergency-accent border-emergency-border',
    P2: 'bg-orange-500/10 text-orange-300 border-orange-500/25',
    P3: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/25',
    P4: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
  };

  const priorityHovers: Record<PriorityTier, string> = {
    P1: 'hover:border-red-500/40 hover:bg-red-500/5',
    P2: 'hover:border-orange-500/40 hover:bg-orange-500/5',
    P3: 'hover:border-yellow-500/40 hover:bg-yellow-500/5',
    P4: 'hover:border-blue-500/40 hover:bg-blue-500/5',
  };

  const statusBadges: Record<ReportStatus, string> = {
    Received: 'bg-graphite-raised text-graphite-secondary border-graphite-border',
    Verified: 'bg-graphite-surface text-graphite-text border-graphite-border-strong',
    Dispatched: 'bg-emergency-subtle text-emergency-accent border-emergency-border',
    Resolved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      {/* INCOMING DISPATCH TOAST NOTIFICATION */}
      {newReportAlert && (
        <div className="bg-graphite-card border border-emergency-border p-3.5 rounded-card flex items-center justify-between text-graphite-text shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-emergency-subtle flex items-center justify-center text-emergency-accent">
              <Bell className="w-4 h-4 stroke-[1.75]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[11px] text-emergency-accent bg-emergency-subtle px-1.5 py-0.5 rounded border border-emergency-border">
                  Incoming {newReportAlert.priorityTier} Alert
                </span>
                <span className="text-xs font-medium text-graphite-text">{newReportAlert.type}</span>
              </div>
              <span className="text-[11px] text-graphite-muted block mt-0.5">
                {newReportAlert.address || 'GPS Telemetry Coordinates'}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedReport(newReportAlert);
              setNewReportAlert(null);
            }}
            className="h-8 px-3 bg-graphite-raised hover:bg-graphite-surface border border-graphite-border text-graphite-text font-medium rounded-control text-xs transition-colors duration-150"
          >
            Triage Incident
          </button>
        </div>
      )}

      {/* HEADER & METRIC SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-medium text-graphite-text flex items-center space-x-2">
            <img src="/tamilnadu-logo.svg" alt="Tamil Nadu Government" className="w-5 h-5 object-contain shrink-0" />
            <span>{t('responderDashboardTitle')}</span>
            <span className="font-mono text-[10px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25 font-normal">
              TN-GCC
            </span>
          </h1>
          <p className="text-xs text-graphite-secondary mt-0.5">
            Tamil Nadu 112 & Greater Chennai Corporation dispatch queue, priority triage, and telemetry
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <div className="bg-graphite-card border border-graphite-border p-0.5 rounded-control flex">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium flex items-center space-x-1.5 transition-colors duration-150 ${
                viewMode === 'split' ? 'bg-graphite-raised text-graphite-text border border-graphite-border-strong' : 'text-graphite-secondary hover:text-graphite-text'
              }`}
              title="Split View"
            >
              <LayoutGrid className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium flex items-center space-x-1.5 transition-colors duration-150 ${
                viewMode === 'list' ? 'bg-graphite-raised text-graphite-text border border-graphite-border-strong' : 'text-graphite-secondary hover:text-graphite-text'
              }`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium flex items-center space-x-1.5 transition-colors duration-150 ${
                viewMode === 'map' ? 'bg-graphite-raised text-graphite-text border border-graphite-border-strong' : 'text-graphite-secondary hover:text-graphite-text'
              }`}
              title="Map View"
            >
              <MapIcon className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="hidden sm:inline">Map</span>
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
            onClick={refreshReports}
            className="p-2 bg-graphite-card hover:bg-sky-500/5 border border-graphite-border hover:border-sky-500/40 text-graphite-secondary hover:text-sky-300 rounded-control transition-colors duration-150"
            title="Refresh queue"
            aria-label="Refresh queue"
          >
            <RefreshCw className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* METRIC KPI TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="bg-graphite-card border border-graphite-border p-3 rounded-card">
          <span className="text-[11px] text-graphite-muted block">Total active</span>
          <span className="text-xl font-mono tabular-nums font-medium text-graphite-text block mt-1">{totalCount}</span>
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
          <span className="text-[11px] text-red-400 block font-medium">P1 Critical</span>
          <span className="text-xl font-mono tabular-nums font-medium text-graphite-text block mt-1">{p1Count}</span>
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
          <span className="text-[11px] text-orange-300 block font-medium">P2 High</span>
          <span className="text-xl font-mono tabular-nums font-medium text-graphite-text block mt-1">{p2Count}</span>
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
          <span className="text-[11px] text-yellow-300 block font-medium">P3 Medium</span>
          <span className="text-xl font-mono tabular-nums font-medium text-graphite-text block mt-1">{p3Count}</span>
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
          <span className="text-[11px] text-blue-300 block font-medium">P4 Low</span>
          <span className="text-xl font-mono tabular-nums font-medium text-graphite-text block mt-1">{p4Count}</span>
        </button>
      </div>

      {/* FILTER CONTROLS BAR & CHARTS TOGGLE */}
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
            <option value="ALL">All priority tiers</option>
            <option value="P1">P1 - Critical (≥75)</option>
            <option value="P2">P2 - High (50-74)</option>
            <option value="P3">P3 - Medium (25-49)</option>
            <option value="P4">P4 - Low (&lt;25)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-graphite-raised border border-graphite-border text-xs rounded-control px-2.5 py-1.5 text-graphite-text focus:outline-none focus:border-graphite-border-strong"
          >
            <option value="ALL">All statuses</option>
            <option value="Received">Received</option>
            <option value="Verified">Verified</option>
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
              className="text-xs text-graphite-secondary hover:text-graphite-text underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Quick Criteria Charts Toggle Button */}
        {viewMode !== 'analytics' && (
          <button
            type="button"
            onClick={() => setShowDashboardCharts((prev) => !prev)}
            className={`px-3 py-1.5 rounded-control text-xs font-medium flex items-center space-x-1.5 transition-colors duration-150 border ${
              showDashboardCharts
                ? 'bg-red-500/10 text-red-300 border-red-500/40 shadow-sm'
                : 'bg-graphite-raised text-graphite-secondary hover:text-graphite-text border-graphite-border hover:border-graphite-border-strong'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>{showDashboardCharts ? 'Hide Criteria Charts' : 'Criteria Bar Charts'}</span>
            {showDashboardCharts ? (
              <ChevronUp className="w-3 h-3 stroke-[1.5]" />
            ) : (
              <ChevronDown className="w-3 h-3 stroke-[1.5]" />
            )}
          </button>
        )}
      </div>

      {/* CRITERIA BAR CHARTS DASHBOARD SECTION */}
      {(showDashboardCharts || viewMode === 'analytics') && (
        <ResponderAnalyticsCharts
          reports={reports}
          selectedType={typeFilter}
          onSelectType={setTypeFilter}
          selectedPriority={priorityFilter}
          onSelectPriority={setPriorityFilter}
          selectedStatus={statusFilter}
          onSelectStatus={setStatusFilter}
        />
      )}

      {/* IN ANALYTICS VIEW: MATCHING FILTERED INCIDENTS TABLE */}
      {viewMode === 'analytics' && (
        <div className="bg-graphite-card border border-graphite-border rounded-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-graphite-text">
                Matching Incidents ({filteredReports.length} reports)
              </h3>
              <p className="text-[11px] text-graphite-secondary">
                Filtered by active criteria selected in the bar charts above
              </p>
            </div>
            <button
              onClick={() => setViewMode('split')}
              className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center space-x-1"
            >
              <span>View on Map & List</span>
              <LayoutGrid className="w-3 h-3 stroke-[1.5]" />
            </button>
          </div>

          {filteredReports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-graphite-border text-graphite-muted text-[11px]">
                    <th className="py-2 px-3">Report ID</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Priority</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Address / Landmark</th>
                    <th className="py-2 px-3">Casualties</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-graphite-border">
                  {filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="hover:bg-graphite-raised/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-medium text-graphite-text">
                        {report.id}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-graphite-text">{report.type}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${priorityBadges[report.priorityTier]}`}>
                          {report.priorityTier} ({report.priorityScore})
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${statusBadges[report.status]}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-[220px] truncate text-graphite-secondary">
                        {report.address || 'GPS Coordinates'}
                      </td>
                      <td className="py-2.5 px-3">
                        {report.injuries ? (
                          <span className="text-red-400 font-medium">Injuries</span>
                        ) : report.trappedPersons ? (
                          <span className="text-red-400 font-medium">Trapped</span>
                        ) : (
                          <span className="text-graphite-muted">None</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReport(report);
                          }}
                          className="px-2 py-1 bg-graphite-raised hover:bg-graphite-surface border border-graphite-border text-[11px] font-medium rounded text-graphite-text"
                        >
                          Triage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-graphite-muted text-xs bg-graphite-raised/30 rounded-control">
              No reports match the selected criteria filter.
            </div>
          )}
        </div>
      )}

      {/* MAIN CONTENT WORKSPACE: LIST & MAP */}
      {viewMode !== 'analytics' && (
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
              <span>Sorted by priority score</span>
            </div>

            {filteredReports.length > 0 ? (
              <div className="space-y-2 overflow-y-auto max-h-[660px] pr-1">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`cursor-pointer bg-graphite-card border border-graphite-border ${priorityHovers[report.priorityTier]} p-3.5 rounded-control transition-colors duration-150 space-y-2.5 group`}
                  >
                    {/* Top Row: Type, Priority, Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums border ${
                            priorityBadges[report.priorityTier]
                          }`}
                        >
                          {report.priorityTier} {report.priorityScore}
                        </span>
                        <span className="font-medium text-xs text-graphite-text group-hover:text-emergency-accent transition-colors">
                          {report.type}
                        </span>
                        <span className="font-mono text-[11px] text-graphite-muted">#{report.id}</span>
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
                          <span>{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-graphite-card border border-graphite-border rounded-control p-8 text-center text-graphite-muted text-xs">
                No incidents match active filters
              </div>
            )}
          </div>
        )}

        {/* MAP VIEW */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div
            className={`min-h-[420px] ${
              viewMode === 'split' ? 'lg:col-span-6 h-[660px]' : 'col-span-1 h-[620px]'
            }`}
          >
            <ResponderMap
              reports={filteredReports}
              onSelectReport={(rep) => setSelectedReport(rep)}
            />
          </div>
        )}
      </div>
      )}

      {/* DETAIL INSPECTION MODAL */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdated={refreshReports}
        />
      )}
    </div>
  );
};
