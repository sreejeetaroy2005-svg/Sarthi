# Sarthi (सारथी)

> **A location-based cultural travel companion for tourists in India that auto-surfaces rich historical stories and guidance as you physically approach monuments, paired with smart itinerary planning.**

---

## Overview

Visiting India's heritage sites can often feel overwhelming—navigating sprawling complexes, guessing the historical context, or hiring unofficial guides without verified credentials. **Sarthi** acts as your personal cultural concierge:

1. **Explore & Plan**: Discover curated monuments, estimate entry fees, reorder your itinerary, and calculate transit options across Delhi Metro, Auto-rickshaws, cabs, and walking.
2. **Proximity Auto-Trigger**: As you physically walk near a monument (or test via the built-in GPS simulator), Sarthi automatically detects your presence via the Haversine formula and presents a live context card.
3. **Immersive Storytelling & Audio Narration**: Listen to studio-quality narration powered by ElevenLabs AI voice synthesis with interactive chapter scrubbing and Web Speech fallback.
4. **Live Guide AR Camera**: Launch a simulated viewfinder overlay to identify key architectural features on-site.

---

## Screenshots

<!-- Add screenshots of the application below -->
| Explore Map & Proximity Trigger | Audio Story Companion | Day Plan & Route Optimizer |
| :---: | :---: | :---: |
| ![Explore Map](https://via.placeholder.com/400x800.png?text=Explore+Map+%26+GPS+Trigger) | ![Audio Player](https://via.placeholder.com/400x800.png?text=Audio+Story+Player) | ![Day Plan](https://via.placeholder.com/400x800.png?text=Day+Plan+Itinerary) |

| Live Guide AR Viewfinder | Landmark Deep Dive | Transit & Route Guidance |
| :---: | :---: | :---: |
| ![Live Guide AR](https://via.placeholder.com/400x800.png?text=Live+Guide+Viewfinder) | ![Landmark Details](https://via.placeholder.com/400x800.png?text=Landmark+Details) | ![Transit Guide](https://via.placeholder.com/400x800.png?text=Transit+Guide) |

---

## Features (Currently Implemented)

- **Onboarding Flow**:
  - `WelcomeView`: Value proposition introduction.
  - `TravelerTypeView`: Persona selection (History Buff, Casual Explorer, Family, Architecture Enthusiast).
  - `LocationAccessView`: GPS permission prompt with an instant "Skip & Use Delhi Sand Box" mode for off-site demoing.

- **Interactive Map & Geolocation**:
  - `ExploreView`: Leaflet-powered interactive map showing monument pins and live user position (blue pulsing marker).
  - Real-time distance calculations using the Haversine formula (`src/utils/distance.js`).
  - Proximity detection with a 150-meter threshold that triggers an animated slide-up card with quick actions.
  - **Developer GPS Simulation Panel**: On-screen control to teleport to any monument or input manual coordinates for testing without physical travel.

- **Audio Story Companion**:
  - `AudioPlayerModal`: Dual-mode audio player.
    - **AI Voice Mode**: Plays real studio-quality `.mp3` files generated via ElevenLabs with HTML5 `<audio>` playback, interactive seek bar, speed controls (1x, 1.25x, 1.5x, 2x), and automatic chapter advancing.
    - **TTS Fallback Mode**: Browser Web Speech API fallback for monuments without pre-generated audio files.
    - Toggleable text transcript display for accessibility.

- **Day Planner & Itinerary Optimizer**:
  - `DayPlanView`: Drag-and-reorder day itinerary, estimated entry fee calculation, weather widget, and a coordinate-based route optimization algorithm.

- **Multi-Modal Route & Transit Guidance**:
  - `RoutePlanView`: Step-by-step navigation comparisons for Walking, Auto-Rickshaw, Delhi Metro, and Taxi, complete with estimated travel times, fare ranges, and transfer instructions.

- **Live Guide Camera Simulation**:
  - `LiveGuideView`: Simulated AR camera HUD with real-time target reticle, dynamic audio guide triggers, and preset cultural Q&A prompts.

- **Offline-Ready State Persistence**:
  - LocalStorage persistence for user profile, onboarding state, day plan itinerary, bookmarked/saved monuments, and custom location settings.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | [React 18](https://react.dev/) | Component-based UI architecture |
| **Bundler** | [Vite 5](https://vitejs.dev/) | Fast build tool and development server |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) + PostCSS | Custom cultural palette and responsive utility classes |
| **Mapping** | [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/) | Interactive map rendering and custom markers |
| **Icons & Fonts** | Google Material Symbols & Lucide React | Icons and typography |
| **Audio & Voice** | [ElevenLabs API](https://elevenlabs.io/) & HTML5 Audio | AI voice generation script and client audio playback |
| **Geolocation** | Web Geolocation API (`navigator.geolocation`) | Real-time position tracking |

---

## Project Structure

```
Sarthi/
├── public/
│   └── audio/
│       └── humayun-tomb/           # Generated MP3 narration files (ch1 - ch4)
├── scripts/
│   ├── generate-audio.mjs         # One-time ElevenLabs TTS audio generation script
│   └── update-audio-srcs.mjs      # Auto-patcher for monuments.js audioSrc paths
├── src/
│   ├── components/
│   │   ├── AudioPlayerModal.jsx   # HTML5 audio player modal with seek & TTS fallback
│   │   └── Navigation/
│   │       ├── BottomNav.jsx      # Mobile tab navigation (Explore, Plan, Live, Saved, Profile)
│   │       └── Header.jsx         # App header with search, notifications, and profile
│   ├── data/
│   │   └── monuments.js           # Curated monument database (coords, chapters, dining, tips)
│   ├── hooks/
│   │   └── useGeolocation.js      # WatchPosition hook with simulation override support
│   ├── utils/
│   │   └── distance.js            # Haversine distance calculation utility
│   ├── views/
│   │   ├── DayPlanView.jsx        # Itinerary planner and fee calculator
│   │   ├── ExploreView.jsx        # Map view, proximity slide-up card, GPS dev panel
│   │   ├── LandmarkDetailView.jsx # Comprehensive history, architectural highlights, and tips
│   │   ├── LandmarkStoryView.jsx  # Rich editorial story mode for monuments
│   │   ├── LiveGuideView.jsx      # AR camera overlay simulation
│   │   ├── LocationAccessView.jsx # Location permission & sandbox selection
│   │   ├── ProfileView.jsx        # User preferences and state reset
│   │   ├── RoutePlanView.jsx      # Transit mode comparisons & directions
│   │   ├── SavedTripsView.jsx     # Bookmarked monuments and offline saved guides
│   │   ├── TravelerTypeView.jsx   # Persona selection screen
│   │   └── WelcomeView.jsx        # App introduction screen
│   ├── App.jsx                    # Root state coordinator and local storage synchronization
│   ├── index.css                  # Global styles, theme tokens, and animations
│   └── main.jsx                   # React application entry point
├── .env.example                   # Environment variable template
├── package.json                   # Dependencies and npm scripts
├── tailwind.config.js             # Color palette tokens and typography configuration
└── vite.config.js                 # Vite dev server configuration
```

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm or yarn

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/Sarthi.git
   cd Sarthi
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy the `.env.example` template to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and insert your [ElevenLabs API key](https://elevenlabs.io/app/settings/api-keys) (only required if you wish to re-generate narration audio):
   ```env
   ELEVENLABS_API_KEY=sk_your_api_key_here
   ```

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Audio Narration Generation (ElevenLabs TTS)

The project includes an offline generation pipeline to convert chapter transcripts from `src/data/monuments.js` into natural `.mp3` audio files using ElevenLabs.

### Current Scope
To stay within the ElevenLabs free tier limit (10,000 credits/month), generation is currently configured for **Humayun's Tomb only** (4 chapters, ~600 characters total / ~6% of monthly quota).

### Generating Audio:
1. Ensure your `ELEVENLABS_API_KEY` is present in `.env`.
2. Run the generator script:
   ```bash
   npm run generate-audio
   ```
   *Note: The script is idempotent. It automatically skips chapters that already exist on disk to save API credits.*
3. Automatically patch the file paths into `monuments.js`:
   ```bash
   npm run update-audio-srcs
   ```

### Generating Audio for Other Monuments:
To generate audio for other monuments (e.g., Qutub Minar, Red Fort), open `scripts/generate-audio.mjs` and add the monument ID to `TARGET_MONUMENTS`:
```javascript
const TARGET_MONUMENTS = ['humayun-tomb', 'qutub-minar', 'red-fort'];
```
Then rerun `npm run generate-audio` and `npm run update-audio-srcs`.

---

## Known Limitations

- **Web Application**: Sarthi is currently running as a responsive Single Page Application (SPA). Background geolocation tracking when the phone screen is locked requires a native container wrapper.
- **Selective Audio Coverage**: Only Humayun's Tomb has pre-generated ElevenLabs AI voice files in the starter dataset; other monuments utilize the browser's Web Speech API as a fallback.
- **Simulated AR**: The Live Guide viewfinder uses the web camera stream with a canvas HUD overlay rather than a full ARCore/WebXR anchor pipeline.
- **Curated Transit Data**: Transit times and costs for Delhi Metro, Auto-rickshaws, and cabs use representative sample estimates rather than live third-party transit APIs.

---

## Roadmap

- [ ] **Capacitor / React Native Mobile Port**: Package the application for iOS and Android with background geolocation and lock-screen audio playback.
- [ ] **Full Heritage Coverage**: Batch-generate ElevenLabs narration for all 6 core Delhi monuments and expand to Agra & Jaipur (Golden Triangle).
- [ ] **Multilingual Narrations**: Support Hindi, French, Spanish, Japanese, and German audio tracks.
- [ ] **WebXR Integration**: Implement true surface-tracking AR anchors for architectural inspection.
- [ ] **Live Ticketing Integration**: Direct deep-linking with ASI (Archaeological Survey of India) official e-ticketing portals.

---

## License

This project is open source and available under the [MIT License](LICENSE).
