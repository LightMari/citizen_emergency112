import React, { useState, useEffect } from 'react';
import { MapPin, Camera, Mic, Check } from 'lucide-react';
import { useI18n } from '../../i18n';

export const PrivacyConsentModal: React.FC = () => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem('emergency_user_consent_v1');
    if (!hasConsented) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('emergency_user_consent_v1', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-deep/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-graphite-card border border-graphite-border max-w-md w-full rounded-panel shadow-2xl overflow-hidden p-5 sm:p-6 text-graphite-text">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-control bg-graphite-raised border border-graphite-border flex items-center justify-center p-1 shrink-0">
            <img
              src="/tamilnadu-logo.svg"
              alt="Government of Tamil Nadu"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 id="consent-title" className="text-base font-medium text-graphite-text">
                {t('privacyConsent')}
              </h2>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                TN 112
              </span>
            </div>
            <p className="text-[11px] text-graphite-muted">Tamil Nadu State Disaster Management & Dispatch</p>
          </div>
        </div>

        <p className="text-xs text-graphite-secondary mb-4 leading-relaxed">
          {t('consentDescription')}
        </p>

        <div className="space-y-2.5 mb-5 bg-graphite-deep p-3.5 rounded-control border border-graphite-border">
          <div className="flex items-start space-x-2.5">
            <MapPin className="w-3.5 h-3.5 text-emergency-accent shrink-0 mt-0.5 stroke-[1.5]" aria-hidden="true" />
            <div className="text-[11px]">
              <span className="font-medium text-graphite-text">Location GPS:</span> Pinpoints exact coordinates for response navigation.
            </div>
          </div>
          <div className="flex items-start space-x-2.5">
            <Camera className="w-3.5 h-3.5 text-graphite-secondary shrink-0 mt-0.5 stroke-[1.5]" aria-hidden="true" />
            <div className="text-[11px]">
              <span className="font-medium text-graphite-text">Camera & Photos:</span> Enables visual triage of fire, collapse, or road hazards.
            </div>
          </div>
          <div className="flex items-start space-x-2.5">
            <Mic className="w-3.5 h-3.5 text-graphite-secondary shrink-0 mt-0.5 stroke-[1.5]" aria-hidden="true" />
            <div className="text-[11px]">
              <span className="font-medium text-graphite-text">Microphone:</span> Provides hands-free audio reporting and voice memos.
            </div>
          </div>
        </div>

        <p className="text-[11px] text-graphite-muted mb-5 leading-normal">
          {t('privacyNotice')}
        </p>

        <button
          onClick={handleAccept}
          className="w-full h-11 px-4 bg-graphite-raised hover:bg-graphite-surface active:bg-graphite-card border border-graphite-border-strong text-graphite-text font-medium rounded-control flex items-center justify-center space-x-2 transition-colors duration-150 text-xs sm:text-sm"
        >
          <Check className="w-4 h-4 stroke-[2]" />
          <span>{t('grantConsent')}</span>
        </button>
      </div>
    </div>
  );
};
