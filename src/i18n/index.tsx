import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export type Language = 'en' | 'ta' | 'es';

export const translations = {
  en: {
    // Navigation & App
    appName: 'Tamil Nadu Citizen Emergency Reporting',
    tagline: 'Tamil Nadu 112 & GCC Emergency Dispatch',
    citizenReport: 'Report Emergency',
    responderPortal: 'Responder Dashboard',
    chartsTab: 'Charts',
    offlineMode: 'Offline Mode (Queue Active)',
    online: 'Online',
    syncing: 'Syncing Reports...',
    syncNow: 'Sync Now',
    privacyConsent: 'Privacy & Permissions',
    consentDescription: 'Location GPS, camera, and microphone permissions are requested solely for emergency services (Tamil Nadu 112, 108 Ambulance & Fire Services) to dispatch responders to your exact coordinates.',
    grantConsent: 'I Understand & Agree',
    privacyNotice: 'Your privacy is respected. Phone number is optional for responders to call back.',

    // Stepper & Flow
    step1Title: 'Type & Description',
    step2Title: 'Location & Pin',
    step3Title: 'Media & Voice',
    step4Title: 'People & Hazards',
    nextStep: 'Next',
    prevStep: 'Back',
    submitReport: 'Submit Emergency Report',
    submitting: 'Submitting...',
    urgentHelpNotice: 'In immediate life danger, dial 112 (National Emergency), 108 (Ambulance), or 101 (Fire).',

    // Types
    typeFire: 'Fire',
    typeMedical: 'Medical',
    typeFlood: 'Flood / Waterlogging',
    typeEarthquake: 'Earthquake',
    typeRoadAccident: 'Road Accident',
    typeBuildingCollapse: 'Building Collapse',
    typeViolenceCrime: 'Violence / Crime',
    typeOther: 'Other Emergency',

    // Form fields
    selectType: 'Select Emergency Type',
    descriptionLabel: 'Describe the emergency',
    descriptionPlaceholder: 'What is happening? Describe what you see (e.g., electrical transformer spark, flooded roadway, junction collision)...',
    charactersRemaining: 'characters',
    orUseVoice: 'Or tap below to describe by voice',

    // Location
    locationTitle: 'Pinpoint Location',
    useMyLocation: 'Use My Current Location',
    locating: 'Acquiring GPS...',
    dragPinNotice: 'Drag the pin on the map to adjust exact position in Chennai.',
    addressLabel: 'Detected Address',
    landmarkLabel: 'Optional Landmark / Area / Ward',
    landmarkPlaceholder: 'e.g., Near Gemini Flyover, Opposite Central Station, T. Nagar Bus Terminus',

    // Media & Voice
    mediaVoiceTitle: 'Evidence & Voice',
    recordVoice: 'Record Emergency Voice Memo',
    recording: 'Recording... Speak clearly',
    stopRecording: 'Stop Recording',
    speechToTextLive: 'Live Voice Transcription (Web Speech)',
    listenAndTranscribe: 'Speak & Transcribe',
    listening: 'Listening to your speech...',
    uploadMedia: 'Attach Photos / Video',
    captureCamera: 'Take Photo',
    dropFiles: 'Tap to select or capture media',
    compressionNotice: 'Images are automatically compressed client-side before sending.',
    uploadProgress: 'Upload Progress',

    // Step 4
    peopleAffectedLabel: 'Number of people affected',
    injuriesPresent: 'Injuries present?',
    peopleTrapped: 'People trapped inside?',
    hazardsLabel: 'Active Hazards Detected',
    severityLabel: 'Estimated Severity',
    severityLow: 'Low - Minor issue',
    severityMedium: 'Medium - Urgent care needed',
    severityHigh: 'High - Severe immediate risk',
    severityCritical: 'Critical - Life-threatening danger',
    contactPhoneLabel: 'Callback Phone Number (Optional)',
    contactPhonePlaceholder: '+91 98765 43210',

    // Confirmation
    reportSubmittedTitle: 'Emergency Report Received',
    reportIdLabel: 'Report ID',
    statusReceived: 'Received',
    statusVerified: 'Verified',
    statusDispatched: 'Dispatched',
    statusResolved: 'Resolved',
    queuedOfflineNotice: 'Report stored safely in offline queue. It will auto-dispatch when network reconnects.',
    backToHome: 'Submit Another Report',

    // Responder
    responderDashboardTitle: 'Chennai Emergency Command (TN 112 & GCC)',
    filterByType: 'Filter Type',
    filterByPriority: 'Filter Priority',
    filterByStatus: 'Filter Status',
    all: 'All',
    totalReports: 'Total Reports',
    criticalP1: 'Critical P1',
    highP2: 'High P2',
    mediumP3: 'Medium P3',
    lowP4: 'Low P4',
    viewDetails: 'Inspect & Triage',
    priorityScore: 'Priority Score',
    falseReportFlag: 'Flag False Alarm',
    markDispatched: 'Dispatch Responders',
    markResolved: 'Mark as Resolved',
    markVerified: 'Mark as Verified',
  },
  ta: {
    // Navigation & App
    appName: 'தமிழ்நாடு அவசர உதவி தகவல் தளம்',
    tagline: 'தமிழ்நாடு 112 & சென்னை மாநகராட்சி அவசர சேவை',
    citizenReport: 'அவசர உதவி பதிவு',
    responderPortal: 'மீட்புப் படை பலகை',
    chartsTab: 'வரைபடங்கள்',
    offlineMode: 'இணையமில்லா நிலை (வரிசை இயங்குகிறது)',
    online: 'இணையம் இணைப்பில் உள்ளது',
    syncing: 'பதிவுகள் பகிரப்படுகின்றன...',
    syncNow: 'இணைத்து அனுப்பு',
    privacyConsent: 'தனியுரிமை மற்றும் அனுமதிகள்',
    consentDescription: 'மீட்புக் குழுவினர் (தமிழ்நாடு 112, 108 ஆம்புலன்ஸ், தீயணைப்புத் துறை) உங்கள் துல்லியமான இருப்பிடத்தை விரைவாகக் கண்டறிந்து உதவ மட்டுமே இருப்பிடம், கேமரா மற்றும் மைக்ரோஃபோன் அனுமதிகள் கேட்கப்படுகின்றன.',
    grantConsent: 'புரிந்துகொண்டு ஏற்கிறேன்',
    privacyNotice: 'உங்கள் தனியுரிமை பாதுகாக்கப்படுகிறது. மீட்புக் குழுவினர் தொடர்புகொள்ள தொலைபேசி எண் விருப்பத்தேர்வாகும்.',

    // Stepper & Flow
    step1Title: 'வகை & விளக்கம்',
    step2Title: 'இருப்பிடம் & வரைபடம்',
    step3Title: 'புகைப்படம் & குரல்',
    step4Title: 'பாதிக்கப்பட்டோர் & ஆபத்துகள்',
    nextStep: 'அடுத்து',
    prevStep: 'முந்தையது',
    submitReport: 'அவசர உதவி பதிவை அனுப்பு',
    submitting: 'பதிவு அனுப்பப்படுகிறது...',
    urgentHelpNotice: 'உடனடி உயிராபத்து எனில் 112 (தேசிய அவசர உதவி), 108 (ஆம்புலன்ஸ்), அல்லது 101 (தீயணைப்பு) எண்களை உடனே அழைக்கவும்.',

    // Types
    typeFire: 'தீ விபத்து',
    typeMedical: 'மருத்துவ அவசரம்',
    typeFlood: 'மழை வெள்ளம் / நீர் தேக்கம்',
    typeEarthquake: 'நிலநடுக்கம்',
    typeRoadAccident: 'சாலை விபத்து',
    typeBuildingCollapse: 'கட்டிட இடிபாடு',
    typeViolenceCrime: 'வன்முறை / குற்றச் செயல்',
    typeOther: 'பிற அவசர நிலை',

    // Form fields
    selectType: 'அவசர உதவி வகையைத் தேர்ந்தெடுக்கவும்',
    descriptionLabel: 'அவசர விபரம்',
    descriptionPlaceholder: 'என்ன நடக்கிறது என்பதை விவரிக்கவும் (எ.கா: மின் மாற்றி தீப்பொறி, சாலையில் மழை வெள்ளம், சாலை விபத்து)...',
    charactersRemaining: 'எழுத்துக்கள் மீதம்',
    orUseVoice: 'அல்லது குரல் பதிவு மூலமும் விவரிக்கலாம்',

    // Location
    locationTitle: 'துல்லியமான இருப்பிடம்',
    useMyLocation: 'எனது தற்போதைய இருப்பிடத்தைப் பயன்படுத்து',
    locating: 'ஜிபிஎஸ் இருப்பிடம் பெறப்படுகிறது...',
    dragPinNotice: 'வரைபடத்தில் உள்ள குறியீட்டை நகர்த்தி சரியான இடத்தை அமைக்கவும்.',
    addressLabel: 'கண்டறியப்பட்ட முகவரி',
    landmarkLabel: 'அடையாள இடம் / தளம் / பகுதி (விருப்பத்தேர்வு)',
    landmarkPlaceholder: 'எ.கா., ஜெமினி மேம்பாலம் அருகில், சென்ட்ரல் ரயில் நிலையம் எதிரில், தி. நகர் பேருந்து நிலையம்',

    // Media & Voice
    mediaVoiceTitle: 'ஆதாரங்கள் & குரல் பதிவு',
    recordVoice: 'அவசர குரல் குறிப்பு பதிவு',
    recording: 'பதிவாகிறது... தெளிவாகப் பேசவும்',
    stopRecording: 'பதிவை நிறுத்து',
    speechToTextLive: 'நேரடி குரல் வழி உரை மாற்றி',
    listenAndTranscribe: 'பேசி உரையாக்கு',
    listening: 'கேட்கிறது...',
    uploadMedia: 'புகைப்படம் / வீடியோ இணைக்கவும்',
    captureCamera: 'புகைப்படம் எடு',
    dropFiles: 'கோப்புகளைத் தேர்ந்தெடுக்கவும்',
    compressionNotice: 'படங்கள் அனுப்பப்படுவதற்கு முன் சுருக்கப்படுகின்றன.',
    uploadProgress: 'பதிவேற்ற முன்னேற்றம்',

    // Step 4
    peopleAffectedLabel: 'பாதிக்கப்பட்ட நபர்களின் எண்ணிக்கை',
    injuriesPresent: 'காயமடைந்தவர்கள் உள்ளார்களா?',
    peopleTrapped: 'மக்கள் சிக்கியுள்ளார்களா?',
    hazardsLabel: 'நிலவும் ஆபத்துகள்',
    severityLabel: 'அபாய நிலை மதிப்பீடு',
    severityLow: 'குறைவு - சிறிய பிரச்சனை',
    severityMedium: 'நடுத்தரம் - உடனடி உதவி தேவை',
    severityHigh: 'அதிவேகம் - தீவிர உடனடி ஆபத்து',
    severityCritical: 'மிகத் தீவிர அபாயம் - உயிராபத்து',
    contactPhoneLabel: 'தொடர்பு தொலைபேசி எண் (விருப்பத்தேர்வு)',
    contactPhonePlaceholder: '+91 98765 43210',

    // Confirmation
    reportSubmittedTitle: 'அவசர உதவி பதிவு பெறப்பட்டது',
    reportIdLabel: 'பதிவு எண்',
    statusReceived: 'பெறப்பட்டது',
    statusVerified: 'சரிபார்க்கப்பட்டது',
    statusDispatched: 'படையினர் புறப்பட்டனர்',
    statusResolved: 'தீர்க்கப்பட்டது',
    queuedOfflineNotice: 'பதிவு பாதுகாப்பாக சேமிக்கப்பட்டுள்ளது. இணையம் இணைந்ததும் உடனே அனுப்பப்படும்.',
    backToHome: 'மற்றொரு பதிவு செய்ய',

    // Responder
    responderDashboardTitle: 'சென்னை அவசர மீட்புக் கட்டுப்பாட்டு அறை (TN 112 & GCC)',
    filterByType: 'வகை வடிகட்டி',
    filterByPriority: 'முன்னுரிமை வடிகட்டி',
    filterByStatus: 'நிலை வடிகட்டி',
    all: 'அனைத்தும்',
    totalReports: 'மொத்த பதிவுகள்',
    criticalP1: 'தீவிர நிலை P1',
    highP2: 'அதிகம் P2',
    mediumP3: 'நடுத்தரம் P3',
    lowP4: 'குறைவு P4',
    viewDetails: 'ஆய்வு செய்து அனுப்பு',
    priorityScore: 'முன்னுரிமை மதிப்பீடு',
    falseReportFlag: 'தவறான எச்சரிக்கை எனக் குறி',
    markDispatched: 'மீட்புப் படையை அனுப்பு',
    markResolved: 'தீர்க்கப்பட்டது எனக் குறி',
    markVerified: 'சரிபார்க்கப்பட்டது எனக் குறி',
  },
  es: {
    appName: 'Reporte de Emergencias Ciudadano',
    tagline: 'Despacho Rápido Móvil para Emergencias',
    citizenReport: 'Reportar Emergencia',
    responderPortal: 'Panel de Rescatistas',
    chartsTab: 'Gráficos',
    offlineMode: 'Modo sin conexión (Cola activa)',
    online: 'En línea',
    syncing: 'Sincronizando reportes...',
    syncNow: 'Sincronizar ahora',
    privacyConsent: 'Privacidad y Permisos',
    consentDescription: 'Solicitamos permisos de ubicación, cámara y micrófono únicamente para ayudar a los servicios de rescate a localizarle con rapidez.',
    grantConsent: 'Entendido y Acepto',
    privacyNotice: 'Su privacidad es respetada. El teléfono es opcional para que los rescatistas le contacten.',

    step1Title: 'Tipo y Descripción',
    step2Title: 'Ubicación y Mapa',
    step3Title: 'Fotos y Voz',
    step4Title: 'Afectados y Peligros',
    nextStep: 'Siguiente',
    prevStep: 'Atrás',
    submitReport: 'Enviar Reporte de Emergencia',
    submitting: 'Enviando...',
    urgentHelpNotice: 'Si su vida corre peligro inmediato, llame también al 911 / 112.',

    typeFire: 'Incendio',
    typeMedical: 'Médica',
    typeFlood: 'Inundación',
    typeEarthquake: 'Terremoto',
    typeRoadAccident: 'Accidente de Tráfico',
    typeBuildingCollapse: 'Derrumbe',
    typeViolenceCrime: 'Violencia / Delito',
    typeOther: 'Otra Emergencia',

    selectType: 'Seleccionar Tipo de Emergencia',
    descriptionLabel: 'Describa la emergencia',
    descriptionPlaceholder: '¿Qué está ocurriendo? Describa lo que ve...',
    charactersRemaining: 'caracteres',
    orUseVoice: 'O use su voz pulsando abajo',

    locationTitle: 'Ubicación Exacta',
    useMyLocation: 'Usar Mi Ubicación Actual',
    locating: 'Obteniendo GPS...',
    dragPinNotice: 'Arrastre el marcador en el mapa para ajustar la posición.',
    addressLabel: 'Dirección Detectada',
    landmarkLabel: 'Punto de referencia / Piso / Unidad (Opcional)',
    landmarkPlaceholder: 'ej., piso 2, cerca de puerta norte',

    mediaVoiceTitle: 'Evidencia y Audio',
    recordVoice: 'Grabar Nota de Voz',
    recording: 'Grabando... Hable con claridad',
    stopRecording: 'Detener Grabación',
    speechToTextLive: 'Transcripción de voz en vivo',
    listenAndTranscribe: 'Hablar y Transcribir',
    listening: 'Escuchando...',
    uploadMedia: 'Adjuntar Fotos / Video',
    captureCamera: 'Tomar Foto',
    dropFiles: 'Toque para seleccionar o capturar',
    compressionNotice: 'Las imágenes se comprimen automáticamente en el dispositivo.',
    uploadProgress: 'Progreso de subida',

    peopleAffectedLabel: 'Número de personas afectadas',
    injuriesPresent: '¿Hay heridos?',
    peopleTrapped: '¿Hay personas atrapadas?',
    hazardsLabel: 'Peligros Activos',
    severityLabel: 'Severidad Estimada',
    severityLow: 'Baja - Problema menor',
    severityMedium: 'Media - Atención urgente necesaria',
    severityHigh: 'Alta - Riesgo severo inmediato',
    severityCritical: 'Crítica - Peligro mortal',
    contactPhoneLabel: 'Teléfono de contacto (Opcional)',
    contactPhonePlaceholder: '+91 98765 43210',

    reportSubmittedTitle: 'Reporte de Emergencia Recibido',
    reportIdLabel: 'ID del Reporte',
    statusReceived: 'Recibido',
    statusVerified: 'Verificado',
    statusDispatched: 'Despachado',
    statusResolved: 'Resuelto',
    queuedOfflineNotice: 'Reporte guardado en la cola local. Se enviará automáticamente cuando vuelva la conexión.',
    backToHome: 'Enviar Otro Reporte',

    responderDashboardTitle: 'Centro de Mando de Rescate en Tiempo Real',
    filterByType: 'Filtrar Tipo',
    filterByPriority: 'Filtrar Prioridad',
    filterByStatus: 'Filtrar Estado',
    all: 'Todos',
    totalReports: 'Total de Reportes',
    criticalP1: 'Crítica P1',
    highP2: 'Alta P2',
    mediumP3: 'Media P3',
    lowP4: 'Baja P4',
    viewDetails: 'Inspeccionar y Triar',
    priorityScore: 'Puntuación de Prioridad',
    falseReportFlag: 'Marcar Falsa Alarma',
    markDispatched: 'Despachar Unidades',
    markResolved: 'Marcar como Resuelto',
    markVerified: 'Marcar como Verificado',
  },
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => translations.en[key] || key,
});

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('emergency_lang') as Language;
      if (saved === 'ta' || saved === 'en' || saved === 'es') return saved;
      if (navigator.language.startsWith('ta')) return 'ta';
    }
    return 'en';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('emergency_lang', lang);
    }
  }, [lang]);

  const t = (key: keyof typeof translations.en): string => {
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
