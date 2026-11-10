import React from 'react';
import { Flame, HeartPulse, Waves, Activity, Car, Building, ShieldAlert, AlertCircle, Info } from 'lucide-react';
import { EmergencyType } from '../../types/report';
import { useI18n } from '../../i18n';

interface Step1Props {
  title: string;
  onChangeTitle: (title: string) => void;
  selectedType: EmergencyType | '';
  onSelectType: (type: EmergencyType) => void;
  description: string;
  onChangeDescription: (desc: string) => void;
  error?: string;
}

export const Step1EmergencyType: React.FC<Step1Props> = ({
  title,
  onChangeTitle,
  selectedType,
  onSelectType,
  description,
  onChangeDescription,
  error,
}) => {
  const { t } = useI18n();

  const emergencyOptions: Array<{
    type: EmergencyType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    borderSelected: string;
    bgSelected: string;
    textSelected: string;
    hoverBorder: string;
    hoverBg: string;
    hoverIconText: string;
  }> = [
    {
      type: 'Fire',
      label: t('typeFire'),
      icon: Flame,
      accentColor: 'text-red-400 bg-red-500/15',
      borderSelected: 'border-red-500/70',
      bgSelected: 'bg-red-500/10',
      textSelected: 'text-red-200',
      hoverBorder: 'hover:border-red-500/40',
      hoverBg: 'hover:bg-red-500/5',
      hoverIconText: 'group-hover:text-red-400',
    },
    {
      type: 'Medical',
      label: t('typeMedical'),
      icon: HeartPulse,
      accentColor: 'text-rose-400 bg-rose-500/15',
      borderSelected: 'border-rose-500/70',
      bgSelected: 'bg-rose-500/10',
      textSelected: 'text-rose-200',
      hoverBorder: 'hover:border-rose-500/40',
      hoverBg: 'hover:bg-rose-500/5',
      hoverIconText: 'group-hover:text-rose-400',
    },
    {
      type: 'Flood',
      label: t('typeFlood'),
      icon: Waves,
      accentColor: 'text-sky-400 bg-sky-500/15',
      borderSelected: 'border-sky-500/70',
      bgSelected: 'bg-sky-500/10',
      textSelected: 'text-sky-200',
      hoverBorder: 'hover:border-sky-500/40',
      hoverBg: 'hover:bg-sky-500/5',
      hoverIconText: 'group-hover:text-sky-400',
    },
    {
      type: 'Earthquake',
      label: t('typeEarthquake'),
      icon: Activity,
      accentColor: 'text-amber-400 bg-amber-500/15',
      borderSelected: 'border-amber-500/70',
      bgSelected: 'bg-amber-500/10',
      textSelected: 'text-amber-200',
      hoverBorder: 'hover:border-amber-500/40',
      hoverBg: 'hover:bg-amber-500/5',
      hoverIconText: 'group-hover:text-amber-400',
    },
    {
      type: 'Road Accident',
      label: t('typeRoadAccident'),
      icon: Car,
      accentColor: 'text-orange-400 bg-orange-500/15',
      borderSelected: 'border-orange-500/70',
      bgSelected: 'bg-orange-500/10',
      textSelected: 'text-orange-200',
      hoverBorder: 'hover:border-orange-500/40',
      hoverBg: 'hover:bg-orange-500/5',
      hoverIconText: 'group-hover:text-orange-400',
    },
    {
      type: 'Building Collapse',
      label: t('typeBuildingCollapse'),
      icon: Building,
      accentColor: 'text-yellow-500 bg-yellow-500/15',
      borderSelected: 'border-yellow-500/70',
      bgSelected: 'bg-yellow-500/10',
      textSelected: 'text-yellow-200',
      hoverBorder: 'hover:border-yellow-500/40',
      hoverBg: 'hover:bg-yellow-500/5',
      hoverIconText: 'group-hover:text-yellow-400',
    },
    {
      type: 'Violence/Crime',
      label: t('typeViolenceCrime'),
      icon: ShieldAlert,
      accentColor: 'text-indigo-400 bg-indigo-500/15',
      borderSelected: 'border-indigo-500/70',
      bgSelected: 'bg-indigo-500/10',
      textSelected: 'text-indigo-200',
      hoverBorder: 'hover:border-indigo-500/40',
      hoverBg: 'hover:bg-indigo-500/5',
      hoverIconText: 'group-hover:text-indigo-400',
    },
    {
      type: 'Other',
      label: t('typeOther'),
      icon: AlertCircle,
      accentColor: 'text-slate-300 bg-slate-500/15',
      borderSelected: 'border-slate-400/70',
      bgSelected: 'bg-slate-500/10',
      textSelected: 'text-slate-200',
      hoverBorder: 'hover:border-slate-400/40',
      hoverBg: 'hover:bg-slate-500/5',
      hoverIconText: 'group-hover:text-slate-300',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Category selector grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-graphite-secondary">
            1. {t('selectType')} <span className="text-emergency-accent">*</span>
          </label>
          <span className="text-[11px] text-graphite-muted">Choose closest primary category</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {emergencyOptions.map((opt) => {
            const isSelected = selectedType === opt.type;
            const Icon = opt.icon;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => onSelectType(opt.type)}
                className={`group flex flex-col items-start justify-between p-3.5 rounded-card border text-left transition-colors duration-150 min-h-[92px] ${
                  isSelected
                    ? `${opt.borderSelected} ${opt.bgSelected} ${opt.textSelected}`
                    : `border-graphite-border bg-graphite-card ${opt.hoverBorder} ${opt.hoverBg} text-graphite-secondary`
                }`}
                aria-pressed={isSelected}
              >
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center transition-colors duration-150 ${
                    isSelected
                      ? opt.accentColor
                      : `bg-graphite-surface text-graphite-muted ${opt.hoverIconText}`
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[1.75]" />
                </div>
                <div>
                  <span className={`text-xs font-medium block leading-snug transition-colors ${
                    isSelected ? 'text-graphite-text font-semibold' : 'text-graphite-secondary group-hover:text-graphite-text'
                  }`}>
                    {opt.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Incident Title */}
      <div className="space-y-1.5">
        <label htmlFor="emergency-title" className="block text-xs font-medium text-graphite-secondary">
          2. Incident Title (Optional)
        </label>
        <input
          id="emergency-title"
          type="text"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value.slice(0, 150))}
          placeholder="Brief title (e.g. Chemical spill at factory gate, Kitchen fire)"
          className="w-full bg-graphite-card border border-graphite-border focus:border-graphite-border-strong focus:outline-none focus:ring-1 focus:ring-graphite-border-strong rounded-control px-3 py-2 text-xs sm:text-sm text-graphite-text placeholder:text-graphite-muted transition-colors duration-150"
        />
      </div>

      {/* Free-text description */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="emergency-description" className="block text-xs font-medium text-graphite-secondary">
            3. {t('descriptionLabel')}
          </label>
          <span
            className={`text-[11px] font-mono tabular-nums ${
              description.length > 950 ? 'text-emergency-accent' : 'text-graphite-muted'
            }`}
          >
            {description.length} / 1000 {t('charactersRemaining')}
          </span>
        </div>

        <textarea
          id="emergency-description"
          rows={4}
          value={description}
          onChange={(e) => onChangeDescription(e.target.value.slice(0, 1000))}
          placeholder={t('descriptionPlaceholder')}
          className="w-full bg-graphite-card border border-graphite-border focus:border-graphite-border-strong focus:outline-none focus:ring-1 focus:ring-graphite-border-strong rounded-card p-3 text-sm text-graphite-text placeholder:text-graphite-muted leading-relaxed transition-colors duration-150 resize-none hover:border-graphite-border-strong"
        />

        <div className="flex items-center space-x-1.5 text-xs text-graphite-muted">
          <Info className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>{t('orUseVoice')}</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-emergency-subtle border border-emergency-border rounded-control text-xs text-emergency-accent flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.5]" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
