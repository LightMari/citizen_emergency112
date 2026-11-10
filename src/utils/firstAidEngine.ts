import { EmergencyType, HazardType } from '../types/report';

export interface FirstAidStep {
  instruction: string;
  warning?: string;
}

export interface FirstAidGuidance {
  title: string;
  callToAction: string;
  emergencyNumber: string;
  steps: FirstAidStep[];
  doNot: string[];
}

const FIRST_AID_DB: Record<EmergencyType, FirstAidGuidance> = {
  Fire: {
    title: "Fire Emergency — Immediate Actions",
    callToAction: "Call Tamil Nadu Fire & Rescue (TNFRS): 101",
    emergencyNumber: "101",
    steps: [
      { instruction: "Alert everyone nearby. Shout 'FIRE!' repeatedly and activate the nearest fire alarm if available." },
      { instruction: "Evacuate immediately. Use stairs — NEVER use lifts/elevators during a fire." },
      { instruction: "Stay low below the smoke. Crawl if necessary — smoke rises, cleaner air is near the floor." },
      { instruction: "Before opening any door, touch it with the back of your hand. If it is hot, do NOT open it — find another exit." },
      { instruction: "If clothes catch fire: STOP, DROP, and ROLL on the ground until the flames are out." },
      { instruction: "Once outside, move at least 100 metres away from the building and do NOT re-enter for any reason.", warning: "Re-entering a burning building is the #1 cause of civilian fire deaths." },
      { instruction: "If someone has burns: cool with running water for 20 minutes. Cover loosely with clean cloth. Do NOT apply ice, butter, or toothpaste." },
    ],
    doNot: [
      "Do NOT use elevators/lifts",
      "Do NOT re-enter the building",
      "Do NOT break windows unless it is your only escape",
      "Do NOT apply ice or butter on burns",
      "Do NOT waste time collecting belongings",
    ],
  },
  Medical: {
    title: "Medical Emergency — Life-Saving First Aid",
    callToAction: "Call 108 Emergency Ambulance (Tamil Nadu)",
    emergencyNumber: "108",
    steps: [
      { instruction: "Check if the person is conscious. Tap their shoulders firmly and shout 'Are you okay?'" },
      { instruction: "If unconscious and not breathing: Begin CPR immediately. Push hard and fast on the centre of the chest — 100 to 120 compressions per minute, at least 5 cm deep." },
      { instruction: "Call for an AED (Automated External Defibrillator) if available at the location. Follow the device's voice instructions." },
      { instruction: "If the person is breathing but unconscious: Place them in the recovery position (on their side) to prevent choking." },
      { instruction: "For severe bleeding: Apply firm, direct pressure with a clean cloth. Elevate the injured limb above heart level. Do NOT remove the cloth — add more layers on top." },
      { instruction: "For suspected heart attack (chest pain, shortness of breath, pain in left arm/jaw): Help the person sit upright leaning forward. Give aspirin if available and they are not allergic. Keep them calm.", warning: "Every minute without CPR reduces survival by 10%." },
      { instruction: "For choking: Stand behind the person, place your fist above their navel, and perform upward abdominal thrusts (Heimlich manoeuvre) until the object is expelled." },
    ],
    doNot: [
      "Do NOT move someone with a suspected spinal injury",
      "Do NOT give water to an unconscious person",
      "Do NOT remove embedded objects from wounds",
      "Do NOT attempt to set broken bones yourself",
      "Do NOT stop CPR until professional help arrives",
    ],
  },
  Flood: {
    title: "Flood Emergency — Safety Protocol",
    callToAction: "Call NDRF / SDRF Helpline: 1078 or TN 112",
    emergencyNumber: "112",
    steps: [
      { instruction: "Move to higher ground immediately. Do NOT wait for official orders if water is rising rapidly." },
      { instruction: "Turn off electricity at the mains if water enters your home. Electrocution is a major flood killer.", warning: "Do NOT touch electrical equipment if you are standing in water." },
      { instruction: "Do NOT attempt to walk or drive through floodwater. 15 cm of moving water can knock you down. 60 cm can sweep away a vehicle." },
      { instruction: "If trapped in a vehicle in rising water: Unbuckle seatbelt, open window immediately, climb onto the roof. Do NOT open doors against water pressure." },
      { instruction: "If trapped in a building: Move to the highest floor. Signal for help from windows or the roof using bright cloth or a torch." },
      { instruction: "Drink only boiled or purified water. Floodwater is contaminated with sewage, chemicals, and disease." },
      { instruction: "Watch for snakes and animals displaced by flooding — they seek higher ground too." },
    ],
    doNot: [
      "Do NOT walk through moving floodwater",
      "Do NOT drive through flooded roads",
      "Do NOT touch electrical switches if standing in water",
      "Do NOT drink floodwater or use it for cooking",
      "Do NOT return home until officials declare it safe",
    ],
  },
  'Road Accident': {
    title: "Road Accident — Bystander First Response",
    callToAction: "Call Tamil Nadu Emergency: 112 or Ambulance: 108",
    emergencyNumber: "112",
    steps: [
      { instruction: "Ensure your own safety first. Park away from the accident, turn on hazard lights, and set up warning triangles if available." },
      { instruction: "Call 112 immediately. Report: location, number of vehicles, number of injured, any fire or fuel leak." },
      { instruction: "Do NOT move injured persons unless there is immediate danger (fire, explosion). Moving a spinal injury victim can cause paralysis." },
      { instruction: "If someone is bleeding severely: Apply firm pressure with any clean cloth. Do NOT tie a tourniquet unless trained." },
      { instruction: "If a person is unconscious but breathing: Tilt their head back slightly to keep the airway open. Place them on their side (recovery position)." },
      { instruction: "Turn off ignitions of all involved vehicles to reduce fire risk. Do NOT smoke near the scene." },
      { instruction: "Under Indian Good Samaritan Law (Supreme Court 2016): You CANNOT be held liable for helping an accident victim. Hospitals must treat them without demanding documents or payment." },
    ],
    doNot: [
      "Do NOT move the victim unless there is fire/explosion risk",
      "Do NOT remove a helmet from a two-wheeler rider",
      "Do NOT give water or food to someone with abdominal injuries",
      "Do NOT crowd around — give space for responders",
      "Do NOT leave the scene if you are a witness — your statement helps",
    ],
  },
  'Building Collapse': {
    title: "Building Collapse — Survival & Rescue Protocol",
    callToAction: "Call NDRF Helpline: 1078 or TN 112",
    emergencyNumber: "112",
    steps: [
      { instruction: "If trapped: Cover your nose and mouth with cloth to filter dust. Tap on pipes or walls at regular intervals — rescuers listen for this." },
      { instruction: "Do NOT shout unless you hear rescuers directly above you. Shouting wastes oxygen and you may inhale dangerous dust.", warning: "Concrete dust can cause severe lung damage." },
      { instruction: "Protect your head. Curl into a ball (foetal position) near a strong structure — beside a large sofa, heavy desk, or load-bearing wall." },
      { instruction: "If you can move: Do NOT use elevators. Move carefully towards light or fresh air." },
      { instruction: "If you see others trapped: Do NOT attempt to lift heavy debris yourself — you may cause secondary collapse. Mark the location and inform rescue teams." },
      { instruction: "Stay away from damaged buildings — aftershocks or secondary collapses can occur hours later." },
    ],
    doNot: [
      "Do NOT re-enter a partially collapsed building",
      "Do NOT use elevators in a damaged building",
      "Do NOT attempt to lift heavy debris alone",
      "Do NOT use open flames (lighters/matches) — gas leaks may be present",
      "Do NOT ignore small injuries — dust and debris carry infection risk",
    ],
  },
  Earthquake: {
    title: "Earthquake — Drop, Cover, Hold On",
    callToAction: "Call NDRF: 1078 or TN Emergency: 112",
    emergencyNumber: "112",
    steps: [
      { instruction: "DROP to your hands and knees. COVER your head and neck under a sturdy desk or table. HOLD ON to the legs until shaking stops." },
      { instruction: "If no shelter: Drop against an interior wall, cover your head and neck with your arms. Stay away from windows, glass, and heavy objects." },
      { instruction: "If outdoors: Move to an open area away from buildings, trees, power lines. Drop to the ground and cover your head." },
      { instruction: "If in a vehicle: Pull over safely, set parking brake. Stay inside with seatbelt on until shaking stops. Avoid bridges and overpasses." },
      { instruction: "After shaking stops: Check for injuries. Expect aftershocks — they can be nearly as strong as the main quake." },
      { instruction: "Check for gas leaks (smell), damaged electrical wiring, water pipe breaks. Turn off utilities if you suspect damage." },
    ],
    doNot: [
      "Do NOT stand in doorways — this is a myth",
      "Do NOT run outside during shaking",
      "Do NOT use elevators after an earthquake",
      "Do NOT use open flames until you confirm no gas leak",
      "Do NOT go near the coast — tsunami risk after offshore quakes",
    ],
  },
  'Violence/Crime': {
    title: "Violence / Security Threat — Personal Safety",
    callToAction: "Call Police: 100 or TN Emergency: 112",
    emergencyNumber: "100",
    steps: [
      { instruction: "RUN if there is a safe escape path. Do not hesitate — leave belongings behind. Help others escape if possible without putting yourself at risk." },
      { instruction: "HIDE if escape is not possible. Lock and barricade doors. Silence your phone completely (not just vibrate). Stay out of sight." },
      { instruction: "Call 112 or 100 when it is safe to do so. Whisper your location and the number of attackers if you can see them." },
      { instruction: "If you witness a crime in progress: Do NOT intervene physically unless you are trained. Be a good witness — note descriptions, vehicle plates, direction of movement." },
      { instruction: "For stabbing/gunshot wounds: Apply heavy pressure with cloth. Do NOT remove the weapon if it is still embedded. Keep the victim warm and talking." },
      { instruction: "When police arrive: Keep your hands visible and empty. Follow all instructions. Do NOT point or make sudden movements." },
    ],
    doNot: [
      "Do NOT engage or negotiate with armed attackers",
      "Do NOT attempt to record video if it puts you at risk",
      "Do NOT touch any evidence at a crime scene",
      "Do NOT post information about ongoing incidents on social media — it can alert perpetrators",
      "Do NOT open doors for anyone during a lockdown unless you are certain they are police",
    ],
  },
  Other: {
    title: "General Emergency — Stay Calm Protocol",
    callToAction: "Call Tamil Nadu Unified Emergency: 112",
    emergencyNumber: "112",
    steps: [
      { instruction: "Stay calm. Take a deep breath. Panic causes poor decisions — you have time to think." },
      { instruction: "Assess the situation: What happened? Is anyone injured? Is there immediate danger to you or others?" },
      { instruction: "Call 112 (Tamil Nadu Unified Emergency). Tell them: What happened, where you are, how many people are affected, what help you need." },
      { instruction: "Move to a safe location if the area is dangerous. Bring others with you if safe to do so." },
      { instruction: "Provide basic first aid if you can: Direct pressure on bleeding wounds, recovery position for unconscious breathing people, reassurance for those in shock." },
      { instruction: "When help arrives: Give a clear, factual account. Point out the most seriously injured people first." },
    ],
    doNot: [
      "Do NOT panic or spread unverified information",
      "Do NOT crowd the scene — give space for responders",
      "Do NOT move injured persons unless immediate danger",
      "Do NOT touch unknown substances or suspicious packages",
    ],
  },
};

/**
 * Returns first-aid guidance for a given emergency type.
 */
export function getFirstAidGuidance(type: EmergencyType): FirstAidGuidance {
  return FIRST_AID_DB[type] ?? FIRST_AID_DB['Other'];
}

/**
 * AI-like keyword detection: Classifies emergency type from speech text.
 * Uses weighted keyword matching to determine the most likely emergency.
 */
export function classifyEmergencyFromSpeech(text: string): {
  type: EmergencyType;
  confidence: number;
  detectedKeywords: string[];
  hazards: HazardType[];
  injuries: boolean;
  trapped: boolean;
} {
  const lower = text.toLowerCase();

  const keywordMap: Record<EmergencyType, { keywords: string[]; weight: number }[]> = {
    Fire: [
      { keywords: ['fire', 'theep', 'nerppu', 'neruppu'], weight: 10 },
      { keywords: ['flames', 'flame', 'burning', 'burnt', 'ablaze'], weight: 8 },
      { keywords: ['smoke', 'pukai'], weight: 7 },
      { keywords: ['explosion', 'blast', 'exploded', 'vedipu'], weight: 9 },
      { keywords: ['gas leak', 'cylinder', 'lpg'], weight: 6 },
      { keywords: ['fire engine', 'fire truck', 'fire brigade'], weight: 8 },
    ],
    Medical: [
      { keywords: ['heart attack', 'chest pain', 'cardiac'], weight: 10 },
      { keywords: ['not breathing', 'stopped breathing', 'no pulse'], weight: 10 },
      { keywords: ['unconscious', 'fainted', 'collapsed', 'faint', 'mayangivitta'], weight: 8 },
      { keywords: ['choking', 'cannot breathe', 'difficulty breathing', 'asthma'], weight: 9 },
      { keywords: ['bleeding', 'blood', 'wound', 'cut', 'ratham'], weight: 7 },
      { keywords: ['ambulance', 'doctor', 'hospital', 'maruthuvam'], weight: 6 },
      { keywords: ['stroke', 'seizure', 'epilepsy', 'fits', 'vali'], weight: 8 },
      { keywords: ['snake bite', 'dog bite', 'bite', 'poisoning', 'poison'], weight: 8 },
      { keywords: ['pregnant', 'delivery', 'labour', 'baby coming', 'prasavam'], weight: 9 },
    ],
    Flood: [
      { keywords: ['flood', 'flooding', 'vellam', 'inundated'], weight: 10 },
      { keywords: ['water rising', 'water level', 'submerged'], weight: 9 },
      { keywords: ['drowning', 'drown', 'swept away'], weight: 9 },
      { keywords: ['waterlogging', 'rain water', 'overflow', 'canal overflow'], weight: 7 },
      { keywords: ['heavy rain', 'cyclone', 'storm', 'mazhai', 'puyal'], weight: 6 },
    ],
    'Road Accident': [
      { keywords: ['accident', 'crash', 'collision', 'vipathu'], weight: 10 },
      { keywords: ['car accident', 'bike accident', 'bus accident', 'lorry accident', 'truck accident'], weight: 10 },
      { keywords: ['hit and run', 'hit by vehicle', 'run over'], weight: 9 },
      { keywords: ['overturned', 'vehicle overturned', 'flipped'], weight: 8 },
      { keywords: ['road block', 'traffic accident'], weight: 6 },
    ],
    'Building Collapse': [
      { keywords: ['collapse', 'collapsed', 'building fell', 'building down'], weight: 10 },
      { keywords: ['rubble', 'debris', 'trapped under', 'crushed'], weight: 9 },
      { keywords: ['wall fell', 'roof collapsed', 'floor collapsed', 'ceiling fell'], weight: 9 },
      { keywords: ['construction accident', 'crane fell'], weight: 7 },
    ],
    Earthquake: [
      { keywords: ['earthquake', 'quake', 'tremor', 'seismic', 'bhukambam'], weight: 10 },
      { keywords: ['shaking', 'ground shaking', 'building swaying'], weight: 8 },
      { keywords: ['aftershock'], weight: 7 },
    ],
    'Violence/Crime': [
      { keywords: ['attack', 'attacking', 'attacker', 'stabbing', 'stabbed'], weight: 10 },
      { keywords: ['gun', 'gunshot', 'shooting', 'shot fired'], weight: 10 },
      { keywords: ['robbery', 'theft', 'stolen', 'robbed', 'looting'], weight: 8 },
      { keywords: ['kidnap', 'kidnapping', 'abducted', 'hostage'], weight: 10 },
      { keywords: ['fight', 'fighting', 'riot', 'mob', 'crowd violence'], weight: 7 },
      { keywords: ['bomb', 'bomb threat', 'suspicious package', 'explosive'], weight: 10 },
      { keywords: ['help', 'someone help', 'please help', 'danger'], weight: 3 },
    ],
    Other: [
      { keywords: ['help', 'emergency', 'danger', 'urgently', 'udhavi'], weight: 2 },
      { keywords: ['chemical', 'spill', 'leak', 'toxic', 'hazardous'], weight: 5 },
      { keywords: ['animal', 'stray dog', 'wild animal', 'leopard', 'crocodile'], weight: 4 },
    ],
  };

  const scores: Record<EmergencyType, { score: number; keywords: string[] }> = {
    Fire: { score: 0, keywords: [] },
    Medical: { score: 0, keywords: [] },
    Flood: { score: 0, keywords: [] },
    'Road Accident': { score: 0, keywords: [] },
    'Building Collapse': { score: 0, keywords: [] },
    Earthquake: { score: 0, keywords: [] },
    'Violence/Crime': { score: 0, keywords: [] },
    Other: { score: 0, keywords: [] },
  };

  for (const [type, groups] of Object.entries(keywordMap)) {
    for (const group of groups) {
      for (const keyword of group.keywords) {
        if (lower.includes(keyword)) {
          scores[type as EmergencyType].score += group.weight;
          scores[type as EmergencyType].keywords.push(keyword);
        }
      }
    }
  }

  // Find the best match
  let bestType: EmergencyType = 'Other';
  let bestScore = 0;
  for (const [type, data] of Object.entries(scores)) {
    if (data.score > bestScore) {
      bestScore = data.score;
      bestType = type as EmergencyType;
    }
  }

  // Confidence: normalize to 0-100
  const maxPossible = 30;
  const confidence = Math.min(Math.round((bestScore / maxPossible) * 100), 100);

  // Detect hazards
  const hazards: HazardType[] = [];
  if (lower.includes('fire') || lower.includes('smoke') || lower.includes('burning')) hazards.push('Fire/smoke');
  if (lower.includes('gas') || lower.includes('leak') || lower.includes('cylinder')) hazards.push('Gas leak');
  if (lower.includes('collapse') || lower.includes('falling') || lower.includes('cracking')) hazards.push('Structural collapse risk');
  if (lower.includes('chemical') || lower.includes('toxic') || lower.includes('hazardous')) hazards.push('Hazardous materials');
  if (lower.includes('gun') || lower.includes('knife') || lower.includes('weapon') || lower.includes('armed')) hazards.push('Armed threat');
  if (lower.includes('flood') || lower.includes('water rising') || lower.includes('drowning')) hazards.push('Rising water');

  // Detect injuries and trapped persons
  const injuries = /injur|bleed|blood|hurt|wound|pain|broken|fracture|unconscious|faint|burn/.test(lower);
  const trapped = /trap|stuck|pinned|buried|can't move|locked in|stranded/.test(lower);

  return {
    type: bestType,
    confidence,
    detectedKeywords: scores[bestType].keywords,
    hazards,
    injuries,
    trapped,
  };
}
