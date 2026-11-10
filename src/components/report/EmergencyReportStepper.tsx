import React, { useState } from 'react';
import {
  Siren,
  MapPin,
  Camera,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { EmergencyType, HazardType, SeverityLevel, EmergencyReport } from '../../types/report';
import { Step1EmergencyType } from './Step1EmergencyType';
import { Step2Location } from './Step2Location';
import { Step3MediaVoice, DraftMediaItem } from './Step3MediaVoice';
import { Step4ImpactHazards } from './Step4ImpactHazards';
import { ConfirmationScreen } from './ConfirmationScreen';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { submitEmergencyReport } from '../../services/mockBackend';
import { EmergencyReportSchema } from '../../utils/validation';
import { useI18n } from '../../i18n';

interface StepperProps {
  onOpenResponder: () => void;
}

export const EmergencyReportStepper: React.FC<StepperProps> = ({ onOpenResponder }) => {
  const { t } = useI18n();
  const { isOnline } = useNetworkStatus();

  // Step indicator
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [type, setType] = useState<EmergencyType | ''>('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('Anna Salai, Chennai, Tamil Nadu');
  const [landmark, setLandmark] = useState('');
  const [peopleAffected, setPeopleAffected] = useState<number>(1);
  const [injuries, setInjuries] = useState(false);
  const [trappedPersons, setTrappedPersons] = useState(false);
  const [hazards, setHazards] = useState<HazardType[]>([]);
  const [severity, setSeverity] = useState<SeverityLevel | undefined>('High');
  const [contactPhone, setContactPhone] = useState('');
  const [mediaFiles, setMediaFiles] = useState<DraftMediaItem[]>([]);

  // Errors & submission state
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<EmergencyReport | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | undefined>(undefined);

  // Geolocation hook
  const {
    latitude,
    longitude,
    address: geoAddress,
    loading: isLocating,
    error: locationError,
    getCurrentLocation,
    updateLocationManually,
  } = useGeolocation();

  // Voice recorder hook
  const {
    isRecording,
    audioBlob,
    audioUrl,
    durationSeconds,
    error: voiceError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoiceRecorder();

  // Speech to text hook
  const {
    isListening,
    transcript,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition((newText) => {
    // If description is empty, auto-fill it
    if (!description || description.trim() === '') {
      setDescription(newText);
    }
  });

  // Handle GPS location click
  const handleUseCurrentLocation = async () => {
    const loc = await getCurrentLocation();
    if (loc && loc.address) {
      setAddress(loc.address);
    }
    return loc;
  };

  // Step 3 media helpers
  const handleAddMedia = (media: DraftMediaItem) => {
    setMediaFiles((prev) => [...prev, media]);
  };

  const handleRemoveMedia = (id: string) => {
    setMediaFiles((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAppendTranscript = (text: string) => {
    setDescription((prev) => (prev ? `${prev}\n${text}` : text));
  };

  // Step 4 hazard toggle
  const handleToggleHazard = (hazard: HazardType) => {
    setHazards((prev) =>
      prev.includes(hazard) ? prev.filter((h) => h !== hazard) : [...prev, hazard]
    );
  };

  // Step validation
  const validateCurrentStep = (): boolean => {
    setStepError(null);

    if (currentStep === 1) {
      if (!type) {
        setStepError('Select an emergency type to proceed');
        return false;
      }
      return true;
    }

    if (currentStep === 2) {
      if (latitude === null || longitude === null) {
        setStepError('Valid GPS coordinates are required');
        return false;
      }
      return true;
    }

    if (currentStep === 3) {
      return true;
    }

    if (currentStep === 4) {
      const reportPayload = {
        type,
        description: description.trim() || (transcript.trim() ? transcript : 'Immediate emergency assistance requested.'),
        transcript: transcript.trim() || undefined,
        latitude: latitude ?? 13.0827,
        longitude: longitude ?? 80.2707,
        address: address.trim() || 'GPS Coordinates Provided',
        landmark: landmark.trim() || undefined,
        peopleAffected: Number(peopleAffected) || 1,
        injuries: Boolean(injuries),
        trappedPersons: Boolean(trappedPersons),
        hazards,
        severity: severity || 'High',
        contactPhone: contactPhone.trim() || undefined,
        media: mediaFiles.map((m) => ({
          kind: m.kind,
          url: m.previewUrl,
          sizeBytes: m.size,
          compressed: m.compressed ?? false,
        })),
        isOnline,
      };

      const result = EmergencyReportSchema.safeParse(reportPayload);
      if (!result.success) {
        const firstIssue = result.error.issues[0]?.message || 'Please check form values';
        setStepError(firstIssue);
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4) as any);
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        try {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
          // jsdom fallback
        }
      }
    }
  };

  const handleBack = () => {
    setStepError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1) as any);
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // jsdom fallback
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setStepError(null);

    try {
      const mediaItems = mediaFiles.map((m) => ({
        id: m.id,
        kind: m.kind,
        url: m.previewUrl,
        name: m.name,
        size: m.size,
        mimeType: m.kind === 'image' ? 'image/jpeg' : 'video/mp4',
        createdAt: new Date().toISOString(),
      }));

      if (audioUrl && audioBlob) {
        mediaItems.push({
          id: `audio-${Date.now()}`,
          kind: 'audio',
          url: audioUrl,
          name: 'voice-emergency.webm',
          size: audioBlob.size,
          mimeType: audioBlob.type || 'audio/webm',
          createdAt: new Date().toISOString(),
        });
      }

      const finalDescription =
        description.trim() || (transcript.trim() ? transcript : 'Immediate emergency assistance requested.');

      const submissionResult = await submitEmergencyReport(
        {
          type: type as EmergencyType,
          description: finalDescription,
          transcript: transcript.trim() || undefined,
          latitude: latitude ?? 13.0827,
          longitude: longitude ?? 80.2707,
          address: address.trim() || geoAddress,
          landmark: landmark.trim() || undefined,
          peopleAffected: Number(peopleAffected) || 1,
          injuries: Boolean(injuries),
          trappedPersons: Boolean(trappedPersons),
          hazards,
          severity,
          contactPhone: contactPhone.trim() || undefined,
          media: mediaItems,
        },
        !isOnline
      );

      setSubmittedReport(submissionResult.report);
      setDuplicateWarning(submissionResult.duplicateWarning);
      setCurrentStep(5);
    } catch (err: any) {
      setStepError(err.message || 'Failed to submit report. Please retry or dial emergency services.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFlow = () => {
    setCurrentStep(1);
    setType('');
    setDescription('');
    setAddress('Anna Salai, Chennai, Tamil Nadu');
    setLandmark('');
    setPeopleAffected(1);
    setInjuries(false);
    setTrappedPersons(false);
    setHazards([]);
    setSeverity('High');
    setContactPhone('');
    setMediaFiles([]);
    resetRecording();
    setSubmittedReport(null);
    setStepError(null);
  };

  const stepsConfig = [
    { num: 1, label: t('step1Title'), icon: Siren },
    { num: 2, label: t('step2Title'), icon: MapPin },
    { num: 3, label: t('step3Title'), icon: Camera },
    { num: 4, label: t('step4Title'), icon: Users },
  ];

  if (currentStep === 5 && submittedReport) {
    return (
      <ConfirmationScreen
        report={submittedReport}
        onNewReport={handleResetFlow}
        onOpenResponder={onOpenResponder}
        duplicateWarning={duplicateWarning}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 animate-fade-in">
      {/* Title & Context */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono tabular-nums text-graphite-muted">
            Emergency Report Step {currentStep} of 4
          </span>
          <span className="text-[11px] text-graphite-muted">
            {t('appName')}
          </span>
        </div>
        <h1 className="text-lg sm:text-xl font-medium tracking-tight text-graphite-text">
          {stepsConfig[currentStep - 1]?.label}
        </h1>
        <p className="text-xs text-graphite-secondary mt-0.5">
          {currentStep === 1 && 'Select incident classification and describe the emergency'}
          {currentStep === 2 && 'Pinpoint exact incident coordinates and location reference'}
          {currentStep === 3 && 'Capture optional photos, video or hands-free voice memo'}
          {currentStep === 4 && 'Report casualties, active hazards, and estimate severity'}
        </p>
      </div>

      {/* STEP PROGRESS INDICATOR */}
      <div className="bg-graphite-card border border-graphite-border rounded-card p-3 mb-6" aria-label="Report Steps">
        <div className="grid grid-cols-4 gap-2">
          {stepsConfig.map((s) => {
            const isCurrent = currentStep === s.num;
            const isDone = currentStep > s.num;

            return (
              <div
                key={s.num}
                className={`flex items-center space-x-2 p-2 rounded-control transition-colors duration-150 ${
                  isCurrent
                    ? 'bg-red-500/10 text-red-200 border border-red-500/40'
                    : isDone
                    ? 'text-emerald-300'
                    : 'text-graphite-muted'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono shrink-0 ${
                    isCurrent
                      ? 'bg-red-600 text-white font-medium'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-graphite-raised text-graphite-muted'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[2]" /> : s.num}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <span className="text-xs truncate block font-medium">
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACTIVE STEP CONTENT */}
      <div className="mb-6">
        {currentStep === 1 && (
          <Step1EmergencyType
            selectedType={type}
            onSelectType={(newType) => {
              setType(newType);
              setStepError(null);
            }}
            description={description}
            onChangeDescription={setDescription}
            error={stepError || undefined}
          />
        )}

        {currentStep === 2 && (
          <Step2Location
            latitude={latitude}
            longitude={longitude}
            address={address}
            landmark={landmark}
            onChangeCoordinates={(lat, lng) => updateLocationManually(lat, lng)}
            onChangeAddress={setAddress}
            onChangeLandmark={setLandmark}
            onUseCurrentLocation={handleUseCurrentLocation}
            isLocating={isLocating}
            locationError={locationError || stepError}
          />
        )}

        {currentStep === 3 && (
          <Step3MediaVoice
            mediaFiles={mediaFiles}
            onAddMedia={handleAddMedia}
            onRemoveMedia={handleRemoveMedia}
            isRecording={isRecording}
            audioBlob={audioBlob}
            audioUrl={audioUrl}
            durationSeconds={durationSeconds}
            voiceError={voiceError}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onResetRecording={resetRecording}
            transcript={transcript}
            isListening={isListening}
            isSpeechSupported={isSpeechSupported}
            onStartListening={startListening}
            onStopListening={stopListening}
            onAppendTranscriptToDescription={handleAppendTranscript}
          />
        )}

        {currentStep === 4 && (
          <Step4ImpactHazards
            peopleAffected={peopleAffected}
            onChangePeopleAffected={setPeopleAffected}
            injuries={injuries}
            onToggleInjuries={() => setInjuries((prev) => !prev)}
            trappedPersons={trappedPersons}
            onToggleTrappedPersons={() => setTrappedPersons((prev) => !prev)}
            hazards={hazards}
            onToggleHazard={handleToggleHazard}
            severity={severity}
            onSelectSeverity={setSeverity}
            contactPhone={contactPhone}
            onChangeContactPhone={setContactPhone}
            phoneError={stepError || undefined}
          />
        )}
      </div>

      {/* FIXED STEP NAVIGATION ACTIONS */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-graphite-deep/95 backdrop-blur-md border-t border-graphite-border py-3 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="group h-11 px-4 bg-graphite-raised hover:bg-graphite-surface hover:border-graphite-border-strong active:bg-graphite-card border border-graphite-border text-graphite-text font-medium rounded-control text-xs sm:text-sm flex items-center space-x-2 transition-colors duration-150"
            >
              <ArrowLeft className="w-4 h-4 stroke-[1.5] group-hover:-translate-x-0.5 transition-transform" />
              <span>{t('prevStep')}</span>
            </button>
          ) : (
            <div className="text-xs text-graphite-muted hidden sm:block">
              {t('urgentHelpNotice')}
            </div>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="group flex-1 sm:flex-initial h-11 px-6 bg-graphite-raised hover:bg-graphite-surface hover:border-graphite-text active:bg-graphite-card text-graphite-text border border-graphite-border-strong font-medium rounded-control text-xs sm:text-sm flex items-center justify-center space-x-2 transition-colors duration-150"
            >
              <span>{t('nextStep')}</span>
              <ArrowRight className="w-4 h-4 stroke-[1.5] group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial h-11 px-6 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-medium rounded-control text-sm flex items-center justify-center space-x-2 transition-colors duration-150 disabled:opacity-50 shadow-sm"
            >
              <Siren className="w-4 h-4 stroke-[1.75]" />
              <span>{isSubmitting ? t('submitting') : t('submitReport')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
