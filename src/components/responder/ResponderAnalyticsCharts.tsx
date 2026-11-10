import React, { useMemo } from 'react';
import {
  BarChart3,
  Flame,
  HeartPulse,
  Waves,
  Car,
  Building2,
  AlertOctagon,
  Radio,
  HelpCircle,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Clock,
  Users,
  RotateCcw,
} from 'lucide-react';
import { EmergencyReport, EmergencyType, PriorityTier, ReportStatus, ResponseTeam } from '../../types/report';
import { getStoredTeams } from '../../services/mockBackend';

interface AnalyticsChartsProps {
  reports: EmergencyReport[];
  teams?: ResponseTeam[];
  selectedType: EmergencyType | 'ALL';
  onSelectType: (type: EmergencyType | 'ALL') => void;
  selectedPriority: PriorityTier | 'ALL';
  onSelectPriority: (priority: PriorityTier | 'ALL') => void;
  selectedStatus: ReportStatus | 'ALL';
  onSelectStatus: (status: ReportStatus | 'ALL') => void;
}

export const ResponderAnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  reports,
  teams: propTeams,
  selectedType,
  onSelectType,
  selectedPriority,
  onSelectPriority,
  selectedStatus,
  onSelectStatus,
}) => {
  const totalReports = reports.length;
  const teams = propTeams || getStoredTeams();

  // Key Operational Insights counts (Deliverable 6)
  const criticalCount = reports.filter((r) => r.priorityTier === 'P1').length;
  const availableTeamsCount = teams.filter((t) => t.availability === 'Available').length;
  const busyTeamsCount = teams.filter((t) => t.availability === 'Busy').length;
  const assignedCount = reports.filter(
    (r) => r.status === 'Assigned' || r.status === 'In Progress' || r.status === 'Dispatched' || Boolean(r.assignedTeamId)
  ).length;
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;

  // Criteria 1: Emergency Types distribution
  const typeDistribution = useMemo(() => {
    const counts: Record<EmergencyType, number> = {
      Fire: 0,
      Medical: 0,
      Flood: 0,
      'Road Accident': 0,
      'Building Collapse': 0,
      'Violence/Crime': 0,
      Earthquake: 0,
      Other: 0,
    };

    reports.forEach((r) => {
      if (counts[r.type] !== undefined) {
        counts[r.type]++;
      } else {
        counts['Other']++;
      }
    });

    const meta: Array<{
      type: EmergencyType;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      color: string;
      barColor: string;
      bgTrack: string;
    }> = [
      { type: 'Fire', label: 'Fire & Smoke', icon: Flame, color: 'text-red-400', barColor: 'bg-red-500', bgTrack: 'bg-red-500/10' },
      { type: 'Medical', label: 'Medical Emergency', icon: HeartPulse, color: 'text-emerald-400', barColor: 'bg-emerald-500', bgTrack: 'bg-emerald-500/10' },
      { type: 'Flood', label: 'Flood / Waterlogging', icon: Waves, color: 'text-sky-400', barColor: 'bg-sky-500', bgTrack: 'bg-sky-500/10' },
      { type: 'Road Accident', label: 'Road Accident', icon: Car, color: 'text-amber-400', barColor: 'bg-amber-500', bgTrack: 'bg-amber-500/10' },
      { type: 'Building Collapse', label: 'Building Collapse', icon: Building2, color: 'text-rose-400', barColor: 'bg-rose-500', bgTrack: 'bg-rose-500/10' },
      { type: 'Violence/Crime', label: 'Violence / Security', icon: AlertOctagon, color: 'text-purple-400', barColor: 'bg-purple-500', bgTrack: 'bg-purple-500/10' },
      { type: 'Earthquake', label: 'Earthquake / Seismic', icon: Radio, color: 'text-orange-400', barColor: 'bg-orange-500', bgTrack: 'bg-orange-500/10' },
      { type: 'Other', label: 'Other Incidents', icon: HelpCircle, color: 'text-zinc-400', barColor: 'bg-zinc-500', bgTrack: 'bg-zinc-500/10' },
    ];

    const maxCount = Math.max(...Object.values(counts), 1);

    return meta.map((m) => {
      const count = counts[m.type];
      const percentage = totalReports > 0 ? Math.round((count / totalReports) * 100) : 0;
      const relativeWidth = Math.round((count / maxCount) * 100);
      return {
        ...m,
        count,
        percentage,
        relativeWidth,
      };
    });
  }, [reports, totalReports]);

  // Criteria 2: Priority Tier / Triage scoring criteria
  const priorityDistribution = useMemo(() => {
    const counts: Record<PriorityTier, number> = {
      P1: 0,
      P2: 0,
      P3: 0,
      P4: 0,
    };

    reports.forEach((r) => {
      counts[r.priorityTier]++;
    });

    const maxCount = Math.max(...Object.values(counts), 1);

    const meta: Array<{
      tier: PriorityTier;
      name: string;
      desc: string;
      color: string;
      barColor: string;
      badgeColor: string;
    }> = [
      {
        tier: 'P1',
        name: 'Critical',
        desc: 'Score 80-100 • Immediate dispatch',
        color: 'text-red-400',
        barColor: 'bg-red-500',
        badgeColor: 'bg-red-500/10 border-red-500/40 text-red-300',
      },
      {
        tier: 'P2',
        name: 'High',
        desc: 'Score 60-79 • <10 min dispatch',
        color: 'text-orange-400',
        barColor: 'bg-orange-500',
        badgeColor: 'bg-orange-500/10 border-orange-500/40 text-orange-300',
      },
      {
        tier: 'P3',
        name: 'Medium',
        desc: 'Score 40-59 • <20 min dispatch',
        color: 'text-yellow-400',
        barColor: 'bg-yellow-500',
        badgeColor: 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300',
      },
      {
        tier: 'P4',
        name: 'Low',
        desc: 'Score 0-39 • Monitored advisory',
        color: 'text-blue-400',
        barColor: 'bg-blue-500',
        badgeColor: 'bg-blue-500/10 border-blue-500/40 text-blue-300',
      },
    ];

    return meta.map((m) => {
      const count = counts[m.tier];
      const percentage = totalReports > 0 ? Math.round((count / totalReports) * 100) : 0;
      const relativeHeight = Math.max(Math.round((count / maxCount) * 100), count > 0 ? 10 : 2);
      return {
        ...m,
        count,
        percentage,
        relativeHeight,
      };
    });
  }, [reports, totalReports]);

  // Criteria 3: Status / Dispatch workflow criteria
  const statusDistribution = useMemo(() => {
    const counts: Record<ReportStatus, number> = {
      Reported: 0,
      Received: 0,
      Verified: 0,
      Assigned: 0,
      'In Progress': 0,
      Dispatched: 0,
      Resolved: 0,
    };

    reports.forEach((r) => {
      if (counts[r.status] !== undefined) {
        counts[r.status]++;
      } else {
        counts.Received++;
      }
    });

    const combinedReceived = counts.Received + counts.Reported;
    const combinedDispatched = counts.Dispatched + counts.Assigned + counts['In Progress'];
    const maxCount = Math.max(combinedReceived, counts.Verified, combinedDispatched, counts.Resolved, 1);

    const meta: Array<{
      status: ReportStatus;
      label: string;
      desc: string;
      icon: React.ComponentType<{ className?: string }>;
      color: string;
      barColor: string;
      calculatedCount: number;
    }> = [
      {
        status: 'Received',
        label: 'Received',
        desc: 'In triage intake queue',
        icon: Clock,
        color: 'text-graphite-secondary',
        barColor: 'bg-graphite-secondary',
        calculatedCount: combinedReceived,
      },
      {
        status: 'Verified',
        label: 'Verified',
        desc: 'Coordinates confirmed',
        icon: ShieldCheck,
        color: 'text-indigo-400',
        barColor: 'bg-indigo-500',
        calculatedCount: counts.Verified,
      },
      {
        status: 'Dispatched',
        label: 'Dispatched',
        desc: 'Units en route to scene',
        icon: Truck,
        color: 'text-amber-400',
        barColor: 'bg-amber-500',
        calculatedCount: combinedDispatched,
      },
      {
        status: 'Resolved',
        label: 'Resolved',
        desc: 'Incident site secured',
        icon: CheckCircle2,
        color: 'text-emerald-400',
        barColor: 'bg-emerald-500',
        calculatedCount: counts.Resolved,
      },
    ];

    return meta.map((m) => {
      const count = m.calculatedCount;
      const percentage = totalReports > 0 ? Math.round((count / totalReports) * 100) : 0;
      const relativeWidth = Math.max(Math.round((count / maxCount) * 100), count > 0 ? 8 : 2);
      return {
        ...m,
        count,
        percentage,
        relativeWidth,
      };
    });
  }, [reports, totalReports]);

  // Criteria 4: Critical Hazards & Impact Criteria
  const hazardImpactCriteria = useMemo(() => {
    let trappedCount = 0;
    let injuriesCount = 0;
    let fireSmokeCount = 0;
    let risingWaterCount = 0;
    let structuralCount = 0;
    let gasHazmatCount = 0;
    let mediaEvidenceCount = 0;

    reports.forEach((r) => {
      if (r.trappedPersons) trappedCount++;
      if (r.injuries) injuriesCount++;
      if (r.hazards?.includes('Fire/smoke')) fireSmokeCount++;
      if (r.hazards?.includes('Rising water')) risingWaterCount++;
      if (r.hazards?.includes('Structural collapse risk')) structuralCount++;
      if (r.hazards?.includes('Gas leak') || r.hazards?.includes('Hazardous materials')) gasHazmatCount++;
      if (r.media && r.media.length > 0) mediaEvidenceCount++;
    });

    const items = [
      { label: 'Trapped Persons', count: trappedCount, color: 'bg-red-500', text: 'text-red-400' },
      { label: 'Reported Injuries / Casualties', count: injuriesCount, color: 'bg-rose-500', text: 'text-rose-400' },
      { label: 'Active Fire / Smoke Hazards', count: fireSmokeCount, color: 'bg-orange-500', text: 'text-orange-400' },
      { label: 'Rising Floodwaters', count: risingWaterCount, color: 'bg-sky-500', text: 'text-sky-400' },
      { label: 'Structural Collapse Risk', count: structuralCount, color: 'bg-amber-500', text: 'text-amber-400' },
      { label: 'Gas / Hazardous Materials', count: gasHazmatCount, color: 'bg-purple-500', text: 'text-purple-400' },
      { label: 'Photo / Voice Evidence Attached', count: mediaEvidenceCount, color: 'bg-emerald-500', text: 'text-emerald-400' },
    ];

    const maxCount = Math.max(...items.map((i) => i.count), 1);

    return items.map((i) => ({
      ...i,
      percentage: totalReports > 0 ? Math.round((i.count / totalReports) * 100) : 0,
      relativeWidth: Math.max(Math.round((i.count / maxCount) * 100), i.count > 0 ? 6 : 1),
    }));
  }, [reports, totalReports]);

  // Overall calculations
  const avgPriorityScore = useMemo(() => {
    if (reports.length === 0) return 0;
    const sum = reports.reduce((acc, r) => acc + (r.priorityScore || 0), 0);
    return Math.round(sum / reports.length);
  }, [reports]);

  const criticalRatio = useMemo(() => {
    if (reports.length === 0) return 0;
    const crit = reports.filter((r) => r.priorityTier === 'P1' || r.priorityTier === 'P2').length;
    return Math.round((crit / reports.length) * 100);
  }, [reports]);

  const activeFiltersCount =
    (selectedType !== 'ALL' ? 1 : 0) +
    (selectedPriority !== 'ALL' ? 1 : 0) +
    (selectedStatus !== 'ALL' ? 1 : 0);

  const resetAllFilters = () => {
    onSelectType('ALL');
    onSelectPriority('ALL');
    onSelectStatus('ALL');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* SECTION HEADER & CRITERIA KPI SUMMARY */}
      <div className="bg-graphite-card border border-graphite-border rounded-card p-4 sm:p-5 text-graphite-text">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-graphite-border">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-control bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <BarChart3 className="w-4 h-4 stroke-[1.75]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-medium tracking-tight text-graphite-text flex items-center space-x-2">
                <span>Criteria-Based Analytics & Triage Dashboard</span>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Live Telemetry
                </span>
              </h2>
              <p className="text-[11px] text-graphite-secondary">
                Interactive bar charts categorized by emergency type, priority scoring criteria, status, and hazard impact
              </p>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={resetAllFilters}
              className="self-start sm:self-auto flex items-center space-x-1.5 px-2.5 py-1 text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-control transition-colors"
            >
              <RotateCcw className="w-3 h-3 stroke-[1.5]" />
              <span>Clear Filter ({activeFiltersCount})</span>
            </button>
          )}
        </div>

        {/* 6 Key Operational Insights Cards (Deliverable 6) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="bg-graphite-raised/80 border border-graphite-border p-3 rounded-control">
            <span className="text-[10px] font-mono uppercase text-graphite-muted block">Total Incidents</span>
            <div className="text-xl font-mono font-bold text-graphite-text mt-0.5">{totalReports}</div>
            <span className="text-[10px] text-graphite-secondary">Chennai Telemetry</span>
          </div>

          <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-control">
            <span className="text-[10px] font-mono uppercase text-red-400 block">Critical Incidents</span>
            <div className="text-xl font-mono font-bold text-red-300 mt-0.5">{criticalCount}</div>
            <span className="text-[10px] text-red-400/80">Immediate P1 Action</span>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-control">
            <span className="text-[10px] font-mono uppercase text-emerald-400 block">Available Teams</span>
            <div className="text-xl font-mono font-bold text-emerald-300 mt-0.5">{availableTeamsCount}</div>
            <span className="text-[10px] text-emerald-400/80">Units On Standby</span>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-control">
            <span className="text-[10px] font-mono uppercase text-amber-400 block">Busy Response Teams</span>
            <div className="text-xl font-mono font-bold text-amber-300 mt-0.5">{busyTeamsCount}</div>
            <span className="text-[10px] text-amber-400/80">Deployed In Field</span>
          </div>

          <div className="bg-sky-500/10 border border-sky-500/25 p-3 rounded-control">
            <span className="text-[10px] font-mono uppercase text-sky-400 block">Assigned Incidents</span>
            <div className="text-xl font-mono font-bold text-sky-300 mt-0.5">{assignedCount}</div>
            <span className="text-[10px] text-sky-400/80">Teams Dispatched</span>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-control">
            <span className="text-[10px] font-mono uppercase text-emerald-400 block">Resolved Incidents</span>
            <div className="text-xl font-mono font-bold text-emerald-300 mt-0.5">{resolvedCount}</div>
            <span className="text-[10px] text-graphite-secondary">Case Closed</span>
          </div>
        </div>

        {/* 4 Summary Micro-KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-graphite-raised/60 border border-graphite-border p-3 rounded-control">
            <span className="text-[11px] text-graphite-muted block">Queue Load</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-mono font-medium text-graphite-text tabular-nums">{totalReports}</span>
              <span className="text-[11px] text-graphite-secondary">reports</span>
            </div>
          </div>

          <div className="bg-graphite-raised/60 border border-graphite-border p-3 rounded-control">
            <span className="text-[11px] text-graphite-muted block">Avg Priority Score</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-mono font-medium text-red-400 tabular-nums">{avgPriorityScore}</span>
              <span className="text-[11px] text-graphite-secondary">/ 100</span>
            </div>
          </div>

          <div className="bg-graphite-raised/60 border border-graphite-border p-3 rounded-control">
            <span className="text-[11px] text-graphite-muted block">High Urgency Ratio (P1/P2)</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-mono font-medium text-orange-400 tabular-nums">{criticalRatio}%</span>
              <span className="text-[11px] text-graphite-secondary">of active</span>
            </div>
          </div>

          <div className="bg-graphite-raised/60 border border-graphite-border p-3 rounded-control">
            <span className="text-[11px] text-graphite-muted block">Active Criterion Filter</span>
            <div className="mt-0.5 truncate text-xs font-medium text-emerald-400">
              {selectedType !== 'ALL'
                ? `Type: ${selectedType}`
                : selectedPriority !== 'ALL'
                ? `Tier: ${selectedPriority}`
                : selectedStatus !== 'ALL'
                ? `Status: ${selectedStatus}`
                : 'Showing All'}
            </div>
          </div>
        </div>
      </div>

      {/* DUAL MAIN CHARTS GRID: Criteria 1 (Types) & Criteria 2 (Priority Tiers) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CHART 1: Incident Types Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-graphite-card border border-graphite-border rounded-card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-graphite-text">
                Incident Classification Criteria
              </h3>
              <span className="text-[11px] text-graphite-muted font-mono">
                Click bar to filter
              </span>
            </div>
            <p className="text-[11px] text-graphite-secondary mb-4">
              Distribution of incoming emergency incidents grouped by hazard category
            </p>

            {/* Horizontal Bar Chart Rows */}
            <div className="space-y-2.5">
              {typeDistribution.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedType === item.type;

                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => onSelectType(isSelected ? 'ALL' : item.type)}
                    className={`w-full group text-left p-1.5 rounded-control transition-all duration-150 border ${
                      isSelected
                        ? 'bg-graphite-raised border-red-500/50 shadow-sm'
                        : 'border-transparent hover:border-graphite-border hover:bg-graphite-raised/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center space-x-2">
                        <IconComponent className={`w-3.5 h-3.5 ${item.color} shrink-0 stroke-[1.75]`} />
                        <span className={`font-medium ${isSelected ? 'text-white' : 'text-graphite-text'}`}>
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 font-mono text-[11px] tabular-nums">
                        <span className="text-graphite-muted">{item.percentage}%</span>
                        <span className={`font-semibold px-1.5 py-0.2 rounded ${item.bgTrack} ${item.color}`}>
                          {item.count}
                        </span>
                      </div>
                    </div>

                    {/* Bar track and animated fill */}
                    <div className="h-2 w-full bg-graphite-raised rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.barColor} rounded-full transition-all duration-300 ease-out`}
                        style={{ width: `${item.relativeWidth}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-graphite-border flex items-center justify-between text-[11px] text-graphite-muted">
            <span>Chennai 112 Unified Dispatch</span>
            <span>Total Categories: {typeDistribution.length}</span>
          </div>
        </div>

        {/* CHART 2: Priority Tier Scoring Criteria (5 cols vertical bar chart) */}
        <div className="lg:col-span-5 bg-graphite-card border border-graphite-border rounded-card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-graphite-text">
                Priority Scoring Criteria
              </h3>
              <span className="text-[11px] text-graphite-muted font-mono">
                Click bar to filter
              </span>
            </div>
            <p className="text-[11px] text-graphite-secondary mb-4">
              Automated telemetry triage score bands determining response urgency
            </p>

            {/* Vertical Bar Chart */}
            <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-graphite-border">
              {priorityDistribution.map((item) => {
                const isSelected = selectedPriority === item.tier;

                return (
                  <button
                    key={item.tier}
                    type="button"
                    onClick={() => onSelectPriority(isSelected ? 'ALL' : item.tier)}
                    className="flex-1 h-full flex flex-col justify-end items-center group focus:outline-none"
                    title={`${item.tier} (${item.name}): ${item.count} reports (${item.percentage}%)`}
                  >
                    {/* Count Label on top of bar */}
                    <span
                      className={`text-[11px] font-mono font-medium tabular-nums mb-1 transition-colors ${
                        isSelected ? item.color : 'text-graphite-secondary group-hover:text-graphite-text'
                      }`}
                    >
                      {item.count}
                    </span>

                    {/* Bar Container */}
                    <div className="w-full max-w-[42px] h-full bg-graphite-raised rounded-t flex items-end p-0.5 overflow-hidden">
                      <div
                        className={`w-full ${item.barColor} rounded-t transition-all duration-300 ease-out ${
                          isSelected ? 'ring-2 ring-white/60 brightness-110' : 'opacity-85 group-hover:opacity-100'
                        }`}
                        style={{ height: `${item.relativeHeight}%` }}
                      />
                    </div>

                    {/* Bottom Tier Code */}
                    <div className="mt-2 text-center">
                      <span
                        className={`block text-xs font-mono font-semibold px-1.5 py-0.5 rounded border transition-colors ${
                          isSelected
                            ? item.badgeColor
                            : 'bg-graphite-raised border-graphite-border text-graphite-text group-hover:border-graphite-border-strong'
                        }`}
                      >
                        {item.tier}
                      </span>
                      <span className="block text-[10px] text-graphite-muted mt-0.5">{item.percentage}%</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tier Legend & Description */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {priorityDistribution.map((item) => (
                <div key={item.tier} className="text-[11px] p-1.5 rounded bg-graphite-raised/40 border border-graphite-border">
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${item.barColor}`} />
                    <span className="font-medium text-graphite-text">{item.tier} - {item.name}</span>
                  </div>
                  <span className="text-[10px] text-graphite-muted block mt-0.5">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-graphite-border text-[11px] text-graphite-muted flex items-center justify-between">
            <span>Algorithm: TNSDMA Triage Matrix</span>
            <span className="font-mono text-[10px]">Max Score: 100</span>
          </div>
        </div>
      </div>

      {/* DUAL SECONDARY CHARTS GRID: Criteria 3 (Lifecycle Status) & Criteria 4 (Hazards/Casualties) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CHART 3: Lifecycle Status Criteria Bar Chart (6 cols) */}
        <div className="lg:col-span-6 bg-graphite-card border border-graphite-border rounded-card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-graphite-text">
                Dispatch Lifecycle Status
              </h3>
              <span className="text-[11px] text-graphite-muted font-mono">
                Click bar to filter
              </span>
            </div>
            <p className="text-[11px] text-graphite-secondary mb-4">
              Progress of emergency reports through verification and first responder dispatch
            </p>

            <div className="space-y-3">
              {statusDistribution.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedStatus === item.status;

                return (
                  <button
                    key={item.status}
                    type="button"
                    onClick={() => onSelectStatus(isSelected ? 'ALL' : item.status)}
                    className={`w-full group text-left p-2 rounded-control border transition-all duration-150 ${
                      isSelected
                        ? 'bg-graphite-raised border-emerald-500/50 shadow-sm'
                        : 'border-transparent hover:border-graphite-border hover:bg-graphite-raised/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center space-x-2">
                        <IconComponent className={`w-3.5 h-3.5 ${item.color} stroke-[1.75]`} />
                        <span className={`font-medium ${isSelected ? 'text-white' : 'text-graphite-text'}`}>
                          {item.label}
                        </span>
                        <span className="text-[10px] text-graphite-muted hidden sm:inline">({item.desc})</span>
                      </div>
                      <div className="flex items-center space-x-2 font-mono text-[11px] tabular-nums">
                        <span className="text-graphite-muted">{item.percentage}%</span>
                        <span className="font-semibold text-graphite-text bg-graphite-raised px-1.5 py-0.5 rounded border border-graphite-border">
                          {item.count}
                        </span>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-graphite-raised rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.barColor} rounded-full transition-all duration-300 ease-out`}
                        style={{ width: `${item.relativeWidth}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-graphite-border text-[11px] text-graphite-muted flex items-center justify-between">
            <span>SOP: Tamil Nadu 108 & TNFRS</span>
            <span>Queue: {totalReports} Total</span>
          </div>
        </div>

        {/* CHART 4: Critical Hazards & Risk Multipliers Criteria (6 cols) */}
        <div className="lg:col-span-6 bg-graphite-card border border-graphite-border rounded-card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-graphite-text">
                Hazard & Casualty Criteria Multipliers
              </h3>
              <span className="text-[11px] text-graphite-muted font-mono">
                Triage Weights
              </span>
            </div>
            <p className="text-[11px] text-graphite-secondary mb-4">
              Specific risk variables detected in incident telemetry that elevate priority score
            </p>

            <div className="space-y-2.5">
              {hazardImpactCriteria.map((item) => (
                <div key={item.label} className="p-1 rounded">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-graphite-text text-xs">{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono text-[11px] tabular-nums">
                      <span className="text-graphite-muted">{item.percentage}%</span>
                      <span className={`font-medium ${item.text}`}>{item.count}</span>
                    </div>
                  </div>

                  <div className="h-1.5 w-full bg-graphite-raised rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-300 ease-out`}
                      style={{ width: `${item.relativeWidth}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-graphite-border text-[11px] text-graphite-muted flex items-center justify-between">
            <span>Chennai District Hazard Registry</span>
            <span className="flex items-center space-x-1">
              <Users className="w-3 h-3 text-red-400 stroke-[1.5]" />
              <span>Casualty-Weighted</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
