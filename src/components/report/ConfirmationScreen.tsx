import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  CheckCheck,
  WifiOff,
  PhoneCall,
  ArrowRight,
  Copy,
  Check,
  Info,
  Building2,
  Radio,
  AlertTriangle,
} from 'lucide-react';
import { EmergencyReport, ReportStatus, DepartmentDispatch, AreaAdvisory } from '../../types/report';
import { useI18n } from '../../i18n';
import { subscribeToRealtimeReports, updateReportStatus } from '../../services/mockBackend';
import { getStoredDispatches, getStoredAdvisories } from '../../services/departmentRouter';
import { getFirstAidGuidance } from '../../utils/firstAidEngine';

interface ConfirmationScreenProps {
  report: EmergencyReport;
  onNewReport: () => void;
  onOpenResponder: () => void;
  duplicateWarning?: string;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  report: initialReport,
  onNewReport,
  onOpenResponder,
  duplicateWarning,
}) => {
  const { t } = useI18n();
  const [report, setReport] = useState<EmergencyReport>(initialReport);
  const [copied, setCopied] = useState(false);
  const [dispatches, setDispatches] = useState<DepartmentDispatch[]>([]);
  const [areaAdvisories, setAreaAdvisories] = useState<AreaAdvisory[]>([]);

  const refreshData = () => {
    const allDispatches = getStoredDispatches().filter(
      (d) => d.incidentId === report.id || d.trackingId === report.trackingId
    );
    setDispatches(allDispatches);

    const allAdvisories = getStoredAdvisories().filter(
      (a) =>
        a.area?.toLowerCase() === report.area?.toLowerCase() ||
        a.trackingId === report.trackingId ||
        a.incidentId === report.id
    );
    setAreaAdvisories(allAdvisories);
  };

  useEffect(() => {
    refreshData();
  }, [report.id, report.trackingId, report.area]);

  useEffect(() => {
    // Listen for live status changes on this report
    const unsubscribe = subscribeToRealtimeReports((event) => {
      if (event.type === 'STATUS_UPDATED' && event.reportId === report.id) {
        setReport((prev) => ({
          ...prev,
          status: event.status,
          updatedAt: event.updatedAt,
        }));
      }
      refreshData();
    });

    return () => unsubscribe();
  }, [report.id]);

  const stages: Array<{
    status: ReportStatus;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      status: 'Received',
      title: t('statusReceived'),
      description: 'Report logged into Tamil Nadu 112 & Greater Chennai Corporation dispatch queue',
      icon: Clock,
    },
    {
      status: 'Verified',
      title: t('statusVerified'),
      description: 'Triage officer confirmed coordinates & assigned nearest Chennai division',
      icon: ShieldCheck,
    },
    {
      status: 'Dispatched',
      title: t('statusDispatched'),
      description: '108 Emergency Ambulance / TNFRS rescue units en route to scene',
      icon: Truck,
    },
    {
      status: 'Resolved',
      title: t('statusResolved'),
      description: 'Incident area secured and resolved by responders',
      icon: CheckCheck,
    },
  ];

  const getNormalizedStageIndex = (st: ReportStatus): number => {
    switch (st) {
      case 'Reported':
      case 'Received':
        return 0;
      case 'Verified':
      case 'Assigned':
      case 'Pending':
        return 1;
      case 'Dispatched':
      case 'In Progress':
        return 2;
      case 'Resolved':
        return 3;
      default:
        return 0;
    }
  };

  const currentStageIndex = getNormalizedStageIndex(report.status);

  const simulateNextStep = () => {
    const nextStages: Record<ReportStatus, ReportStatus> = {
      Reported: 'Pending',
      Pending: 'In Progress',
      Received: 'Verified',
      Verified: 'In Progress',
      Assigned: 'In Progress',
      Dispatched: 'Resolved',
      'In Progress': 'Resolved',
      Resolved: 'Resolved',
    };
    const nextStatus = nextStages[report.status] || 'Resolved';
    updateReportStatus(report.id, nextStatus);
  };

  const copyTrackingId = () => {
    const textToCopy = report.trackingId || report.id;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const safetyGuidance = getFirstAidGuidance(report.type);

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in py-2 pb-12">
      {/* Confirmation header card with Tracking ID */}
      <div className="bg-graphite-card border border-graphite-border rounded-card p-5 sm:p-6 text-center space-y-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-graphite-raised border border-graphite-border text-emerald-400">
          <CheckCircle2 className="w-5 h-5 stroke-[1.75]" />
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-medium text-graphite-text">
            {t('reportSubmittedTitle')}
          </h2>
          <p className="text-xs text-graphite-secondary mt-1">
            Dispatch triage has received your emergency telemetry
          </p>
          <div className="flex items-center justify-center space-x-2 text-[11px] text-graphite-muted mt-2">
            <img src="/tamilnadu-logo.svg" alt="Tamil Nadu Government" className="w-4 h-4 object-contain shrink-0" />
            <span>Tamil Nadu State Emergency Centre • GCC 112 Dispatch</span>
          </div>
        </div>

        {/* Section 4: Tracking ID & Report ID pill with Copy */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <div className="inline-flex items-center space-x-2 bg-sky-500/10 border border-sky-500/30 px-3.5 py-1.5 rounded-control">
            <span className="text-[11px] text-sky-300 font-semibold uppercase">Tracking ID:</span>
            <span className="text-sm font-mono tabular-nums text-white font-bold">
              {report.trackingId || report.id}
            </span>
            <button
              onClick={copyTrackingId}
              className="text-[11px] text-sky-300 hover:text-white flex items-center space-x-1 pl-1.5 border-l border-sky-500/30"
              title="Copy Tracking ID"
            >
              {copied ? <Check className="w-3 h-3 stroke-[2] text-emerald-400" /> : <Copy className="w-3 h-3 stroke-[1.5]" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <span className="text-xs text-graphite-muted font-mono bg-graphite-raised px-2 py-1 rounded border border-graphite-border">
            Report ID: #{report.id}
          </span>
          <span className="text-[11px] text-graphite-muted">Save this code to track live responder ETAs</span>
        </div>

        {/* Section 2: Explainable Severity Line */}
        {report.severityExplanation && (
          <div className="p-2.5 bg-graphite-raised border border-graphite-border rounded-control text-xs flex items-center justify-center space-x-2 text-graphite-secondary">
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              <strong className="text-graphite-text">Why this severity? </strong>
              {report.severityExplanation}
            </span>
          </div>
        )}

        {report.syncStatus === 'pending' && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-control text-amber-200 text-xs flex items-center justify-center space-x-2">
            <WifiOff className="w-3.5 h-3.5 shrink-0 stroke-[1.5]" />
            <span>{t('queuedOfflineNotice')}</span>
          </div>
        )}

        {duplicateWarning && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-control text-amber-200 text-xs flex items-start space-x-2 text-left">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400 stroke-[1.5]" />
            <span>{duplicateWarning}</span>
          </div>
        )}
      </div>

      {/* Section 3 Reporter Side: Auto-Forwarded Departments & Status */}
      <div className="bg-graphite-card border border-graphite-border rounded-card p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-graphite-border pb-2.5">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-semibold text-graphite-text">
              Targeted Department Forwarding & Status ({dispatches.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Auto-Forwarded to Sector: {report.area || 'Chennai'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {dispatches.map((disp) => (
            <div
              key={disp.id}
              className="p-3 bg-graphite-deep rounded border border-graphite-border space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-graphite-text">{disp.department}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    disp.status === 'Responding'
                      ? 'bg-sky-500/10 text-sky-300 border border-sky-500/30'
                      : disp.status === 'Resolved'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : 'bg-graphite-raised text-graphite-secondary border border-graphite-border'
                  }`}
                >
                  {disp.status}
                </span>
              </div>
              <div className="text-[11px] text-graphite-muted flex items-center justify-between">
                <span>ETA: <strong className="text-graphite-text">{disp.eta || 'Evaluating'}</strong></span>
                <span>Area: {disp.area}</span>
              </div>
              {disp.responseMessage && (
                <p className="text-[11px] text-graphite-secondary italic pt-1 border-t border-graphite-border/60">
                  "{disp.responseMessage}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Live Area Advisory Feed */}
      {areaAdvisories.length > 0 && (
        <div className="bg-graphite-card border border-graphite-border rounded-card p-4 space-y-2.5">
          <div className="flex items-center space-x-2 text-xs">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="font-semibold text-graphite-text">
              Live Area Advisory Feed: {report.area || 'Chennai Sector'}
            </span>
          </div>
          <div className="space-y-1.5">
            {areaAdvisories.map((adv) => (
              <div
                key={adv.id}
                className="p-2.5 bg-graphite-deep rounded border border-graphite-border text-xs space-y-0.5"
              >
                <div className="flex items-center justify-between text-[10px] text-graphite-muted">
                  <span className="font-bold text-sky-400">{adv.department}</span>
                  <span className="font-mono">
                    {new Date(adv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-graphite-text text-xs">"{adv.message}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIVE DISPATCH TIMELINE */}
      <div className="bg-graphite-card border border-graphite-border rounded-card p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-graphite-text">
            Live Response Status
          </h3>
          <span className="text-[11px] font-mono tabular-nums text-graphite-muted">
            Updated {new Date(report.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <div className="relative pl-7 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-graphite-border">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const StageIcon = stage.icon;

            return (
              <div key={stage.status} className="relative flex items-start space-x-3">
                <div
                  className={`absolute -left-[23px] w-5 h-5 rounded-full flex items-center justify-center border transition-colors duration-150 ${
                    isCompleted
                      ? 'bg-graphite-surface border-graphite-border-strong text-graphite-text'
                      : isCurrent
                      ? 'bg-emergency-accent border-white/20 text-white'
                      : 'bg-graphite-deep border-graphite-border text-graphite-muted'
                  }`}
                >
                  <StageIcon className="w-2.5 h-2.5 stroke-[2]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs font-medium ${
                        isCurrent
                          ? 'text-graphite-text font-semibold'
                          : isCompleted
                          ? 'text-graphite-secondary'
                          : 'text-graphite-muted'
                      }`}
                    >
                      {stage.title}
                    </span>
                    {isCurrent && (
                      <span className="bg-graphite-raised border border-graphite-border text-[10px] text-emergency-accent px-1.5 py-0.2 rounded font-mono">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-graphite-muted mt-0.5">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Demo simulator trigger */}
        <div className="pt-3 border-t border-graphite-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <span className="text-[11px] text-graphite-muted">
            Simulation tool: advance incident status
          </span>
          <button
            type="button"
            onClick={simulateNextStep}
            disabled={report.status === 'Resolved'}
            className="h-8 px-3 bg-graphite-raised hover:bg-sky-500/5 hover:border-sky-500/40 border border-graphite-border text-graphite-secondary hover:text-sky-300 rounded-control text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors duration-150 disabled:opacity-40"
          >
            <span>Advance Status</span>
            <ArrowRight className="w-3 h-3 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* Section 7: Instant Safety Guidance */}
      {safetyGuidance && (
        <div className="bg-graphite-card border border-graphite-border rounded-card p-5 space-y-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-graphite-text uppercase tracking-wider">
              Instant Safety Guidance: {report.type}
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded space-y-1">
              <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase">
                DO's
              </span>
              <ul className="space-y-1 text-graphite-secondary text-[11px]">
                {safetyGuidance.steps.slice(0, 3).map((s, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="text-emerald-400">✓</span>
                    <span>{s.instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded space-y-1">
              <span className="font-mono text-[10px] font-bold text-red-400 uppercase">
                DON'Ts
              </span>
              <ul className="space-y-1 text-red-300 text-[11px]">
                {safetyGuidance.doNot.slice(0, 3).map((d, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="text-red-400">✕</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Safety instructions */}
      <div className="bg-graphite-card border border-graphite-border rounded-card p-4 text-xs flex items-start space-x-3">
        <PhoneCall className="w-4 h-4 text-emergency-accent shrink-0 mt-0.5 stroke-[1.75]" />
        <div className="space-y-0.5">
          <p className="font-medium text-graphite-text">Keep phone line open & stay in a safe position</p>
          <p className="text-[11px] text-graphite-secondary">
            Stay clear of waterlogged roads, loose electric cables, and open transformers. Greater Chennai Corporation (GCC) & 108 Emergency Response units have received your coordinates.
          </p>
        </div>
      </div>

      {/* Action footer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
        <button
          onClick={onNewReport}
          className="h-11 px-4 bg-graphite-raised hover:bg-graphite-surface active:bg-graphite-card text-graphite-text font-medium rounded-control transition-colors duration-150 text-xs sm:text-sm border border-graphite-border hover:border-graphite-border-strong flex items-center justify-center space-x-2"
        >
          <span>{t('backToHome')}</span>
        </button>

        <button
          onClick={onOpenResponder}
          className="h-11 px-4 bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/5 text-blue-200 hover:text-white font-medium rounded-control border border-blue-500/30 hover:border-blue-500/50 transition-colors duration-150 text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm"
        >
          <span>Open Responder Command</span>
          <ArrowRight className="w-4 h-4 stroke-[1.5]" />
        </button>
      </div>
    </div>
  );
};
