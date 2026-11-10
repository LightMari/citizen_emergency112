import React from 'react';
import {
  Users,
  AlertTriangle,
  Flame,
  Wind,
  Building,
  Biohazard,
  ShieldAlert,
  Droplets,
  Phone,
  Plus,
  Minus,
  Check,
} from 'lucide-react';
import { HazardType, SeverityLevel } from '../../types/report';
import { useI18n } from '../../i18n';

interface Step4Props {
  peopleAffected: number;
  onChangePeopleAffected: (val: number) => void;
  injuries: boolean;
  onToggleInjuries: () => void;
  trappedPersons: boolean;
  onToggleTrappedPersons: () => void;
  hazards: HazardType[];
  onToggleHazard: (hazard: HazardType) => void;
  severity?: SeverityLevel;
  onSelectSeverity: (sev: SeverityLevel) => void;
  contactPhone: string;
  onChangeContactPhone: (phone: string) => void;
  phoneError?: string;
}

export const Step4ImpactHazards: React.FC<Step4Props> = ({
  peopleAffected,
  onChangePeopleAffected,
  injuries,
  onToggleInjuries,
  trappedPersons,
  onToggleTrappedPersons,
  hazards,
  onToggleHazard,
  severity,
  onSelectSeverity,
  contactPhone,
  onChangeContactPhone,
  phoneError,
}) => {
  const { t } = useI18n();

  const hazardOptions: Array<{
    type: HazardType;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    iconColor: string;
    hoverBorder: string;
    hoverBg: string;
    borderSelected: string;
    bgSelected: string;
    textSelected: string;
    checkBg: string;
  }> = [
    {
      type: 'Fire/smoke',
      icon: Flame,
      label: 'Fire / Heavy Smoke',
      iconColor: 'text-red-400',
      hoverBorder: 'hover:border-red-500/40',
      hoverBg: 'hover:bg-red-500/5',
      borderSelected: 'border-red-500/70',
      bgSelected: 'bg-red-500/10',
      textSelected: 'text-red-200',
      checkBg: 'bg-red-600 border-red-500 text-white',
    },
    {
      type: 'Gas leak',
      icon: Wind,
      label: 'Gas Leak / Odor',
      iconColor: 'text-amber-400',
      hoverBorder: 'hover:border-amber-500/40',
      hoverBg: 'hover:bg-amber-500/5',
      borderSelected: 'border-amber-500/70',
      bgSelected: 'bg-amber-500/10',
      textSelected: 'text-amber-200',
      checkBg: 'bg-amber-600 border-amber-500 text-white',
    },
    {
      type: 'Structural collapse risk',
      icon: Building,
      label: 'Structural Collapse',
      iconColor: 'text-orange-400',
      hoverBorder: 'hover:border-orange-500/40',
      hoverBg: 'hover:bg-orange-500/5',
      borderSelected: 'border-orange-500/70',
      bgSelected: 'bg-orange-500/10',
      textSelected: 'text-orange-200',
      checkBg: 'bg-orange-600 border-orange-500 text-white',
    },
    {
      type: 'Hazardous materials',
      icon: Biohazard,
      label: 'Hazardous Chemicals',
      iconColor: 'text-emerald-400',
      hoverBorder: 'hover:border-emerald-500/40',
      hoverBg: 'hover:bg-emerald-500/5',
      borderSelected: 'border-emerald-500/70',
      bgSelected: 'bg-emerald-500/10',
      textSelected: 'text-emerald-200',
      checkBg: 'bg-emerald-600 border-emerald-500 text-white',
    },
    {
      type: 'Armed threat',
      icon: ShieldAlert,
      label: 'Armed / Active Threat',
      iconColor: 'text-rose-400',
      hoverBorder: 'hover:border-rose-500/40',
      hoverBg: 'hover:bg-rose-500/5',
      borderSelected: 'border-rose-500/70',
      bgSelected: 'bg-rose-500/10',
      textSelected: 'text-rose-200',
      checkBg: 'bg-rose-600 border-rose-500 text-white',
    },
    {
      type: 'Rising water',
      icon: Droplets,
      label: 'Rising Floodwaters',
      iconColor: 'text-sky-400',
      hoverBorder: 'hover:border-sky-500/40',
      hoverBg: 'hover:bg-sky-500/5',
      borderSelected: 'border-sky-500/70',
      bgSelected: 'bg-sky-500/10',
      textSelected: 'text-sky-200',
      checkBg: 'bg-sky-600 border-sky-500 text-white',
    },
  ];

  const severityOptions: Array<{
    level: SeverityLevel;
    label: string;
    desc: string;
    hoverBorder: string;
    hoverBg: string;
    borderSelected: string;
    bgSelected: string;
    textSelected: string;
  }> = [
    {
      level: 'Low',
      label: 'Low',
      desc: t('severityLow'),
      hoverBorder: 'hover:border-blue-500/40',
      hoverBg: 'hover:bg-blue-500/5',
      borderSelected: 'border-blue-500/70',
      bgSelected: 'bg-blue-500/10',
      textSelected: 'text-blue-300 font-medium',
    },
    {
      level: 'Medium',
      label: 'Medium',
      desc: t('severityMedium'),
      hoverBorder: 'hover:border-yellow-500/40',
      hoverBg: 'hover:bg-yellow-500/5',
      borderSelected: 'border-yellow-500/70',
      bgSelected: 'bg-yellow-500/10',
      textSelected: 'text-yellow-300 font-medium',
    },
    {
      level: 'High',
      label: 'High',
      desc: t('severityHigh'),
      hoverBorder: 'hover:border-orange-500/40',
      hoverBg: 'hover:bg-orange-500/5',
      borderSelected: 'border-orange-500/70',
      bgSelected: 'bg-orange-500/10',
      textSelected: 'text-orange-300 font-medium',
    },
    {
      level: 'Critical',
      label: 'Critical',
      desc: t('severityCritical'),
      hoverBorder: 'hover:border-red-500/40',
      hoverBg: 'hover:bg-red-500/5',
      borderSelected: 'border-red-500/70',
      bgSelected: 'bg-red-500/10',
      textSelected: 'text-red-300 font-medium',
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* PEOPLE AFFECTED & LIFE RISK */}
      <div className="bg-graphite-card border border-graphite-border rounded-card p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Users className="w-3.5 h-3.5 text-emergency-accent stroke-[1.75]" />
          <h3 className="text-xs font-medium text-graphite-text">
            Casualties and trapped persons
          </h3>
        </div>

        {/* Stepper for number of people */}
        <div className="flex items-center justify-between bg-graphite-raised p-3 rounded-control border border-graphite-border">
          <div>
            <span className="block text-xs font-medium text-graphite-text">
              {t('peopleAffectedLabel')}
            </span>
            <span className="text-[11px] text-graphite-muted">Estimated count in vicinity</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onChangePeopleAffected(Math.max(0, peopleAffected - 1))}
              className="w-8 h-8 rounded-control bg-graphite-card hover:bg-graphite-surface hover:border-graphite-border-strong border border-graphite-border text-graphite-text flex items-center justify-center transition-colors duration-150"
              aria-label="Decrease affected count"
            >
              <Minus className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
            <span className="w-8 text-center font-mono tabular-nums font-medium text-sm text-graphite-text">
              {peopleAffected}
            </span>
            <button
              type="button"
              onClick={() => onChangePeopleAffected(peopleAffected + 1)}
              className="w-8 h-8 rounded-control bg-graphite-card hover:bg-graphite-surface hover:border-red-500/40 hover:text-red-400 border border-graphite-border text-graphite-text flex items-center justify-center transition-colors duration-150"
              aria-label="Increase affected count"
            >
              <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          </div>
        </div>

        {/* Toggles for Injuries & Trapped */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onToggleInjuries}
            className={`group p-3 rounded-control border text-left flex items-center justify-between transition-colors duration-150 ${
              injuries
                ? 'border-rose-500/70 bg-rose-500/10 text-rose-200'
                : 'border-graphite-border bg-graphite-raised hover:border-rose-500/40 hover:bg-rose-500/5 text-graphite-secondary'
            }`}
            aria-pressed={injuries}
          >
            <div>
              <span className={`block text-xs font-medium transition-colors ${injuries ? 'text-rose-200 font-semibold' : 'text-graphite-secondary group-hover:text-graphite-text'}`}>
                {t('injuriesPresent')}
              </span>
              <span className="text-[11px] text-graphite-muted">Ambulance required</span>
            </div>
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center text-xs transition-colors duration-150 ${
                injuries
                  ? 'bg-rose-600 border-rose-500 text-white'
                  : 'border-graphite-border bg-graphite-card text-transparent group-hover:border-rose-500/40'
              }`}
            >
              <Check className="w-3 h-3 stroke-[2]" />
            </div>
          </button>

          <button
            type="button"
            onClick={onToggleTrappedPersons}
            className={`group p-3 rounded-control border text-left flex items-center justify-between transition-colors duration-150 ${
              trappedPersons
                ? 'border-amber-500/70 bg-amber-500/10 text-amber-200'
                : 'border-graphite-border bg-graphite-raised hover:border-amber-500/40 hover:bg-amber-500/5 text-graphite-secondary'
            }`}
            aria-pressed={trappedPersons}
          >
            <div>
              <span className={`block text-xs font-medium transition-colors ${trappedPersons ? 'text-amber-200 font-semibold' : 'text-graphite-secondary group-hover:text-graphite-text'}`}>
                {t('peopleTrapped')}
              </span>
              <span className="text-[11px] text-graphite-muted">Extraction unit needed</span>
            </div>
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center text-xs transition-colors duration-150 ${
                trappedPersons
                  ? 'bg-amber-600 border-amber-500 text-white'
                  : 'border-graphite-border bg-graphite-card text-transparent group-hover:border-amber-500/40'
              }`}
            >
              <Check className="w-3 h-3 stroke-[2]" />
            </div>
          </button>
        </div>
      </div>

      {/* DANGERS & HAZARDS CHECKBOXES */}
      <div className="bg-graphite-card border border-graphite-border rounded-card p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 stroke-[1.75]" />
          <h3 className="text-xs font-medium text-graphite-text">
            {t('hazardsLabel')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {hazardOptions.map((h) => {
            const isChecked = hazards.includes(h.type);
            const Icon = h.icon;
            return (
              <button
                key={h.type}
                type="button"
                onClick={() => onToggleHazard(h.type)}
                className={`group flex items-center justify-between p-2.5 rounded-control border text-left transition-colors duration-150 ${
                  isChecked
                    ? `${h.borderSelected} ${h.bgSelected} ${h.textSelected}`
                    : `border-graphite-border bg-graphite-raised/50 ${h.hoverBorder} ${h.hoverBg} text-graphite-secondary`
                }`}
                aria-pressed={isChecked}
              >
                <div className="flex items-center space-x-2">
                  <Icon className={`w-3.5 h-3.5 stroke-[1.5] transition-colors ${isChecked ? h.iconColor : `text-graphite-muted group-hover:${h.iconColor}`}`} />
                  <span className={`text-xs font-medium transition-colors ${isChecked ? 'text-graphite-text font-semibold' : 'text-graphite-secondary group-hover:text-graphite-text'}`}>
                    {h.label}
                  </span>
                </div>
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors duration-150 ${
                    isChecked
                      ? h.checkBg
                      : 'border-graphite-border bg-transparent text-transparent group-hover:border-graphite-border-strong'
                  }`}
                >
                  <Check className="w-2.5 h-2.5 stroke-[2]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEVERITY ASSESSMENT */}
      <div className="bg-graphite-card border border-graphite-border rounded-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-graphite-text">
            {t('severityLabel')}
          </h3>
          <span className="text-[11px] text-graphite-muted">Self-assessment</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {severityOptions.map((opt) => {
            const isSelected = severity === opt.level;
            return (
              <button
                key={opt.level}
                type="button"
                onClick={() => onSelectSeverity(opt.level)}
                className={`p-2.5 rounded-control border text-center transition-colors duration-150 ${
                  isSelected
                    ? `${opt.borderSelected} ${opt.bgSelected} ${opt.textSelected}`
                    : `border-graphite-border bg-graphite-raised/50 ${opt.hoverBorder} ${opt.hoverBg} text-graphite-secondary hover:text-graphite-text`
                }`}
                aria-pressed={isSelected}
              >
                <div className="text-xs">{opt.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* OPTIONAL CALLBACK PHONE */}
      <div className="bg-graphite-card border border-graphite-border rounded-card p-4 space-y-2">
        <label htmlFor="callback-phone" className="block text-xs font-medium text-graphite-text flex items-center space-x-1.5">
          <Phone className="w-3.5 h-3.5 text-emerald-400 stroke-[1.5]" />
          <span>{t('contactPhoneLabel')}</span>
        </label>
        <p className="text-[11px] text-graphite-muted">Responders will only contact if location or route requires clarification</p>
        <input
          id="callback-phone"
          type="tel"
          value={contactPhone}
          onChange={(e) => onChangeContactPhone(e.target.value)}
          placeholder={t('contactPhonePlaceholder')}
          className="w-full bg-graphite-raised border border-graphite-border focus:border-graphite-border-strong focus:outline-none focus:ring-1 focus:ring-graphite-border-strong rounded-control px-3 py-2 text-xs sm:text-sm text-graphite-text placeholder:text-graphite-muted font-mono hover:border-graphite-border-strong"
        />
        {phoneError && (
          <p className="text-xs text-emergency-accent mt-1">{phoneError}</p>
        )}
      </div>
    </div>
  );
};
