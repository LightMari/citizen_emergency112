# 🚨 Citizen Emergency 112

> **Citizen Emergency Reporting, Automated Geolocation Dispatch, and Real-Time First Responder Coordination Platform.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B.svg)
![Dart](https://img.shields.io/badge/Dart-3.x-0175C2.svg)
![NodeJS](https://img.shields.io/badge/Node.js-18.x%20%7C%2020.x-339933.svg)
![Express](https://img.shields.io/badge/Express-4.x-000000.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%7C%20Local-47A248.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)

---

## 📌 Problem Statement

In life-critical emergency events—such as vehicular accidents, medical crises, crimes in progress, and fires—every second directly impacts survival rates. While modern emergency dispatch networks (such as India's unified **Emergency Response Support System (ERSS - Dial 112)**) have centralized multi-agency helplines, ordinary citizens still encounter severe friction when trying to report incidents under stress:

1. **Panic and Communication Breakdown:** Callers in shock or under duress frequently struggle to articulate landmarks, street addresses, or their exact coordinates over traditional voice calls.
2. **Delayed Dispatch Routing:** Traditional dispatch centers must manually interview callers to triage whether to route calls to Police, Fire, or Medical units, creating costly delays in dispatch queues.
3. **Information Asymmetry:** Emergency responders often navigate to scenes blind to critical situational context, such as photo evidence, victim count, real-time GPS breadcrumbs, or pertinent medical histories (blood group, emergency contacts).

**Citizen Emergency 112** bridges this critical gap. It is an end-to-end mobile and dispatch platform enabling users to trigger instant SOS alarms with automated high-accuracy GPS geotagging, silent distress dispatches, media-assisted reporting, and real-time agency coordination.

---

## 🚀 Features

| Feature | Subsystem | Engineering Mechanism | Output Artifact | Status |
|---|---|---|---|---|
| **One-Tap Emergency SOS** | Mobile Client (`sos_service.dart`) | Native GPS hardware hook collecting instantaneous high-precision latitude/longitude coordinates and battery status. | Formatted emergency SOS dispatch event with live breadcrumb tracking. | **Production** |
| **Multi-Agency Triage** | Dispatch Gateway (`incidentController.js`) | Automated categorization routing alarms to Police, Fire, Ambulance, or Disaster Management pools. | Categorized dispatch incident tickets assigned to closest zone centers. | **Production** |
| **Silent Panic Distress** | Safety Module (`stealth_mode.dart`) | Rapid tap or screen-off gesture to trigger silent SOS dispatch without audible cues or screen brightening. | Dispatched stealth alarm with background audio recording and silent location uplink. | **Production** |
| **Media Incident Evidence** | Media Uploader (`report_incident.dart`) | Compressed image and video stream upload over low-bandwidth cellular links (3G/4G). | Cloud-stored image/video URLs linked directly to the operator's active incident log. | **Production** |
| **Emergency Contacts SMS** | Alerting Engine (`smsService.js`) | Automated SMS/WhatsApp gateway relaying distress coordinates and Google Maps links to designated family. | Direct notification sent to personal emergency contacts. | **Production** |
| **Operator Control Room** | Web Dashboard (`admin_portal/`) | Real-time interactive map interface showing live active distress beacons and unit assignments. | Web-based geospatial GIS map view with incident lifecycle management. | **Production** |

---

## 🏗️ Tech Stack

### Mobile Client (Cross-Platform)
| Component | Technology | Role in Architecture |
|---|---|---|
| **Framework** | Flutter (Dart 3.x) | High-performance, cross-platform Android and iOS application shell. |
| **Location Services** | `geolocator` & Google Maps SDK | High-accuracy foreground and background GPS telemetry capture. |
| **Local Storage** | `shared_preferences` / `Hive` | Encrypted offline caching of user profile, blood group, and emergency contacts. |
| **Networking** | `http` / `dio` | Asynchronous REST and multipart requests with automatic retry policies. |

### Backend Dispatch & Control Server
| Component | Technology | Role in Architecture |
|---|---|---|
| **Runtime** | Node.js (v18+ LTS) | High-concurrency event-driven asynchronous server execution. |
| **API Framework** | Express.js | Modular REST endpoints for incident creation, tracking, and responder assignment. |
| **Authentication** | JWT & OTP Gateway | Mobile number verification and role-based access for field responders and operators. |
| **Database** | MongoDB / Mongoose | Geospatial GeoJSON document store (`2dsphere` indexes for radius queries). |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Real-time push dispatch alerts to responder field devices. |

---

## 📂 Project Structure

```
citizen_emergency112/
├── backend/
│   ├── config/
│   │   ├── db.js                   # MongoDB connection logic
│   │   └── sms_gateway.js          # SMS provider integration (Twilio / Msg91)
│   ├── controllers/
│   │   ├── authController.js       # User and responder registration & login
│   │   ├── emergencyController.js  # SOS triggers and multi-agency routing
│   │   └── responderController.js  # Unit tracking and status updates
│   ├── models/
│   │   ├── User.js                 # User profile, medical info, and emergency contacts
│   │   ├── Emergency.js            # Incident records with GeoJSON location fields
│   │   └── Responder.js            # Field unit state (Police/Ambulance/Fire)
│   ├── routes/
│   │   ├── api.js                  # Centralized Express route manifest
│   │   └── emergencyRoutes.js      # Public and protected SOS endpoints
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification middleware
│   │   └── upload.js               # Multer evidence file handling
│   ├── server.js                   # Express application initialization
│   └── package.json
│
├── mobile_app/
│   ├── android/                    # Native Android manifest and permission configs
│   ├── ios/                        # iOS configuration and permission entries
│   ├── lib/
│   │   ├── main.dart               # Flutter application entry point
│   │   ├── models/
│   │   │   ├── incident.dart       # Incident data models
│   │   │   └── user_profile.dart   # Local user profile and contact structures
│   │   ├── screens/
│   │   │   ├── home_sos_screen.dart# Primary one-tap panic button screen
│   │   │   ├── report_screen.dart  # Form with photo/video upload and incident type
│   │   │   ├── contacts_screen.dart# Emergency contact configuration
│   │   │   └── tracking_screen.dart# Live view of approaching emergency vehicle
│   │   ├── services/
│   │   │   ├── location_service.dart# GPS background and foreground location streamer
│   │   │   ├── api_service.dart     # HTTP client for backend dispatch calls
│   │   │   └── storage_service.dart # Local device cache
│   │   └── widgets/
│   │       ├── sos_button.dart     # Animated ripple SOS button
│   │       └── agency_card.dart    # Category selector (Police, Medical, Fire)
│   └── pubspec.yaml                # Flutter dependencies and assets manifest
│
├── .env.example                    # Sample environment variables
├── .gitignore
├── LICENSE
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Flutter SDK:** Version `3.19.x` or higher
- **Dart SDK:** Version `3.x`
- **Node.js:** `v18.x` or `v20.x` & `npm`
- **MongoDB:** Local instance running on port `27017` or a MongoDB Atlas URI
- **Android Studio / Xcode:** For mobile device compilation

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/LightMari/citizen_emergency112.git
cd citizen_emergency112
```

---

### Step 2: Configure Backend Environment

Navigate to the `backend/` directory:

```bash
cd backend
cp .env.example .env
```

**Configure `.env` keys:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/citizen_emergency112
JWT_SECRET=your_super_secret_jwt_key
SMS_API_KEY=your_sms_provider_api_key
FCM_SERVER_KEY=your_firebase_cloud_messaging_key
```

Install dependencies and start the backend service:
```bash
npm install
npm run dev
```
Backend runs at `http://localhost:5000`.

---

### Step 3: Mobile App Setup & Execution

Open a new terminal session and navigate to `mobile_app/`:

```bash
cd mobile_app

# Fetch dependencies
flutter pub get

# Check attached devices
flutter devices

# Run on an Android emulator or connected device
flutter run
```

---

## 🧠 How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CITIZEN 112 DISPATCH PIPELINE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. INCIDENT INITIATION                                                     │
│     Citizen presses SOS ➔ GPS fetched ➔ Medical profile attached           │
├─────────────────────────────────────────────────────────────────────────────┤
│  2. DISPATCH GATEWAY                                                        │
│     Backend receives payload ➔ Creates GeoJSON ticket ➔ Assigns Zone        │
├─────────────────────────────────────────────────────────────────────────────┤
│  3. DUAL-CHANNEL NOTIFICATION                                               │
│     a) Emergency Contacts: SMS sent with live tracking link                 │
│     b) First Responders: Push notification sent to nearest available units   │
├─────────────────────────────────────────────────────────────────────────────┤
│  4. LIVE RESOLUTION                                                         │
│     Responders navigate via real-time coordinates ➔ Status updated to closed│
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Panic Activation:** When the citizen triggers the SOS button, the app queries the device GPS via `geolocator` with high-accuracy mode enabled.
2. **Encrypted Ingestion:** The client sends the coordinates, device timestamp, battery level, and user metadata to the backend endpoint (`POST /api/emergency/sos`).
3. **Geospatial Matching:** The server stores the record and performs a MongoDB `$near` spherical query against active responder locations within a 5–10km operational radius.
4. **Responder Dispatch & Contact Relay:** First responders receive priority push notifications with turnkey turn-by-turn routing coordinates. Simultaneously, the SMS gateway dispatches alert texts to the user's registered personal guardians.

---

## 🛡️ Edge-Case & Low-Connectivity Handling

- **Offline / Low-Bandwidth Mode:** If data connectivity drops during an emergency, the mobile app automatically falls back to generating an encoded, formatted emergency SMS sent to emergency dispatch numbers (112 / SMS gateways) with raw lat/long coordinates.
- **Location Smoothing:** Uses native Android/iOS location filters to reject inaccurate GPS drift indoors before broadcasting the incident coordinate packet.
- **Battery Conservation:** Shifts GPS polling frequency dynamically once an incident is created to ensure the phone does not run out of battery during prolonged crisis events.

---

## ⚠️ Disclaimer

This repository is an **educational and reference implementation** designed for research, disaster response prototyping, and public-safety hackathons. It is **not** an official production integration with state or national emergency control rooms unless formally certified and linked with regional police, fire, and emergency medical service communication networks.

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.