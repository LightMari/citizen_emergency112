# 🚨 Citizen Emergency Reporting (PWA)

A mobile-first, offline-first Progressive Web App designed to let citizens report emergencies in under 60 seconds—even in disaster zones with intermittent connectivity—while providing rescue dispatchers with a real-time command dashboard featuring automated priority scoring, field telemetry, and interactive maps.

---

## 🌟 Key Features

### 1. Citizen Emergency Reporting Flow (Under 60 Seconds)
- **High-Contrast Touch Controls**: Optimized for one-handed operation and high stress, with 48px+ touch targets and WCAG AA contrast.
- **8 Core Emergency Types**: Fire, Medical, Flood, Earthquake, Road Accident, Building Collapse, Violence/Crime, Other.
- **Location Pinpointing**:
  - One-tap GPS acquisition via the browser **Geolocation API**.
  - Interactive OpenStreetMap via **Leaflet** (no API key required) with draggable emergency pin.
  - Automatic reverse geocoding via Nominatim with optional landmark and unit descriptions.
- **Media & Voice Capture**:
  - **Audio Recording**: Native microphone capture via `MediaRecorder` API with playback controls and duration timers.
  - **Speech-to-Text**: Live voice transcription via `Web Speech API`, auto-populating or appending to the incident description.
  - **Client-Side Image Compression**: HTML5 Canvas resizing and JPEG/WebP compression (reducing payload sizes by up to 80-90% before transmission).
  - Multi-file attachments with preview and removal.
- **Casualty & Hazard Matrix**:
  - Stepper count for people affected.
  - High-visibility toggles for *Injuries Present* and *People Trapped*.
  - 6 rapid hazard flags: Fire/Smoke, Gas Leak, Structural Collapse, Hazardous Materials, Armed Threat, Rising Water.
  - Self-assessed severity rating (Low, Medium, High, Critical) and optional callback telephone number.

### 2. Offline-First Architecture & Auto-Sync
- **IndexedDB Persistent Queue**: Built with Dexie.js (`EmergencyReportingDB`).
- Reports submitted while offline are safely staged in the local queue with media blobs intact.
- **Automatic Background Sync**: Network listeners and Service Worker auto-flush queued reports the instant internet connectivity is restored.
- **PWA Ready**: Manifest, standalone fullscreen support, and offline caching service worker.

### 3. Automated Priority Scoring Algorithm (Responders Only)
Calculates a deterministic 0–100 urgency score:
$$\text{Priority Score} = \min(100, \text{Severity} + \text{Trapped (25)} + \text{Injuries (20)} + \text{PeopleAffected (0-20)} + \sum \text{Hazards (10-20)})$$
- **P1 Critical (≥ 75)**: Urgent life-safety dispatch with flashing alert.
- **P2 High (50–74)**: Elevated response.
- **P3 Medium (25–49)**: Standard priority.
- **P4 Low (< 25)**: Non-immediate response.

### 4. Responder Command Dashboard
- **Live Interactive Map**: Color-coded markers (P1 Red, P2 Orange, P3 Yellow, P4 Blue) with incident popups.
- **Cross-Tab Real-Time Sync**: Instant incident broadcast via BroadcastChannel/WebSockets with audio alert chime for incoming P1/P2 emergencies.
- **Incident Triage & Inspection Modal**:
  - Audio memo playback.
  - Full-resolution photo/video lightbox gallery.
  - Detailed score breakdown (severity, trapped, injured, hazards).
  - Status progression: `Received` ➔ `Verified` ➔ `Dispatched` ➔ `Resolved`.
- **Anti-Abuse & Deduplication**:
  - Proximity and time clustering (Haversine formula within 350m and 20 min).
  - Device rate limiting (maximum 5 submissions per 10 minutes).
  - "Flag False Alarm / Hoax" with reason logging.

### 5. Multilingual & Privacy
- **Bilingual Support**: Instant toggle between English (`EN`) and Spanish (`ES`).
- **Privacy First**: Transparent consent dialog before accessing Geolocation, Camera, or Microphone.

---

## 🚀 Quick Start

### Prerequisites
- Node.js `v18+` (Tested on Node `v22.22.2`)
- npm `v9+`

### Installation
```bash
# Clone and enter the workspace
cd /home/maries/Desktop/hackton_project

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit the app at: **`http://localhost:3000`**

---

## 🧪 Testing

Run all unit and end-to-end integration tests:
```bash
npm test
```

### Test Coverage Highlights:
- `src/test/priority.test.ts`: Verifies priority scoring logic across all casualty, hazard, and severity permutations.
- `src/test/validation.test.ts`: Verifies Zod schema validation (coordinates, phone numbers, character counters, mandatory voice/text requirement).
- `src/test/report-flow.test.tsx`: Complete end-to-end simulation of a citizen submitting an emergency report through all 4 steps and verifying receipt on the tracking screen.

---

## 📂 Project Architecture

```
citizen-emergency-reporting/
├── index.html                   # Mobile-first viewport, Leaflet CSS & SW registration
├── public/
│   ├── manifest.json            # PWA manifest
│   └── sw.js                    # Service worker for offline asset caching
├── src/
│   ├── main.tsx                 # App mount
│   ├── App.tsx                  # Root state & view switcher
│   ├── index.css                # Tailwind styling & Leaflet overrides
│   ├── types/
│   │   └── report.ts            # EmergencyReport, Media, Status, Hazard types
│   ├── utils/
│   │   ├── priority.ts          # 0-100 Priority scoring algorithm
│   │   ├── validation.ts        # Zod validation schemas
│   │   ├── compression.ts       # HTML5 Canvas image compressor
│   │   └── deduplication.ts     # Haversine distance & time proximity
│   ├── services/
│   │   ├── offlineDb.ts         # Dexie IndexedDB offline queue
│   │   ├── syncManager.ts       # Auto-sync queue manager
│   │   └── mockBackend.ts       # Sample seed reports, rate limiter & real-time broadcast
│   ├── hooks/
│   │   ├── useGeolocation.ts    # Browser GPS & Nominatim reverse geocoder
│   │   ├── useVoiceRecorder.ts  # MediaRecorder microphone audio capture
│   │   ├── useSpeechRecognition.ts # Web Speech API live voice-to-text
│   │   └── useNetworkStatus.ts  # Online/Offline connection listener
│   ├── i18n/
│   │   └── index.tsx            # English & Spanish translations & context
│   ├── components/
│   │   ├── common/              # Navbar, PrivacyConsentModal
│   │   ├── report/              # 4-step wizard & ConfirmationScreen
│   │   └── responder/           # ResponderDashboard, ResponderMap & ReportDetailModal
│   └── test/                    # Vitest unit and integration test suite
└── package.json
```

---

## 🕹️ Demo Walkthrough

1. **Submit an Incident**:
   - Tap **"Fire"**, type or speak a quick description.
   - On the **Location** step, tap *"Use My Current Location"* or drag the red emergency pin.
   - On the **Media** step, test the audio recorder or speech-to-text transcription.
   - On the **Impact** step, toggle *Injuries* and *Trapped Persons*, pick hazards, and tap **"Submit Emergency Report"**.
2. **Follow Live Tracking**:
   - View your generated `REP-XXXX` report ID.
   - Tap *"Simulate Responder Progress"* to watch the incident transition from `Received` ➔ `Verified` ➔ `Dispatched` ➔ `Resolved`.
3. **Open Responder Portal**:
   - Click **"Responder Dashboard"** in the top navigation.
   - See your newly submitted report immediately reflected in the queue and plotted on the interactive map with its calculated Priority Tier (P1–P4).
   - Click any card to inspect media, play back audio memos, adjust dispatch status, or flag false alarms.
4. **Test Offline Queue**:
   - Turn off Wi-Fi or toggle DevTools Network to *Offline*.
   - Submit a report: notice the offline indicator and queued state.
   - Reconnect to the internet: watch the queue automatically flush and sync!
