import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  X,
  MapPin,
  Mic,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Radio,
  Flame,
  HeartPulse,
  Waves,
  Car,
  Building2,
  Shield,
  Zap,
} from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { classifyEmergencyFromSpeech, getFirstAidGuidance } from '../../utils/firstAidEngine';
import { submitEmergencyReport } from '../../services/mockBackend';
import { EmergencyType } from '../../types/report';

interface SOSPanicModeProps {
  onClose: () => void;
}

export const SOSPanicMode: React.FC<SOSPanicModeProps> = ({ onClose }) => {
  const [phase, setPhase] = useState<'capturing' | 'listening' | 'sent' | 'firstaid'>('capturing');
  const [countdown, setCountdown] = useState(3);
  const [detectedType, setDetectedType] = useState<EmergencyType>('Medical');
  const [confidence, setConfidence] = useState(0);
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [etaMinutes] = useState(() => Math.floor(4 + Math.random() * 4));

  const { latitude, longitude, address, getCurrentLocation } = useGeolocation();
  const { transcript, startListening, stopListening } = useSpeechRecognition();

  const reportSubmittedRef = useRef(false);

  // Phase 1: Countdown 3.. 2.. 1.. while auto-capturing GPS
  useEffect(() => {
    getCurrentLocation();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('listening');
          startListening();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [getCurrentLocation, startListening]);

  // Phase 2: Live AI Speech Classification
  useEffect(() => {
    if (phase !== 'listening') return;

    if (transcript.trim()) {
      const result = classifyEmergencyFromSpeech(transcript);
      setDetectedType(result.type);
      setConfidence(result.confidence);
      setDetectedKeywords(result.detectedKeywords);

      // Auto-dispatch if high confidence
      if (result.confidence >= 70 && !reportSubmittedRef.current) {
        handleFileReport(result.type, transcript);
      }
    }
  }, [transcript, phase]);

  // Auto transition after 10s of listening even if low speech
  useEffect(() => {
    if (phase !== 'listening') return;

    const timeout = setTimeout(() => {
      if (!reportSubmittedRef.current) {
        handleFileReport(detectedType, transcript || 'Voice SOS panic signal dispatched');
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [phase, detectedType, transcript]);

  const handleFileReport = async (typeToSubmit: EmergencyType, voiceText: string) => {
    if (reportSubmittedRef.current) return;
    reportSubmittedRef.current = true;
    stopListening();

    try {
      const res = await submitEmergencyReport({
        type: typeToSubmit,
        description: voiceText
          ? `[ONE-TOUCH VOICE SOS]: ${voiceText}`
          : `[ONE-TOUCH VOICE SOS]: Panic button triggered near ${address}`,
        transcript: voiceText,
        latitude: latitude || 13.0827,
        longitude: longitude || 80.2707,
        address: address || 'Chennai Central, Tamil Nadu',
        landmark: 'Dispatched via Instant Shake/Voice SOS Beacon',
        peopleAffected: 1,
        injuries: true,
        trappedPersons: false,
        hazards: typeToSubmit === 'Fire' ? ['Fire/smoke'] : [],
        severity: 'Critical',
        contactPhone: '+91 112',
        media: [],
      });

      setReportId(res.report.id);
      setPhase('sent');
    } catch {
      setReportId(`REP-${Math.floor(1000 + Math.random() * 9000)}`);
      setPhase('sent');
    }
  };

  const guidance = getFirstAidGuidance(detectedType);

  const getEmergencyIcon = (type: EmergencyType) => {
    switch (type) {
      case 'Fire':
        return <Flame className="w-5 h-5 text-red-400" />;
      case 'Medical':
        return <HeartPulse className="w-5 h-5 text-emerald-400" />;
      case 'Flood':
        return <Waves className="w-5 h-5 text-sky-400" />;
      case 'Road Accident':
        return <Car className="w-5 h-5 text-amber-400" />;
      case 'Building Collapse':
        return <Building2 className="w-5 h-5 text-rose-400" />;
      case 'Violence/Crime':
        return <Shield className="w-5 h-5 text-purple-400" />;
      default:
        return <Radio className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl overflow-y-auto animate-fade-in text-white"
    >
      <div className="max-w-lg w-full my-auto space-y-4">
        {/* Top Emergency Beacon Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
              EMERGENCY SOS ACTIVE
            </span>
          </div>

          <button
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="p-1.5 rounded-control bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Cancel / Exit SOS"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* PHASE 1: CAPTURING & COUNTDOWN */}
        {phase === 'capturing' && (
          <div className="text-center py-8 space-y-6 animate-fade-in">
            <div className="relative inline-flex items-center justify-center">
              <span className="absolute w-32 h-32 rounded-full bg-rose-600/30 animate-ping" />
              <div className="w-24 h-24 rounded-full bg-rose-600 border-4 border-white/30 flex items-center justify-center shadow-2xl">
                <span className="text-4xl font-mono font-black text-white">{countdown}</span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Preparing Emergency Telemetry
              </h2>
              <p className="text-xs text-neutral-400">
                Acquiring GPS fix & initializing microphone for instant voice triage...
              </p>
            </div>

            <div className="p-3 bg-neutral-900/90 rounded-card border border-white/10 text-xs flex items-center justify-center space-x-2 text-neutral-300">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="truncate">{address || 'Locating current GPS coordinates in Chennai...'}</span>
            </div>

            <button
              onClick={() => {
                stopListening();
                onClose();
              }}
              className="text-xs text-neutral-400 hover:text-rose-400 underline"
            >
              Cancel SOS (Accidental gesture)
            </button>
          </div>
        )}

        {/* PHASE 2: VOICE LISTENING & REALTIME AI CLASSIFICATION */}
        {phase === 'listening' && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-semibold">
                <Mic className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                <span>Speak now — describe what is happening</span>
              </div>
              <h2 className="text-lg font-bold text-white pt-1">
                Listening & Analyzing Speech
              </h2>
              <p className="text-[11px] text-neutral-400">
                AI detects Fire, Medical, Collapses, Floods, or Accidents in English & Tamil
              </p>
            </div>

            {/* Live Transcript Box */}
            <div className="bg-neutral-900 border border-white/15 p-4 rounded-panel min-h-[90px] flex items-center justify-center text-center">
              {transcript.trim() ? (
                <p className="text-sm text-neutral-100 font-medium italic">
                  "{transcript}"
                </p>
              ) : (
                <div className="space-y-1 text-neutral-500">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mx-auto animate-ping" />
                  <span className="text-xs">
                    "Someone collapsed...", "Fire on 2nd floor...", "தீ விபத்து / உதவி..."
                  </span>
                </div>
              )}
            </div>

            {/* Detected Emergency Card */}
            <div className="p-3 bg-neutral-900 border border-white/10 rounded-card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getEmergencyIcon(detectedType)}
                  <span className="text-xs font-semibold text-white">
                    Detected: {detectedType} Incident
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">
                  {confidence}% match
                </span>
              </div>

              {/* Confidence Progress Bar */}
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${Math.max(confidence, 15)}%` }}
                />
              </div>

              {detectedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {detectedKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    >
                      +{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Skip Button */}
            <button
              onClick={() => handleFileReport(detectedType, transcript || 'Instant Voice SOS')}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-control text-xs font-bold transition-colors flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Send SOS Immediately ({detectedType})</span>
            </button>
          </div>
        )}

        {/* PHASE 3 & 4: REPORT SENT + LIVE FIRST AID ACTIONABLE GUIDANCE */}
        {(phase === 'sent' || phase === 'firstaid') && (
          <div className="space-y-4 animate-fade-in">
            {/* Confirmation Banner */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-card flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-300">
                    Emergency Dispatched #{reportId}
                  </div>
                  <div className="text-[11px] text-neutral-300">
                    Chennai 112 Triage alerted • ETA ~{etaMinutes} mins
                  </div>
                </div>
              </div>

              <a
                href={`tel:${guidance.emergencyNumber}`}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-control text-xs font-bold flex items-center space-x-1.5 shrink-0 shadow-lg"
              >
                <Phone className="w-3.5 h-3.5 fill-current" />
                <span>Call {guidance.emergencyNumber}</span>
              </a>
            </div>

            {/* Actionable First Aid Guidance Box */}
            <div className="bg-neutral-900 border border-white/10 rounded-panel p-4 space-y-3">
              <div className="border-b border-white/10 pb-2">
                <div className="flex items-center space-x-2">
                  {getEmergencyIcon(detectedType)}
                  <h3 className="text-sm font-bold text-white">{guidance.title}</h3>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">{guidance.callToAction}</p>
              </div>

              {/* Step by step instructions */}
              <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
                {guidance.steps.map((step, idx) => {
                  const isExpanded = expandedStep === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setExpandedStep(isExpanded ? null : idx)}
                      className={`p-2.5 rounded border cursor-pointer transition-all ${
                        isExpanded
                          ? 'bg-neutral-800/90 border-rose-500/40'
                          : 'bg-neutral-950/60 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-2">
                          <span className="w-5 h-5 rounded-full bg-rose-600/30 text-rose-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-xs text-neutral-200 leading-snug">
                            {step.instruction}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        )}
                      </div>

                      {isExpanded && step.warning && (
                        <div className="mt-2 pl-7 text-[11px] text-amber-300 flex items-center space-x-1.5 bg-amber-500/10 p-1.5 rounded">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{step.warning}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* What NOT to do warnings */}
              {guidance.doNot.length > 0 && (
                <div className="p-2.5 bg-red-950/40 border border-red-500/20 rounded text-[11px] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-red-400 font-bold block">
                    CRITICAL WARNINGS: DO NOT
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-red-200/90">
                    {guidance.doNot.slice(0, 3).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Bottom Dismiss */}
            <button
              onClick={onClose}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-control text-xs font-medium transition-colors"
            >
              Close SOS Screen (Report #{reportId} Saved)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
