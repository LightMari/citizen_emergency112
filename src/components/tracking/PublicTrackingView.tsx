import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  CheckCircle2,
  Building2,
  Radio,
  AlertTriangle,
  Flame,
  HeartPulse,
  Waves,
  Car,
  LifeBuoy,
  RefreshCw,
  Info,
} from 'lucide-react';
import { EmergencyReport, DepartmentDispatch, AreaAdvisory } from '../../types/report';
import { getStoredReports, subscribeToRealtimeReports } from '../../services/mockBackend';
import { getStoredDispatches, getStoredAdvisories } from '../../services/departmentRouter';
import { getFirstAidGuidance } from '../../utils/firstAidEngine';

interface PublicTrackingViewProps {
  initialTrackingId?: string;
}

export const PublicTrackingView: React.FC<PublicTrackingViewProps> = ({ initialTrackingId = '' }) => {
  const [searchInput, setSearchInput] = useState(initialTrackingId || 'EMG-1001');
  const [activeIncident, setActiveIncident] = useState<EmergencyReport | null>(null);
  const [incidentDispatches, setIncidentDispatches] = useState<DepartmentDispatch[]>([]);
  const [areaAdvisories, setAreaAdvisories] = useState<AreaAdvisory[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const lookupReport = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    const allReports = getStoredReports();
    const found = allReports.find(
      (r) => r.trackingId?.toUpperCase() === trimmed || r.id.toUpperCase() === trimmed
    );

    if (found) {
      setActiveIncident(found);
      const dispatches = getStoredDispatches().filter(
        (d) => d.trackingId?.toUpperCase() === trimmed || d.incidentId === found.id
      );
      setIncidentDispatches(dispatches);

      const advisories = getStoredAdvisories().filter(
        (a) => a.area?.toLowerCase() === found.area?.toLowerCase() || a.trackingId?.toUpperCase() === trimmed
      );
      setAreaAdvisories(advisories);
    } else {
      setActiveIncident(null);
      setIncidentDispatches([]);
      setAreaAdvisories([]);
    }
  };

  useEffect(() => {
    lookupReport(searchInput);
  }, [searchInput]);

  // Section 4: Poll every 5 seconds for live status updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (searchInput.trim()) {
        lookupReport(searchInput);
      }
    }, 5000);

    const unsubscribe = subscribeToRealtimeReports(() => {
      if (searchInput.trim()) {
        lookupReport(searchInput);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [searchInput]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    lookupReport(searchInput);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getDepartmentIcon = (dept: string) => {
    switch (dept) {
      case 'Fire & Rescue':
        return <Flame className="w-4 h-4 text-red-400" />;
      case 'Ambulance':
        return <HeartPulse className="w-4 h-4 text-emerald-400" />;
      case 'Disaster Management':
        return <Waves className="w-4 h-4 text-sky-400" />;
      case 'Traffic Police':
        return <Car className="w-4 h-4 text-amber-400" />;
      case 'Rescue Team':
        return <LifeBuoy className="w-4 h-4 text-purple-400" />;
      default:
        return <Building2 className="w-4 h-4 text-blue-400" />;
    }
  };

  // Section 7: Instant Safety Guidance
  const safetyGuidance = activeIncident ? getFirstAidGuidance(activeIncident.type) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Search Header */}
      <div className="bg-graphite-card border border-graphite-border rounded-panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-graphite-text">
              Public Incident Tracking & Department Advisory
            </h1>
            <p className="text-xs text-graphite-secondary">
              Track multi-department responses, live ETAs, and area broadcast alerts using your Tracking ID
            </p>
          </div>
          <button
            onClick={handleManualRefresh}
            className="p-2 bg-graphite-raised hover:bg-graphite-surface border border-graphite-border rounded-control text-graphite-muted hover:text-graphite-text"
            title="Refresh status now (auto-polls every 5s)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Input box */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-graphite-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Tracking ID (e.g. EMG-1001)..."
              className="w-full bg-graphite-deep border border-graphite-border rounded-control pl-9 pr-3 py-2 text-sm text-graphite-text font-mono font-medium placeholder:text-graphite-muted focus:outline-none focus:border-graphite-border-strong"
            />
          </div>
          <button
            onClick={() => lookupReport(searchInput)}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-control text-xs font-semibold"
          >
            Track Status
          </button>
        </div>

        {/* Quick demo pills */}
        <div className="flex items-center space-x-2 text-xs text-graphite-muted pt-1">
          <span>Demo Tracking IDs:</span>
          {['EMG-1001', 'EMG-1002', 'EMG-1003', 'EMG-1004'].map((code) => (
            <button
              key={code}
              onClick={() => setSearchInput(code)}
              className="font-mono text-[11px] px-2 py-0.5 rounded bg-graphite-raised hover:bg-graphite-surface border border-graphite-border text-graphite-text"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {activeIncident ? (
        <div className="space-y-6">
          {/* Incident Overview Card */}
          <div className="bg-graphite-card border border-graphite-border rounded-panel p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-graphite-border pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-bold text-sky-400">
                    #{activeIncident.trackingId}
                  </span>
                  <h2 className="text-base font-semibold text-graphite-text">
                    {activeIncident.title || activeIncident.type}
                  </h2>
                </div>
                <div className="flex items-center space-x-2 text-xs text-graphite-muted mt-0.5">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-red-400" />
                    <span>Area: <strong>{activeIncident.area}</strong></span>
                  </span>
                  <span>•</span>
                  <span>Category: {activeIncident.category || activeIncident.type}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                  {activeIncident.severity} Severity
                </span>
                <span className="px-2.5 py-1 rounded text-xs font-mono bg-sky-500/10 text-sky-300 border border-sky-500/30">
                  Status: {activeIncident.status}
                </span>
              </div>
            </div>

            {/* Explainable severity line (Deliverable 2) */}
            {activeIncident.severityExplanation && (
              <div className="p-3 bg-graphite-deep rounded border border-graphite-border text-xs flex items-center space-x-2 text-graphite-secondary">
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  <strong className="text-graphite-text">Why this severity? </strong>
                  {activeIncident.severityExplanation}
                </span>
              </div>
            )}

            {/* Status History Timeline */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-mono uppercase text-graphite-muted block">
                Live Status Progression Timeline
              </span>
              <div className="flex flex-col space-y-2 border-l border-graphite-border pl-4 ml-2">
                {activeIncident.statusHistory?.map((step, i) => (
                  <div key={i} className="relative text-xs">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-400 border border-white" />
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-graphite-text">{step.status}</span>
                      <span className="text-[10px] font-mono text-graphite-muted">
                        {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {step.note && <p className="text-[11px] text-graphite-secondary mt-0.5">{step.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Per-Department Status, ETA & Replies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-graphite-muted px-1">
              <span className="font-semibold text-graphite-text">
                Assigned Emergency Departments ({incidentDispatches.length})
              </span>
              <span>Updated in real-time</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {incidentDispatches.map((disp) => (
                <div
                  key={disp.id}
                  className="bg-graphite-card border border-graphite-border rounded-panel p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getDepartmentIcon(disp.department)}
                      <h3 className="text-xs font-semibold text-graphite-text">
                        {disp.department}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
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

                  <div className="flex items-center justify-between text-xs text-graphite-secondary pt-1 border-t border-graphite-border">
                    <span>ETA: <strong className="text-graphite-text">{disp.eta || 'Evaluating'}</strong></span>
                    <span className="text-[10px] font-mono text-graphite-muted">
                      {disp.respondedAt ? `Responded ${new Date(disp.respondedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Standby'}
                    </span>
                  </div>

                  {disp.responseMessage ? (
                    <div className="p-2.5 bg-graphite-deep rounded border border-graphite-border text-xs text-graphite-text italic">
                      "{disp.responseMessage}"
                    </div>
                  ) : (
                    <div className="p-2 bg-graphite-raised/50 rounded text-[11px] text-graphite-muted">
                      Waiting for officer response from {disp.department}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Live Area Advisory Feed */}
          {areaAdvisories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs text-graphite-muted px-1">
                <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span className="font-semibold text-graphite-text">
                  Live Area Advisory Feed for Sector: "{activeIncident.area}"
                </span>
              </div>

              <div className="space-y-2">
                {areaAdvisories.map((adv) => (
                  <div
                    key={adv.id}
                    className="p-3 bg-graphite-card border border-graphite-border rounded-panel text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-sky-400">{adv.department} Public Notice</span>
                      <span className="text-graphite-muted font-mono">
                        {new Date(adv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-graphite-text leading-relaxed">
                      "{adv.message}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 7: Instant Category Safety Guidance (Do's and Don'ts) */}
          {safetyGuidance && (
            <div className="bg-graphite-card border border-graphite-border rounded-panel p-5 space-y-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-graphite-text">
                  {safetyGuidance.title} — Official Safety Protocol
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Do's */}
                <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-panel space-y-2">
                  <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Recommended Actions (DO)
                  </span>
                  <ul className="space-y-1.5 text-graphite-secondary">
                    {safetyGuidance.steps.map((s, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{s.instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Don'ts */}
                <div className="p-3.5 bg-red-500/5 border border-red-500/20 rounded-panel space-y-2">
                  <span className="font-mono text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                    Critical Hazards to Avoid (DO NOT)
                  </span>
                  <ul className="space-y-1.5 text-graphite-secondary">
                    {safetyGuidance.doNot.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-red-300">
                        <span className="text-red-400 font-bold">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-graphite-card border border-graphite-border rounded-panel space-y-2">
          <p className="text-sm text-graphite-muted">
            No incident found matching Tracking ID <strong>"{searchInput}"</strong>.
          </p>
          <p className="text-xs text-graphite-secondary">
            Check the code on your submission confirmation or select one of the demo incident codes above.
          </p>
        </div>
      )}
    </div>
  );
};
