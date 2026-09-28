# ANIMA 🚀

## Where Movement Meets Momentum

**Hand-Tracked Spatial Interaction**

ANIMA is a real-time hand-tracking AR project where hand movement
becomes the controller. It combines a Python/OpenCV/MediaPipe
computer-vision engine with a browser-based interactive experience
containing Geometric, Superpowers, Cosmic Dodger, and Music worlds.

------------------------------------------------------------------------

## Project Vision

> **Movement should become interaction.**

The core pipeline is:

**Camera → Hand Detection → Landmarks → Gesture Recognition →
Stabilization → Interaction → Visual/Audio Feedback**

ANIMA explores Human-Computer Interaction through natural hand movement
instead of relying only on a mouse, keyboard, or traditional buttons.

------------------------------------------------------------------------

## Project at a Glance

  Area                   Implementation
  ---------------------- --------------------------------
  Computer vision        Python + OpenCV
  Hand tracking          MediaPipe Hand Landmarker
  Numerical processing   NumPy
  Gesture recognition    Landmark-based classifier
  Stabilization          Multi-frame gesture stabilizer
  AR rendering           OpenCV + procedural effects
  Browser UI             HTML + CSS + JavaScript
  Browser graphics       Canvas API
  Browser tracking       MediaPipe Tasks Vision
  Game                   JavaScript + Canvas
  Audio                  Web Audio API
  Deployment             Vercel
  Author                 Ritu Rai

------------------------------------------------------------------------

# ✨ Core Features

-   Real-time hand tracking
-   Single-hand gesture recognition
-   Dual-hand interaction
-   Gesture stabilization
-   3D procedural AR effects
-   Fireball action
-   Mystic Web action
-   Mystic Portal
-   Plasma Tether
-   Telemetry HUD
-   Browser-based hand interaction
-   Four interactive browser worlds
-   Cosmic Dodger game
-   Music visualization
-   Responsive UI
-   Light/Dark theme
-   Vercel-ready static deployment

------------------------------------------------------------------------

# 🖐️ Hand Tracking

The Python engine uses **MediaPipe Hand Landmarker** to detect hand
landmarks from webcam frames.

The landmarks represent important points such as the wrist and finger
joints. ANIMA uses relationships between these landmarks to classify
gestures.

The Python detector is configured for two hands:

``` python
num_hands = 2
min_hand_detection_confidence = 0.75
min_hand_presence_confidence = 0.70
min_tracking_confidence = 0.70
```

The Python application uses MediaPipe in image-processing mode, while
the browser implementation uses browser-compatible video detection.

------------------------------------------------------------------------

# 🧠 Gesture Recognition

ANIMA recognizes:

  Gesture         Interaction
  --------------- --------------------------------------------
  `PINCH`         3D cube / precision interaction / fireball
  `OPEN_PALM`     Cyber shield
  `FIST`          Energy core / reactor
  `POINT`         Pyramid + laser
  `PEACE`         Floating 3D octahedron
  `ROCK`          Electric plasma arcs
  `THUMBS_UP`     LIKE badge
  `THUMBS_DOWN`   DISLIKE badge
  `IDLE`          No active gesture

The classifier is based on landmark geometry rather than storing image
templates for every gesture.

For example, pinch detection uses the distance between the thumb and
index-finger landmarks.

------------------------------------------------------------------------

# 🔄 Gesture Stabilization

Raw frame-by-frame detection can fluctuate:

``` text
PINCH → PINCH → PEACE → PINCH → PINCH
```

To avoid unstable interactions, ANIMA uses a gesture stabilizer.

Current setting:

``` python
required_frames = 3
```

Conceptually:

``` text
Raw Gesture
     ↓
Candidate Gesture
     ↓
3 consistent frames
     ↓
Stable Gesture
     ↓
Action
```

This lets existing effects remain intact while making the interaction
more predictable.

------------------------------------------------------------------------

# 👐 Dual-Hand Interaction

ANIMA supports several two-hand interactions.

### Dual Pinch

Creates a stretched bounding/cage-style interaction between the hands.

### Dual Open Palm

Creates a plasma energy tether/beam and can drive the Mystic Portal
interaction.

### Dual Fist

Creates a central AR reactor / energy core.

Dual-hand guards were kept separate from single-hand actions to reduce
gesture overlap.

------------------------------------------------------------------------

# 🔥 Cinematic Actions

A major part of the project journey was moving beyond simple gesture
demonstrations.

## Fireball

Implemented as a dedicated action detector using:

-   Thumb state
-   Index/middle finger state
-   Ring/pinky state
-   Temporal stabilization

## Mystic Web

A Spider-Man-inspired hand pose drives a dedicated web interaction. The
detector uses scale-normalized and hand-symmetric logic.

## Mystic Portal

A cinematic portal system with rotating circular/rune-style elements.

## Plasma Tether

A two-hand energy connection rendered between detected hand positions.

These actions are kept modular instead of placing all effect logic
inside `main.py`.

------------------------------------------------------------------------

# 🎨 AR Effects

The Python project contains procedural effects such as:

-   3D wireframe cube
-   Rotating HUD rings
-   Cyber shield
-   Energy core
-   Pyramid
-   Fingertip laser
-   Floating octahedron
-   Plasma arcs
-   Fireball
-   Web
-   Portal
-   Plasma tether
-   Particle effects

------------------------------------------------------------------------

# 📊 Telemetry HUD

The HUD provides runtime feedback such as:

-   Gesture state
-   Hand state
-   Interaction state
-   FPS/performance information
-   Mode/system information

It was also an important development tool because it exposed internal
system state while testing.

------------------------------------------------------------------------

# ⚙️ Performance Journey

Performance became a major engineering challenge as the project moved
from simple hand tracking to dual-hand cinematic effects.

Representative measurements included:

### No hands

``` text
Detection: ~32 ms
Pre-HUD:  ~32 ms
FPS:      ~24
```

### One hand

``` text
Detection: ~51 ms
Pre-HUD:  ~51 ms
FPS:      ~17
```

### Two hands

``` text
Detection: ~70 ms
Pre-HUD:   ~95 ms
FPS:      ~11
```

Video recording tests also showed that complex dual-hand effects could
produce much higher rendering/compositing costs.

------------------------------------------------------------------------

# 🚀 Performance Optimizations

## Reduced Detection Resolution

The Python detector processes a smaller frame:

``` python
detection_frame = cv2.resize(
    frame,
    (720, 405),
    interpolation=cv2.INTER_AREA
)
```

This reduces the amount of image data processed by MediaPipe.

## Separate Detection From Effects

The project was refactored so gesture detection, utilities, rendering,
particles, geometric effects, actions, and HUD logic are separated.

## Bounded Particles

Particle systems were kept bounded to prevent uncontrolled growth.

## Stabilized Gestures

Multi-frame stabilization reduces unnecessary interaction switching.

------------------------------------------------------------------------

# 🏗️ Python Architecture

The original prototype grew around `main.py`. As features increased, it
became necessary to separate responsibilities.

Current architecture:

``` text
main.py
   │
   ├── gestures/
   │   └── classifier.py
   │
   ├── core/
   │   └── utils.py
   │
   ├── effects/
   │   ├── particles.py
   │   └── geometric.py
   │
   ├── actions/
   │   ├── fireball_action.py
   │   ├── web_action.py
   │   ├── portal_action.py
   │   └── beam_action.py
   │
   └── ui/
       ├── hand_renderer.py
       └── hud.py
```

This structure makes individual systems easier to test, optimize, and
modify without rewriting the entire application.

------------------------------------------------------------------------

# 🌐 Browser Experience

The Python application cannot simply be executed as a normal static
webpage.

Therefore ANIMA has a browser implementation built around:

``` text
Browser
   ↓
Webcam
   ↓
Browser Hand Tracking
   ↓
JavaScript Gesture Logic
   ↓
Selected World
   ↓
Canvas / Audio / Interaction
```

The Python application remains the original computer-vision engine,
while the browser version makes the concept accessible through a normal
URL.

------------------------------------------------------------------------

# 🌍 Four ANIMA Worlds

## 1. Geometric World

Movement controls procedural geometry.

The experience focuses on:

-   Hand position
-   Pinch interaction
-   Wireframe shapes
-   Real-time canvas rendering

Concept:

> **Movement shapes objects.**

------------------------------------------------------------------------

## 2. Superpowers World

Movement drives cinematic visual effects.

The experience focuses on:

-   Energy
-   Motion
-   Procedural effects
-   Gesture interaction

Concept:

> **Movement creates effects.**

------------------------------------------------------------------------

## 3. Cosmic Dodger

A gesture-controlled browser game.

### Controls

  Gesture         Action
  --------------- -----------------
  Hand movement   Move spacecraft
  `PINCH`         Fire laser
  `OPEN_PALM`     Shield
  `FIST`          EMP

The game includes:

-   Menu
-   Camera loading
-   Ready state
-   Playing state
-   Pause
-   Game over
-   Retry
-   Score
-   Lives
-   Levels
-   Collisions
-   Laser bursts
-   Explosion effects
-   Synthesized sound

Concept:

> **Movement controls motion.**

------------------------------------------------------------------------

## 4. Music World

A gesture-driven visual/audio experience using procedural
visualizations.

It uses:

-   Waveforms
-   Particles
-   Motion
-   Reactive shapes
-   Audio behavior

Concept:

> **Movement creates sound.**

------------------------------------------------------------------------

# 🖥️ Browser Architecture

``` text
website/
├── core/
├── effects/
├── tracking/
├── worlds/
│   ├── gamesWorld.js
│   ├── geometricWorld.js
│   ├── musicWorld.js
│   └── superpowersWorld.js
│
├── games.html
├── geometric.html
├── index.html
├── music.html
├── script.js
└── style.css
```

Responsibilities are separated into:

-   **tracking/** --- hand tracking/input
-   **core/** --- shared browser infrastructure
-   **effects/** --- reusable visual effects
-   **worlds/** --- world-specific behavior
-   **HTML** --- page structure
-   **CSS** --- visual system, responsive layout, themes
-   **script.js** --- shared website behavior

------------------------------------------------------------------------

# 🧰 Technology Stack

## Python AR Engine

-   **Python** --- application logic
-   **OpenCV** --- webcam frames, image processing and rendering
-   **MediaPipe Tasks** --- hand landmark detection
-   **NumPy** --- numerical/image operations
-   **Math** --- geometry calculations
-   **Time** --- timing/animation
-   **Random** --- procedural effects
-   **urllib** --- model asset handling

## Browser

-   **HTML5** --- structure
-   **CSS3** --- layout, themes, responsive design and animation
-   **JavaScript** --- application logic
-   **Canvas API** --- real-time graphics
-   **MediaPipe Tasks Vision** --- browser hand tracking
-   **Web Camera APIs** --- webcam access
-   **Web Audio API** --- synthesized audio effects
-   **Vercel** --- deployment

------------------------------------------------------------------------

# 🎨 Visual Design Journey

The visual identity evolved during development.

The original AR engine leaned toward a stronger futuristic/cyber
aesthetic.

The website evolved into a softer **pastel cosmic** identity using:

-   Lavender
-   Powder blue
-   Pink
-   Peach
-   Mint
-   Cream
-   Charcoal

The goal was to avoid a generic SaaS dashboard, cyberpunk template, or
AI-generated-looking portfolio.

The final direction combines:

**Cosmic + Playful + Interactive + Technical**

------------------------------------------------------------------------

# 🌙 Dark Mode

ANIMA includes a light/dark theme system.

Dark mode changes:

-   Page backgrounds
-   Navigation
-   Cards
-   Camera areas
-   World panels
-   Controls
-   Buttons
-   Footer
-   Status indicators

The theme preference is stored locally so it can persist across
visits/pages.

------------------------------------------------------------------------

# 📱 Responsive Design

The website was designed for:

-   Desktop
-   Laptop
-   Tablet
-   Mobile

World pages prioritize the camera interaction area and adapt the layout
for smaller screens.

------------------------------------------------------------------------

# 🔐 Camera Privacy

The browser requests camera access through the browser's permission
system.

The website communicates camera/tracking state to the user:

``` text
Camera Offline
      ↓
Request Camera
      ↓
Permission
      ↓
Camera Ready
      ↓
Hand Tracking
```

The browser experience is designed around local camera interaction
rather than sending webcam frames to a custom project server.

------------------------------------------------------------------------

# 🛠️ Development Journey

## Stage 1 --- Basic Hand Tracking

Started with:

``` text
Webcam
  ↓
OpenCV
  ↓
MediaPipe
  ↓
Hand Landmarks
```

The first milestone was reliable landmark detection.

## Stage 2 --- Gesture Recognition

Hand landmarks were converted into meaningful gestures:

-   Pinch
-   Open Palm
-   Fist
-   Point
-   Peace
-   Rock
-   Thumbs Up
-   Thumbs Down

## Stage 3 --- AR Effects

Gestures were connected to visual interactions.

``` text
Pinch      → Cube
Open Palm  → Shield
Fist       → Energy Core
Point      → Laser
Peace      → 3D Object
Rock       → Plasma
```

## Stage 4 --- Dual Hands

Two-hand detection introduced:

-   Dual Pinch
-   Dual Open Palm
-   Dual Fist

Separate guards were needed to prevent single- and dual-hand actions
from overlapping.

## Stage 5 --- Cinematic Effects

The project expanded into:

-   Fireball
-   Mystic Web
-   Mystic Portal
-   Plasma Tether

## Stage 6 --- Gesture Stabilization

A three-frame stabilizer was introduced to reduce accidental
transitions.

## Stage 7 --- Refactoring

The growing `main.py` was progressively split into:

``` text
gestures/
core/
effects/
actions/
ui/
```

This was a major maintainability milestone.

## Stage 8 --- Performance Testing

The system was measured under:

``` text
No hands
↓
One hand
↓
Two hands
↓
Two hands + effects
```

This revealed the cost of MediaPipe detection and complex rendering.

## Stage 9 --- Browser Conversion

The project was extended into a browser implementation so users could
experience the concept without installing the Python application.

## Stage 10 --- Four Interactive Worlds

The browser version became:

``` text
Geometric
Superpowers
Cosmic Dodger
Music
```

## Stage 11 --- Portfolio/UI

The website gained:

-   ANIMA branding
-   Hero section
-   World cards
-   Procedural previews
-   Responsive design
-   Dark mode
-   Camera status
-   Navigation
-   Project presentation

## Stage 12 --- Deployment

The browser version was prepared for Vercel as a static site.

------------------------------------------------------------------------

# 📈 Complete Evolution

``` text
Basic Camera Tracking
        ↓
Hand Landmarks
        ↓
Gesture Recognition
        ↓
AR Holograms
        ↓
Dual-Hand Interaction
        ↓
Cinematic Effects
        ↓
Gesture Stabilization
        ↓
Code Refactoring
        ↓
Performance Testing
        ↓
Browser Hand Tracking
        ↓
Four Interactive Worlds
        ↓
Responsive Website
        ↓
Dark Mode
        ↓
Vercel Deployment
        ↓
ANIMA
```

------------------------------------------------------------------------

# 🧪 Testing

## Python

Testing covered:

-   Syntax/compile checks
-   Module imports
-   Gesture detection
-   Single-hand interaction
-   Dual-hand interaction
-   Gesture stabilization
-   Action triggering
-   Performance measurement

## Browser

Testing covered:

-   Homepage
-   World navigation
-   Geometric camera contract
-   Superpowers world
-   Cosmic Dodger HUD/state flow
-   Music audio behavior
-   Back navigation
-   Mobile camera-first layout
-   Dark mode
-   Responsive UI

Structural/headless tests validate the website flow; real webcam
behavior still depends on the user's browser permissions and camera
hardware.

------------------------------------------------------------------------

# ▶️ Run the Python Application

## Clone

``` bash
git clone https://github.com/RituRai-03/Hand-Tracking-AR-UI.git
cd Hand-Tracking-AR-UI
```

## Virtual environment

``` bash
python -m venv ar_env
```

### Windows

``` bash
ar_env\Scripts\activate
```

### macOS/Linux

``` bash
source ar_env/bin/activate
```

## Install core dependencies

``` bash
pip install opencv-python numpy mediapipe
```

## Run

``` bash
python main.py
```

A webcam is required.

------------------------------------------------------------------------

# 🌐 Run the Website Locally

From the project:

``` bash
cd website
python -m http.server 8000
```

Open:

``` text
http://localhost:8000
```

A local HTTP server is recommended instead of opening the HTML files
directly with `file://`, especially for browser modules and camera
behavior.

------------------------------------------------------------------------

# ☁️ Vercel Deployment

The browser project is a static HTML/CSS/JavaScript website.

Use:

``` text
Project Name: ANIMA
Framework Preset: Other
Root Directory: website
Build Command: empty
Output Directory: .
```

The important setting is:

``` text
Root Directory = website
```

This tells Vercel to deploy the browser experience rather than
attempting to deploy the Python AR engine as a static website.

------------------------------------------------------------------------

# 📁 Project Structure

``` text
ANIMA/
│
├── actions/
│   ├── fireball_action.py
│   ├── web_action.py
│   ├── portal_action.py
│   └── beam_action.py
│
├── core/
│   └── utils.py
│
├── effects/
│   ├── particles.py
│   └── geometric.py
│
├── gestures/
│   └── classifier.py
│
├── ui/
│   ├── hand_renderer.py
│   └── hud.py
│
├── website/
│   ├── core/
│   ├── effects/
│   ├── tracking/
│   ├── worlds/
│   │   ├── gamesWorld.js
│   │   ├── geometricWorld.js
│   │   ├── musicWorld.js
│   │   └── superpowersWorld.js
│   │
│   ├── games.html
│   ├── geometric.html
│   ├── index.html
│   ├── music.html
│   ├── script.js
│   └── style.css
│
├── main.py
├── hand_landmarker.task
├── .gitignore
└── README.md
```

------------------------------------------------------------------------

# 🧠 Key Learning Areas

Building ANIMA involved learning across several domains.

### Computer Vision

Working with webcam frames and real-time image processing.

### Hand Tracking

Understanding landmarks and their spatial relationships.

### Gesture Recognition

Turning landmark geometry into user commands.

### Human-Computer Interaction

Designing an interface controlled by physical movement.

### Real-Time Graphics

Creating procedural effects while maintaining performance.

### Animation

Using timing, interpolation and particle behavior.

### Game Development

Game states, collision detection, score, lives, levels, input and audio.

### Web Development

HTML, CSS, JavaScript, browser camera access and Canvas.

### Software Architecture

Splitting a growing prototype into maintainable modules.

### Performance Engineering

Measuring detection/rendering cost and optimizing based on actual
measurements.

### Deployment

Turning a local interactive project into a public browser experience.

------------------------------------------------------------------------

# 💡 What Makes ANIMA Different?

ANIMA is not only a hand-tracking demo.

It combines:

``` text
Computer Vision
      +
Gesture Recognition
      +
Human-Computer Interaction
      +
AR Effects
      +
Real-Time Rendering
      +
Game Development
      +
Audio Visualization
      +
Web Development
      +
Deployment
```

It therefore functions as a:

-   Computer-vision project
-   AR interaction project
-   Real-time graphics project
-   HCI experiment
-   Browser experience
-   Game prototype
-   Portfolio project

------------------------------------------------------------------------

# 🔮 Future Possibilities

Potential future directions include:

-   More gesture-controlled worlds
-   Personalized gestures
-   Custom gesture training
-   Better multi-hand interaction
-   WebGL/WebGPU rendering
-   More browser 3D
-   Spatial audio
-   XR/AR glasses support
-   Mobile optimization
-   Multiplayer gesture interaction
-   More games
-   Gesture-based music creation

------------------------------------------------------------------------

# 📌 Project Identity

### Name

**ANIMA**

### Tagline

**Where Movement Meets Momentum.**

### Supporting line

**Your hands. Your movement. Your world.**

### Interaction mapping

``` text
Geometric
Movement shapes objects.

Superpowers
Movement creates effects.

Cosmic Dodger
Movement controls motion.

Music
Movement creates sound.
```

------------------------------------------------------------------------

# 👩‍💻 Creator

## Ritu Rai

GitHub:

https://github.com/RituRai-03

Main repository:

https://github.com/RituRai-03/Hand-Tracking-AR-UI

------------------------------------------------------------------------

# 📸 Suggested Demo Assets

For future README screenshots/GIFs:

``` text
docs/
├── homepage.png
├── geometric-world.png
├── superpowers-world.png
├── cosmic-dodger.png
├── music-world.png
├── hand-tracking.png
└── demo.gif
```

------------------------------------------------------------------------

# 🏆 Final Project Summary

ANIMA started as a webcam hand-tracking experiment and evolved into a
complete movement-driven interaction platform.

The most important architectural lesson was that a real-time interactive
system is not just about detecting a hand correctly.

The complete experience is:

``` text
Detection
   ↓
Interpretation
   ↓
Stabilization
   ↓
Interaction
   ↓
Rendering
   ↓
Feedback
   ↓
User Experience
```

ANIMA connects that pipeline across a Python AR engine and a
browser-based interactive experience.

------------------------------------------------------------------------

# 📜 Copyright

© 2026 **Ritu Rai**. All rights reserved.

ANIMA, its original source code, project structure, documentation,
visual interaction implementations, and original project work are
attributed to **Ritu Rai**.

Please provide appropriate credit when referencing or using this
project.

------------------------------------------------------------------------

::: {align="center"}
# ANIMA

### Where Movement Meets Momentum.

**Your hands. Your movement. Your world.**

Built with Python, OpenCV, MediaPipe, HTML, CSS, JavaScript and
continuous experimentation.

**© 2026 Ritu Rai**
:::
