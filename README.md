# SANDTRIX MOBILE (Gyroscope & Troll Edition)

A high-performance mobile implementation of **Sandtrix** with full **hardware gyroscope motion controls**, **cellular automata fluid dynamics** (Water & Acid), and the hilarious **Troll Classic Tetris Mode**!

Designed for immediate testing on smartphones (iPhone / Android) and desktop web browsers.

---

## How to Get the Standalone APK on Your Phone

You have **4 easy ways** to install Sandtrix as a standalone app on your phone:

### 1. Instant Native Installation via Android Chrome (Fastest - 10 Seconds)
Because Sandtrix Mobile includes a complete [`manifest.json`](file:///C:/Users/omega/Desktop/santrix_mobile/manifest.json) and [`sw.js`](file:///C:/Users/omega/Desktop/santrix_mobile/sw.js) Service Worker:
1. Double-click [`start_mobile_server.bat`](file:///C:/Users/omega/Desktop/santrix_mobile/start_mobile_server.bat) on your PC.
2. On your Android phone, open Chrome and navigate to your PC's IP (e.g. `http://192.168.0.101:8080`).
3. Tap the Chrome menu (`⋮`) in the top-right corner and select **"Install app"** (or **"Add to Home screen"**).
4. Android's WebAPK service automatically generates and installs a **real standalone package** on your phone!
5. It will appear with its own icon in your **App Drawer & Home Screen**, launch in **full-screen immersive mode** (no browser address bar), and work **completely offline**!

---

### 2. Generate a Downloadable `.apk` via PWABuilder (Free 1-Click Cloud APK)
1. If you host the folder on GitHub Pages, Netlify, or Vercel:
2. Go to **[PWABuilder.com](https://www.pwabuilder.com)** (free service by Google & Microsoft).
3. Paste your URL and click **Start**.
4. Click **Package for Android** -> **Generate APK**.
5. Download the `.apk` file directly onto your phone and tap to install!

---

### 3. Build Locally via Android Studio
A complete native Android project is provided in [`android/`](file:///C:/Users/omega/Desktop/santrix_mobile/android):
1. Open **Android Studio**.
2. Select **Open** and choose `C:\Users\omega\Desktop\santrix_mobile\android`.
3. Click **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
4. The signed `app-debug.apk` will be output to:
   `android/app/build/outputs/apk/debug/app-debug.apk`
5. Copy it to your phone via USB or Google Drive and install!

---

### 4. Automated Build via GitHub Actions
A pre-configured CI/CD workflow is included in [`.github/workflows/build-apk.yml`](file:///C:/Users/omega/Desktop/santrix_mobile/.github/workflows/build-apk.yml):
1. Push this folder to a GitHub repository.
2. The GitHub Action will automatically spin up an Ubuntu runner, compile the native APK using Java 17 and Gradle, and upload `Sandtrix-Mobile-Debug-APK` directly to your GitHub Actions Artifacts tab for instant download!

### Method 2: Test on Desktop PC
1. Simply double-click [`index.html`](file:///C:/Users/omega/Desktop/santrix_mobile/index.html) in any modern browser (or start the server and visit `http://localhost:8080`).
2. Use the on-screen **TILT SLIDER** to simulate tilting your phone from $-45^\circ$ to $+45^\circ$.
3. Keyboard controls:
   - `←` / `A` / `→` / `D`: Steer piece
   - `↑` / `W` / `X`: Rotate clockwise
   - `Z` / `Ctrl`: Rotate counter-clockwise
   - `↓` / `S`: Soft drop
   - `Space`: Hard drop (SLAM)
   - `C` / `Shift`: Hold piece
   - `P` / `Esc`: Pause / Resume

---

## Included Game Modes

### 1. Normal Sandtrix (Sand + Water + Acid)
* **Granular Dissolution**: Tetrominoes fall under player control, dissolving into individual sand grains upon landing.
* **Fluid Water Dynamics**: Water flows horizontally to level out completely flat, sinks under falling sand, and sloshes toward the downward tilt of your phone!
* **Acid Corrosion**: Acid blocks corrode resting sand on impact, eating through stacks with green fizz particles and sizzle sound effects.
* **8-Connected Edge-to-Edge Line Clears**: Clear unbroken bands connecting from the left wall ($x = 0$) to the right wall ($x = 79$).
* **Dynamic Tilt Gravity**: Tilting your phone shifts the gravity vector—sand dunes and water slosh toward the tilted side!

### 2. Troll Classic Tetris
* **Rigid 10×17 Grid**: Traditional solid minos—no grain dissolution!
* **Mid-Air Shape-Shifting**: Pieces spontaneously morph mid-descent into different shapes, dots (`.`), or awkward plus crosses (`+`)!
* **TNT Demolition**: Flashing bomb blocks detonate on landing, blasting a 3×3 crater out of your stacked block tower.
* **Wacky Calamities**:
  * Wind gusts pushing pieces unexpectedly.
  * Seismic earthquakes rattling the grid.
  * 5-second inverted controls.
* **Sarcastic Troll Roaster**: The game actively roasts your plays on screen:
  * Single clears: *"ONLY ONE? GROUNDBREAKING."*, *"BARE MINIMUM ACHIEVED!"*
  * Tetris clears: *"TOTAL ACCIDENT, RIGHT?"*, *"CALCULATED LUCK!"*
  * Violent phone shaking: *"STOP SHAKING, YOU'RE NOT AN ETCH-A-SKETCH!"*
  * Game over: *"SKILL ISSUE DETECTED."*, *"REST IN PIECES."*

---

## Mobile Ergonomics & Motion Architecture

* **Hardware Gyroscope Integration**:
  - `deviceorientation` sensor tracks phone roll ($\gamma$) and pitch ($\beta$).
  - **Calibrate Flat**: One-tap calibration zeroes out the tilt angle so you can comfortably play while sitting or reclining.
  - **Proportional Steering**: Tilting past the deadzone ($\pm 7^\circ$) steers smoothly; steeper tilts increase auto-repeat speed.
* **Shake Detection**:
  - `devicemotion` accelerometer detects rapid downward flicks to trigger hard drop with haptic feedback (`navigator.vibrate`).
* **Ergonomic Touch Controls**:
  - Tap playfield: Rotate clockwise
  - Swipe down: Soft drop
  - Dedicated virtual buttons for Hold, Rotations, Directional nudges, Soft Drop, and Hard Drop.
* **Procedural Web Audio**:
  - Built-in mathematical sound synthesizer generates clicks, combo chords, water splashes, acid sizzles, and explosions with zero external sound files.
