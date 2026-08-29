# Hand-Tracking-AR-UI 🚀

An advanced real-time Augmented Reality (AR) Hand Tracking & Gesture Recognition Engine powered by OpenCV and MediaPipe Tasks (`HandLandmarker`). 

Supports simultaneous **Dual-Hand Sensing**, a rich collection of 3D wireframe holograms, particle FX, inter-hand energy beams, and a cyberpunk Telemetry HUD overlay.

---

## 🌟 Key Features

### 👐 Dual-Hand Sensing
- Tracks up to **2 hands simultaneously** with high accuracy.
- **Handedness Detection**: Automatically distinguishes Left vs. Right hand.
- **Color-Coded Skeletons**: 
  - **Left Hand**: Neon Cyan Glow `(255, 255, 0)`
  - **Right Hand**: Electric Magenta Glow `(255, 0, 255)`

### ⚡ Single-Hand Gesture Holograms
| Gesture | AR Effect / Hologram |
| :--- | :--- |
| **Pinch** (Thumb + Index) | Dynamic **3D Wireframe Cube** (Scales dynamically with pinch distance) |
| **Open Palm** (All 5 Fingers) | Rotating **Cyber HUD Shield** / Concentric Energy Rings |
| **Fist** (Curled Hand) | Pulsing **3D Energy Core** with orbital wireframe rings |
| **Point** (Index Raised) | Rotating **3D Wireframe Pyramid** + Fingertip Laser Beam |
| **Peace / Victory** (Index + Middle) | Floating **3D Octahedron Star** hovering above fingers |
| **Rock / Metal** (Index + Pinky) | Dynamic **Electric Plasma Arcs** bridging fingertips |
| **Thumbs Up / Down** | **3D Holographic Status Badge** (`LIKE` / `DISLIKE`) |

### 🔗 Dual-Hand Interactive Modes
| Gesture Combo | Interactive AR FX |
| :--- | :--- |
| **Dual Pinch** (Both hands pinching) | **3D Stretch Bounding Cage**: A rotating 3D holographic cube connected between both pinch points that scales and moves dynamically. |
| **Dual Open Palm** (Both palms open) | **Plasma Energy Tether**: A high-tech glowing plasma beam with moving energy nodes bridging both palm centers. |
| **Dual Fist** (Both fists closed) | **Central AR Energy Reactor**: A glowing energy reactor core centered between both fists. |

### 🖥️ Cyberpunk Telemetry HUD
- Real-time **FPS Meter**.
- Active hand count & per-hand handedness telemetry (Left/Right confidence %).
- Active gesture indicator & interaction mode badges.
- Particle trailing FX at fingertips.
- Press `[H]` to toggle the HUD on/off.

---

## 🛠️ Installation & Setup

1. **Clone or Navigate to Project Directory**:
   ```bash
   cd Hand-Tracking-AR-UI
   ```

2. **Activate Virtual Environment**:
   ```powershell
   .\ar_env\Scripts\activate
   ```

3. **Install Dependencies** (if needed):
   ```bash
   pip install opencv-python mediapipe numpy
   ```

4. **Run Application**:
   ```bash
   python main.py
   ```
   *(The `hand_landmarker.task` MediaPipe model file will automatically download on first run if not present).*

---

## 🎮 Controls

| Key | Action |
| :--- | :--- |
| `ESC` or `Q` | Exit application cleanly |
| `H` | Toggle HUD Telemetry Overlay on / off |

---

## 🏗️ Architecture & Requirements
- **Python 3.8+**
- **OpenCV**: Camera feed capture & custom 3D projection rendering.
- **MediaPipe Tasks API**: `vision.HandLandmarker` for 21 3D hand keypoints per hand.
- **NumPy**: Linear algebra and vector calculations.