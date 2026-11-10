import React, { useState } from 'react';
import { I18nProvider } from './i18n';
import { Navbar } from './components/common/Navbar';
import { PrivacyConsentModal } from './components/common/PrivacyConsentModal';
import { EmergencyReportStepper } from './components/report/EmergencyReportStepper';
import { ResponderDashboard } from './components/responder/ResponderDashboard';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'report' | 'responder' | 'tracking'>('report');
  const [resetKey, setResetKey] = useState(0);

  return (
    <I18nProvider>
      <div className="relative min-h-screen text-graphite-text flex flex-col font-sans selection:bg-rose-500/30 selection:text-white">
        {/* Ambient Misty Teal Mountain Waterscape background with blurry effect */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
          <img
            src="/bg-waterscape.png"
            alt=""
            className="w-full h-full object-cover filter blur-2xl scale-110 opacity-30 brightness-75 contrast-125"
          />
          {/* Subtle dark gradient overlay to guarantee unslop high contrast & WCAG text readability */}
          <div className="absolute inset-0 bg-[#0c0d0e]/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c0d0e]/60 via-transparent to-[#0c0d0e]/90" />
        </div>

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
      </div>
    </I18nProvider>
  );
};

export default App;
