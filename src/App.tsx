import React, { useState } from 'react';
import { I18nProvider } from './i18n';
import { Navbar } from './components/common/Navbar';
import { PrivacyConsentModal } from './components/common/PrivacyConsentModal';
import { EmergencyReportStepper } from './components/report/EmergencyReportStepper';
import { ResponderDashboard } from './components/responder/ResponderDashboard';
import SOSButton from './components/sos/SOSButton';
import { SOSPanicMode } from './components/sos/SOSPanicMode';
import { useShakeDetector } from './hooks/useShakeDetector';
import bgWaterscape from './Misty Teal Mountain Waterscape.png';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'report' | 'responder' | 'tracking'>('report');
  const [resetKey, setResetKey] = useState(0);
  const [sosActive, setSosActive] = useState(false);

  // One-gesture Shake SOS trigger (shake device 3x in 1.5s window)
  useShakeDetector(() => {
    setSosActive(true);
  });

  return (
    <I18nProvider>
      <div className="relative min-h-screen text-graphite-text font-sans selection:bg-rose-500/30 selection:text-white">
        {/* Ambient Misty Teal Mountain Waterscape background with blurry effect */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          <img
            src={bgWaterscape}
            alt=""
            className="w-full h-full object-cover filter blur-[12px] scale-110 opacity-75"
          />
          {/* Subtle dimming layer for contrast while keeping the misty teal mountains and waterscape vivid */}
          <div className="absolute inset-0 bg-[#0c0d0e]/50 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c0d0e]/60 via-transparent to-[#0c0d0e]/75" />
        </div>

        {/* Interactive Content Layer */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Transparent permission consent dialog on first visit */}
          <PrivacyConsentModal />

          {/* Global Navigation Header */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onResetData={() => setResetKey((k) => k + 1)}
          />

          {/* Main View Area */}
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6" key={resetKey}>
            {activeTab === 'report' ? (
              <EmergencyReportStepper onOpenResponder={() => setActiveTab('responder')} />
            ) : (
              <ResponderDashboard />
            )}
          </main>

          {/* One-Touch Persistent Floating Emergency SOS Button */}
          <SOSButton onActivate={() => setSosActive(true)} />

          {/* Full Screen Instant Voice SOS & Actionable First Aid Modal */}
          {sosActive && <SOSPanicMode onClose={() => setSosActive(false)} />}
        </div>
      </div>
    </I18nProvider>
  );
};

export default App;
