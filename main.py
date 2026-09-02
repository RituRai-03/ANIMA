import cv2
import numpy as np
import math
import os
import time
import random
import urllib.request
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from actions.portal_action import execute_portal
from actions.fireball_action import execute_fireball
from actions.beam_action import execute_beam

# ---------------------------------------------------------------------------
# Model Asset Management for MediaPipe Tasks API
# ---------------------------------------------------------------------------
MODEL_PATH = "hand_landmarker.task"
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"

def ensure_model_exists():
    """Downloads hand_landmarker.task if not present locally."""
    if not os.path.exists(MODEL_PATH):
        print(f"Downloading model task file from {MODEL_URL}...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print("Download complete.")

# Hand connection indices for skeleton rendering
HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),        # Thumb
    (0, 5), (5, 6), (6, 7), (7, 8),        # Index
    (5, 9), (9, 10), (10, 11), (11, 12),   # Middle
    (9, 13), (13, 14), (14, 15), (15, 16), # Ring
    (13, 17), (17, 18), (18, 19), (19, 20),# Pinky
    (0, 17)                                # Palm base
]

# Color Palette (BGR format)
COLOR_CYAN = (255, 255, 0)
COLOR_MAGENTA = (255, 0, 255)
COLOR_NEON_GREEN = (0, 255, 128)
COLOR_NEON_BLUE = (255, 165, 0)
COLOR_ORANGE = (0, 140, 255)
COLOR_YELLOW = (0, 230, 255)
COLOR_RED = (50, 50, 255)
COLOR_WHITE = (255, 255, 255)
COLOR_DARK_BG = (20, 20, 20)

# Particle list for trailing fingertip particle FX
particles = []


# ---------------------------------------------------------------------------
# Utility Math Functions
# ---------------------------------------------------------------------------
def calculate_distance(p1, p2):
    """Calculates Euclidean distance between two 3D landmarks."""
    return math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2)

def calculate_2d_distance(pt1, pt2):
    """Calculates 2D Euclidean distance between pixel points (x, y)."""
    return math.hypot(pt1[0] - pt2[0], pt1[1] - pt2[1])

def get_landmark_px(lm, w, h):
    """Converts normalized landmark to integer pixel tuple."""
    return (int(lm.x * w), int(lm.y * h))

def get_palm_center_px(landmarks, w, h):
    """Computes the approximate palm center pixel coordinate."""
    wrist = landmarks[0]
    idx_mcp = landmarks[5]
    pinky_mcp = landmarks[17]
    cx = int((wrist.x + idx_mcp.x + pinky_mcp.x) / 3.0 * w)
    cy = int((wrist.y + idx_mcp.y + pinky_mcp.y) / 3.0 * h)
    return (cx, cy)

# ---------------------------------------------------------------------------
# Gesture Classification Engine
# ---------------------------------------------------------------------------
def is_finger_extended(landmarks, tip_idx, pip_idx, mcp_idx, wrist_idx=0):
    """Determines whether a finger is extended relative to the wrist/MCP."""
    tip = landmarks[tip_idx]
    pip = landmarks[pip_idx]
    mcp = landmarks[mcp_idx]
    wrist = landmarks[wrist_idx]
    
    dist_tip_wrist = calculate_distance(tip, wrist)
    dist_pip_wrist = calculate_distance(pip, wrist)
    dist_tip_mcp = calculate_distance(tip, mcp)
    dist_pip_mcp = calculate_distance(pip, mcp)
    
    return dist_tip_wrist > dist_pip_wrist and dist_tip_mcp > dist_pip_mcp

def is_thumb_extended(landmarks):
    """Determines if the thumb is extended away from palm."""
    thumb_tip = landmarks[4]
    pinky_mcp = landmarks[17]
    index_mcp = landmarks[5]
    wrist = landmarks[0]
    
    dist_to_pinky = calculate_distance(thumb_tip, pinky_mcp)
    dist_to_idx = calculate_distance(thumb_tip, index_mcp)
    dist_to_wrist = calculate_distance(thumb_tip, wrist)
    
    return dist_to_pinky > 0.23 or (dist_to_idx > 0.14 and dist_to_wrist > 0.20)

def classify_hand_gesture(landmarks):
    """
    Classifies single-hand landmarks into gesture states:
    PINCH, OPEN_PALM, FIST, POINT, PEACE, ROCK, THUMBS_UP, THUMBS_DOWN, IDLE
    """
    thumb_tip = landmarks[4]
    index_tip = landmarks[8]
    
    # Pinch distance check
    pinch_dist = calculate_distance(thumb_tip, index_tip)
    if pinch_dist < 0.055:
        return "PINCH", pinch_dist

    # Finger states (Extended vs Curled)
    index_ext = is_finger_extended(landmarks, 8, 6, 5)
    middle_ext = is_finger_extended(landmarks, 12, 10, 9)
    ring_ext = is_finger_extended(landmarks, 16, 14, 13)
    pinky_ext = is_finger_extended(landmarks, 20, 18, 17)
    thumb_ext = is_thumb_extended(landmarks)

    # Count extended fingers (excluding thumb for base counts)
    ext_count = sum([index_ext, middle_ext, ring_ext, pinky_ext])

    # 1. Open Palm (All 4 main fingers extended + thumb extended)
    if ext_count >= 4 and thumb_ext:
        return "OPEN_PALM", pinch_dist
    if ext_count == 4:
        return "OPEN_PALM", pinch_dist

    # 2. Fist (All fingers curled)
    if ext_count == 0 and not thumb_ext:
        return "FIST", pinch_dist

    # 3. Point (Only Index extended)
    if index_ext and not middle_ext and not ring_ext and not pinky_ext:
        return "POINT", pinch_dist

    # 4. Peace / Victory (Index + Middle extended)
    if index_ext and middle_ext and not ring_ext and not pinky_ext:
        return "PEACE", pinch_dist

    # 5. Rock / Metal (Index + Pinky extended, Middle + Ring curled)
    if index_ext and pinky_ext and not middle_ext and not ring_ext:
        return "ROCK", pinch_dist

    # 6. Thumbs Up / Thumbs Down (All main fingers curled, thumb extended)
    if ext_count == 0 and thumb_ext:
        thumb_mcp = landmarks[2]
        if thumb_tip.y < thumb_mcp.y - 0.04:
            return "THUMBS_UP", pinch_dist
        elif thumb_tip.y > thumb_mcp.y + 0.04:
            return "THUMBS_DOWN", pinch_dist

    return "IDLE", pinch_dist

# ---------------------------------------------------------------------------
# Drawing Helpers & 3D AR Visualizations
# ---------------------------------------------------------------------------
def draw_hand_skeleton(frame, landmarks, primary_color, secondary_color):
    """Draws hand skeleton connections and pulsing keypoints."""
    h, w, _ = frame.shape
    pts = [get_landmark_px(lm, w, h) for lm in landmarks]

    # Draw bone connections
    for p1_idx, p2_idx in HAND_CONNECTIONS:
        cv2.line(frame, pts[p1_idx], pts[p2_idx], primary_color, 2, cv2.LINE_AA)

    # Draw joint dots
    for i, pt in enumerate(pts):
        # Highlight fingertips (4, 8, 12, 16, 20)
        if i in [4, 8, 12, 16, 20]:
            cv2.circle(frame, pt, 6, secondary_color, -1, cv2.LINE_AA)
            cv2.circle(frame, pt, 9, primary_color, 1, cv2.LINE_AA)
        else:
            cv2.circle(frame, pt, 3, (40, 40, 40), -1, cv2.LINE_AA)
            cv2.circle(frame, pt, 3, primary_color, 1, cv2.LINE_AA)

def update_and_draw_particles(frame):
    """Updates fingertip trailing particle system."""
    global particles
    new_particles = []
    for p in particles:
        x, y, vx, vy, life, color = p
        x += vx
        y += vy
        life -= 0.05
        if life > 0:
            radius = max(1, int(life * 5))
            cv2.circle(frame, (int(x), int(y)), radius, color, -1, cv2.LINE_AA)
            new_particles.append([x, y, vx, vy, life, color])
    particles = new_particles

def emit_particles(px, py, color, count=3):
    """Emits floating particle burst from a screen point."""
    global particles
    for _ in range(count):
        vx = random.uniform(-2.0, 2.0)
        vy = random.uniform(-2.0, 2.0)
        life = random.uniform(0.5, 1.0)
        particles.append([px, py, vx, vy, life, color])

# --- 3D Shape & Hologram Renderers ---

def draw_3d_cube(img, cx, cy, scale, angle, color):
    """Renders a rotating 3D wireframe cube at (cx, cy)."""
    rad = math.radians(angle)
    cos_a, sin_a = math.cos(rad), math.sin(rad)
    cos_b, sin_b = math.cos(rad * 0.7), math.sin(rad * 0.7)

    s = scale
    base_vertices = [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s,  s], [s, -s,  s], [s, s,  s], [-s, s,  s]
    ]

    screen_pts = []
    for x, y, z in base_vertices:
        # Rotate around Y and X axes
        xz_x = x * cos_a + z * sin_a
        xz_z = -x * sin_a + z * cos_a
        
        yz_y = y * cos_b - xz_z * sin_b
        
        px = int(cx + xz_x)
        py = int(cy + yz_y)
        screen_pts.append((px, py))

    edges = [
        (0,1), (1,2), (2,3), (3,0),
        (4,5), (5,6), (6,7), (7,4),
        (0,4), (1,5), (2,6), (3,7)
    ]

    # Render glowing wireframe edges
    for pt1, pt2 in edges:
        cv2.line(img, screen_pts[pt1], screen_pts[pt2], (255, 255, 255), 3, cv2.LINE_AA)
        cv2.line(img, screen_pts[pt1], screen_pts[pt2], color, 1, cv2.LINE_AA)

    # Render vertices
    for pt in screen_pts:
        cv2.circle(img, pt, 3, COLOR_WHITE, -1, cv2.LINE_AA)

def draw_cyber_shield(img, cx, cy, radius, angle, color):
    """Renders a futuristic rotating Cyber HUD Shield / Energy Ring around palm."""
    # Outer ring
    cv2.circle(img, (cx, cy), radius, color, 2, cv2.LINE_AA)
    cv2.circle(img, (cx, cy), radius + 8, COLOR_WHITE, 1, cv2.LINE_AA)
    cv2.circle(img, (cx, cy), int(radius * 0.6), color, 1, cv2.LINE_AA)
    
    # Rotating outer tick marks
    num_ticks = 12
    for i in range(num_ticks):
        a = math.radians(angle + i * (360 / num_ticks))
        x1 = int(cx + (radius - 5) * math.cos(a))
        y1 = int(cy + (radius - 5) * math.sin(a))
        x2 = int(cx + (radius + 12) * math.cos(a))
        y2 = int(cy + (radius + 12) * math.sin(a))
        cv2.line(img, (x1, y1), (x2, y2), COLOR_WHITE if i % 3 == 0 else color, 2, cv2.LINE_AA)

    # Center crosshair
    l = 15
    cv2.line(img, (cx - l, cy), (cx + l, cy), color, 1, cv2.LINE_AA)
    cv2.line(img, (cx, cy - l), (cx, cy + l), color, 1, cv2.LINE_AA)

def draw_energy_core(img, cx, cy, scale, angle, color):
    """Renders a pulsing 3D energy core with orbital wireframes."""
    rad = math.radians(angle)
    
    # 3 Orbital rings rotated at different angles
    for ring_idx in range(3):
        r_angle = rad + ring_idx * (math.pi / 3)
        rx = int(scale * math.cos(r_angle))
        ry = int(scale * 0.5 * math.sin(r_angle))
        
        axes = (scale, max(5, int(scale * abs(math.sin(r_angle)))))
        cv2.ellipse(img, (cx, cy), axes, int(math.degrees(r_angle)), 0, 360, color, 2, cv2.LINE_AA)
    
    # Glowing center core
    cv2.circle(img, (cx, cy), int(scale * 0.4), COLOR_WHITE, -1, cv2.LINE_AA)
    cv2.circle(img, (cx, cy), int(scale * 0.5), color, 2, cv2.LINE_AA)
    emit_particles(cx, cy, color, count=2)

def draw_pyramid_and_laser(img, tip_px, vector_dir, angle, color):
    """Renders a rotating wireframe 3D pyramid on fingertip + laser vector."""
    cx, cy = tip_px
    rad = math.radians(angle)
    cos_a, sin_a = math.cos(rad), math.sin(rad)

    s = 35
    base_vertices = [
        [-s, s, -s], [s, s, -s], [s, s, s], [-s, s, s],
        [0, -s, 0] # Apex
    ]

    screen_pts = []
    for x, y, z in base_vertices:
        rx = x * cos_a + z * sin_a
        ry = y
        screen_pts.append((int(cx + rx), int(cy + ry)))

    edges = [(0,1), (1,2), (2,3), (3,0), (0,4), (1,4), (2,4), (3,4)]
    for pt1, pt2 in edges:
        cv2.line(img, screen_pts[pt1], screen_pts[pt2], color, 2, cv2.LINE_AA)

    # Laser Beam pointing upward from apex
    apex_x, apex_y = screen_pts[4]
    laser_end = (apex_x, apex_y - 120)
    cv2.line(img, (apex_x, apex_y), laser_end, COLOR_WHITE, 4, cv2.LINE_AA)
    cv2.line(img, (apex_x, apex_y), laser_end, color, 2, cv2.LINE_AA)
    cv2.circle(img, laser_end, 5, COLOR_WHITE, -1, cv2.LINE_AA)

def draw_3d_star(img, cx, cy, scale, angle, color):
    """Renders a rotating 3D octahedron / floating star above Victory sign."""
    rad = math.radians(angle)
    cos_a, sin_a = math.cos(rad), math.sin(rad)
    
    s = scale
    # Octahedron vertices
    verts = [
        [0, -s, 0], [0, s, 0],
        [-s, 0, 0], [s, 0, 0],
        [0, 0, -s], [0, 0, s]
    ]

    screen_pts = []
    for x, y, z in verts:
        rx = x * cos_a + z * sin_a
        ry = y
        screen_pts.append((int(cx + rx), int(cy + ry)))

    edges = [
        (0,2), (0,3), (0,4), (0,5), # Top pyramid
        (1,2), (1,3), (1,4), (1,5), # Bottom pyramid
        (2,4), (4,3), (3,5), (5,2)  # Base square
    ]

    for pt1, pt2 in edges:
        cv2.line(img, screen_pts[pt1], screen_pts[pt2], color, 2, cv2.LINE_AA)
    for pt in screen_pts:
        cv2.circle(img, pt, 3, COLOR_WHITE, -1, cv2.LINE_AA)

def draw_electric_arcs(img, pt1, pt2, color):
    """Renders dynamic plasma lightning between two points."""
    dist = calculate_2d_distance(pt1, pt2)
    steps = max(5, int(dist / 15))
    
    pts = [pt1]
    for i in range(1, steps):
        t = i / steps
        lx = int(pt1[0] * (1 - t) + pt2[0] * t + random.randint(-12, 12))
        ly = int(pt1[1] * (1 - t) + pt2[1] * t + random.randint(-12, 12))
        pts.append((lx, ly))
    pts.append(pt2)

    for i in range(len(pts) - 1):
        cv2.line(img, pts[i], pts[i+1], COLOR_WHITE, 3, cv2.LINE_AA)
        cv2.line(img, pts[i], pts[i+1], color, 1, cv2.LINE_AA)

def draw_status_badge(img, cx, cy, is_up, color):
    """Renders 3D Hologram Badge for Thumbs Up / Thumbs Down."""
    w_box, h_box = 140, 50
    x1, y1 = cx - w_box // 2, cy - h_box // 2
    x2, y2 = cx + w_box // 2, cy + h_box // 2

    # Semi-transparent backdrop overlay
    overlay = img.copy()
    cv2.rectangle(overlay, (x1, y1), (x2, y2), (10, 10, 10), -1)
    cv2.addWeighted(overlay, 0.6, img, 0.4, 0, img)

    # Outline
    cv2.rectangle(img, (x1, y1), (x2, y2), color, 2, cv2.LINE_AA)

    label = "LIKE [APPROVED]" if is_up else "DISLIKE [REJECTED]"
    arrow = "^" if is_up else "v"
    
    cv2.putText(img, label, (x1 + 10, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 2)
    cv2.putText(img, arrow, (x2 - 20, cy + 6), cv2.FONT_HERSHEY_SIMPLEX, 0.7, COLOR_WHITE, 2)

# --- Dual-Hand Interactive Effects ---

def draw_dual_pinch_cage(img, pt_left, pt_right, angle, color):
    """Draws a 3D wireframe bounding box stretched between left & right pinches."""
    cx = (pt_left[0] + pt_right[0]) // 2
    cy = (pt_left[1] + pt_right[1]) // 2
    dist = calculate_2d_distance(pt_left, pt_right)
    
    # Connecting laser beam between pinch centers
    cv2.line(img, pt_left, pt_right, COLOR_WHITE, 2, cv2.LINE_AA)
    cv2.line(img, pt_left, pt_right, color, 1, cv2.LINE_AA)
    
    # Render rotating 3D Bounding Cage centered between hands
    draw_3d_cube(img, cx, cy, int(max(25, dist * 0.35)), angle, color)
    
    # Pulse rings on both pinch anchors
    cv2.circle(img, pt_left, 12, COLOR_WHITE, 2, cv2.LINE_AA)
    cv2.circle(img, pt_right, 12, COLOR_WHITE, 2, cv2.LINE_AA)

def draw_plasma_tether(img, palm_left, palm_right, angle, color):
    """Renders a glowing plasma beam & energy grid bridging two open palms."""
    cv2.line(img, palm_left, palm_right, COLOR_WHITE, 4, cv2.LINE_AA)
    cv2.line(img, palm_left, palm_right, color, 2, cv2.LINE_AA)

    # Energy pulse nodes along the tether
    dist = calculate_2d_distance(palm_left, palm_right)
    num_nodes = 5
    for i in range(num_nodes):
        t = (i / float(num_nodes - 1) + (angle * 0.02)) % 1.0
        nx = int(palm_left[0] * (1 - t) + palm_right[0] * t)
        ny = int(palm_left[1] * (1 - t) + palm_right[1] * t)
        cv2.circle(img, (nx, ny), 6, COLOR_WHITE, -1, cv2.LINE_AA)
        cv2.circle(img, (nx, ny), 10, color, 1, cv2.LINE_AA)

    # Cyber rings around both palm centers
    draw_cyber_shield(img, palm_left[0], palm_left[1], 35, angle, COLOR_CYAN)
    draw_cyber_shield(img, palm_right[0], palm_right[1], 35, -angle, COLOR_MAGENTA)

def draw_dual_reactor_core(img, palm_left, palm_right, angle):
    """Renders a massive central AR energy reactor between two fists."""
    cx = (palm_left[0] + palm_right[0]) // 2
    cy = (palm_left[1] + palm_right[1]) // 2
    dist = calculate_2d_distance(palm_left, palm_right)
    
    scale = int(max(30, dist * 0.4))
    draw_energy_core(img, cx, cy, scale, angle, COLOR_ORANGE)
    
    cv2.line(img, palm_left, (cx, cy), COLOR_YELLOW, 2, cv2.LINE_AA)
    cv2.line(img, palm_right, (cx, cy), COLOR_YELLOW, 2, cv2.LINE_AA)

# ---------------------------------------------------------------------------
# HUD Telemetry & Overlay Renderer
# ---------------------------------------------------------------------------
def draw_telemetry_hud(img, fps, hand_data_list, dual_mode_str, show_hud=True):
    """Draws cyberpunk style HUD overlay with real-time tracking telemetry."""
    if not show_hud:
        return

    h, w, _ = img.shape

    # Top Header Bar
    overlay = img.copy()
    cv2.rectangle(overlay, (0, 0), (w, 45), COLOR_DARK_BG, -1)
    cv2.addWeighted(overlay, 0.75, img, 0.25, 0, img)
    
    cv2.line(img, (0, 45), (w, 45), COLOR_CYAN, 1, cv2.LINE_AA)
    cv2.putText(img, "SYSTEM: AR DUAL-HAND TRACKING ENGINE", (20, 28),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, COLOR_CYAN, 2)

    # FPS Counter (Top Right)
    fps_str = f"FPS: {fps:.1f}"
    cv2.putText(img, fps_str, (w - 130, 28),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, COLOR_NEON_GREEN, 2)

    # Left Telemetry Panel
    panel_w, panel_h = 280, 40 + len(hand_data_list) * 55 + (35 if dual_mode_str else 0)
    overlay_panel = img.copy()
    cv2.rectangle(overlay_panel, (15, 60), (15 + panel_w, 60 + panel_h), COLOR_DARK_BG, -1)
    cv2.addWeighted(overlay_panel, 0.7, img, 0.3, 0, img)
    cv2.rectangle(img, (15, 60), (15 + panel_w, 60 + panel_h), COLOR_CYAN, 1, cv2.LINE_AA)

    # Header in panel
    num_hands = len(hand_data_list)
    cv2.putText(img, f"ACTIVE HANDS: {num_hands} / 2 DETECTED", (25, 82),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, COLOR_WHITE, 1)
    cv2.line(img, (25, 90), (15 + panel_w - 10, 90), (70, 70, 70), 1)

    curr_y = 110
    for idx, hand in enumerate(hand_data_list):
        label = hand['label'] # "Left" or "Right"
        gesture = hand['gesture']
        score = hand['score']
        color = hand['color']

        hand_title = f"HAND {idx+1}: {label.upper()} ({score*100:.0f}%)"
        cv2.putText(img, hand_title, (25, curr_y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 2)
        
        gest_text = f"GESTURE: {gesture}"
        cv2.putText(img, gest_text, (35, curr_y + 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, COLOR_WHITE, 1)
        curr_y += 50

    if dual_mode_str:
        cv2.line(img, (25, curr_y - 10), (15 + panel_w - 10, curr_y - 10), COLOR_YELLOW, 1)
        cv2.putText(img, f"DUAL MODE: {dual_mode_str}", (25, curr_y + 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, COLOR_YELLOW, 2)

    # Controls Hint Footer
    cv2.putText(img, "[ESC/Q] Exit  |  [H] Toggle HUD", (20, h - 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180, 180, 180), 1)

# ---------------------------------------------------------------------------
# Main Execution Loop
# ---------------------------------------------------------------------------
def main():
    ensure_model_exists()

    # Initialize MediaPipe Tasks HandLandmarker for 2 hands
    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=2,
        min_hand_detection_confidence=0.65,
        min_hand_presence_confidence=0.65,
        min_tracking_confidence=0.65
    )
    detector = vision.HandLandmarker.create_from_options(options)

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    rotation_angle = 0
    show_hud = True
    prev_time = time.time()
    fps = 0.0

    print("\n=======================================================")
    print("   AR Hand Tracking 3D Engine Initialized (Dual Hand)   ")
    print("=======================================================")
    print("  Supported Gestures:")
    print("   - Pinch           -> Rotating 3D Wireframe Cube")
    print("   - Open Palm       -> Cyber HUD Energy Shield")
    print("   - Fist            -> 3D Energy Core")
    print("   - Point           -> 3D Pyramid & Fingertip Laser")
    print("   - Peace / Victory -> 3D Floating Octahedron Star")
    print("   - Rock / Metal    -> Electric Lightning Arcs")
    print("   - Thumbs Up/Down  -> 3D Holographic Status Badge")
    print("  Dual-Hand Interactive FX:")
    print("   - Dual Pinch      -> 3D Stretch Bounding Cage")
    print("   - Dual Open Palm  -> Glowing Plasma Energy Beam")
    print("   - Dual Fist       -> Central AR Energy Reactor")
    print("=======================================================\n")

    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            print("Failed to capture frame from webcam.")
            break

        # Calculate FPS
        curr_time = time.time()
        dt = curr_time - prev_time
        prev_time = curr_time
        if dt > 0:
            fps = 0.9 * fps + 0.1 * (1.0 / dt)

        # Mirror frame horizontally for intuitive interaction
        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        results = detector.detect(mp_image)

        rotation_angle = (rotation_angle + 3) % 360

        hand_data_list = []
        dual_mode_str = ""

        if results.hand_landmarks:
            num_detected = len(results.hand_landmarks)

            for i in range(num_detected):
                landmarks = results.hand_landmarks[i]
                # landmarks = smooth_landmarks(landmarks, i)
                
                # Fetch handedness label & score
                handedness_cat = results.handedness[i][0]
                raw_label = handedness_cat.category_name # "Left" or "Right"
                score = handedness_cat.score

                # Adjust label for mirror flip display if needed
                label = "Right" if raw_label == "Left" else "Left"

                primary_color = COLOR_CYAN if label == "Left" else COLOR_MAGENTA
                secondary_color = COLOR_NEON_GREEN if label == "Left" else COLOR_YELLOW

                # Draw skeleton
                draw_hand_skeleton(frame, landmarks, primary_color, secondary_color)

                # Classify gesture
                gesture, pinch_dist = classify_hand_gesture(landmarks)

                palm_px = get_palm_center_px(landmarks, w, h)
                index_tip_px = get_landmark_px(landmarks[8], w, h)
                thumb_tip_px = get_landmark_px(landmarks[4], w, h)
                pinky_tip_px = get_landmark_px(landmarks[20], w, h)

                # Add index finger to glowing trail
                # add_finger_trail(index_tip_px, secondary_color, i)

                # Emit subtle particles at fingertip
                emit_particles(index_tip_px[0], index_tip_px[1], secondary_color, count=1)

                hand_data = {
                    'index': i,
                    'label': label,
                    'score': score,
                    'gesture': gesture,
                    'landmarks': landmarks,
                    'palm_px': palm_px,
                    'index_tip_px': index_tip_px,
                    'thumb_tip_px': thumb_tip_px,
                    'pinky_tip_px': pinky_tip_px,
                    'pinch_dist': pinch_dist,
                    'color': primary_color
                }
                hand_data_list.append(hand_data)

            # --- Check for Dual-Hand Interactivity ---
            if len(hand_data_list) == 2:
                h1, h2 = hand_data_list[0], hand_data_list[1]
                g1, g2 = h1['gesture'], h2['gesture']

                # 1. Dual Pinch Bounding Cage
                if g1 == "PINCH" and g2 == "PINCH":
                    dual_mode_str = "DUAL PINCH CAGE"
                    mid_pinch_1 = ((h1['index_tip_px'][0] + h1['thumb_tip_px'][0]) // 2,
                                   (h1['index_tip_px'][1] + h1['thumb_tip_px'][1]) // 2)
                    mid_pinch_2 = ((h2['index_tip_px'][0] + h2['thumb_tip_px'][0]) // 2,
                                   (h2['index_tip_px'][1] + h2['thumb_tip_px'][1]) // 2)
                    draw_dual_pinch_cage(frame, mid_pinch_1, mid_pinch_2, rotation_angle, COLOR_NEON_GREEN)

                # 2. Plasma Energy Tether between open palms
                elif g1 == "OPEN_PALM" and g2 == "OPEN_PALM":
                    dual_mode_str = "PLASMA TETHER"
                    execute_beam(frame, h1['palm_px'], h2['palm_px'], rotation_angle, COLOR_NEON_BLUE)

                                        # Mystic Portal - added effect
                    portal_x = (h1['palm_px'][0] + h2['palm_px'][0]) // 2
                    portal_y = (h1['palm_px'][1] + h2['palm_px'][1]) // 2

                    hand_distance = math.hypot(
                        h2['palm_px'][0] - h1['palm_px'][0],
                        h2['palm_px'][1] - h1['palm_px'][1]
                    )

                    portal_radius = int(
                        max(60, min(180, hand_distance * 0.45))
                    )

                    execute_portal(
                        frame,
                        (portal_x, portal_y),
                        portal_radius,
                        rotation_angle
                    )

                    

                # 3. Dual Fist Central Reactor Core
                elif g1 == "FIST" and g2 == "FIST":
                    dual_mode_str = "REACTOR CORE"
                    draw_dual_reactor_core(frame, h1['palm_px'], h2['palm_px'], rotation_angle)

            # --- Single-Hand Gesture AR Renderings ---
            for hand in hand_data_list:
                gesture = hand['gesture']
                palm_x, palm_y = hand['palm_px']
                idx_x, idx_y = hand['index_tip_px']
                color = hand['color']

                # Skip single-hand drawing if consumed by dual-hand mode
                if dual_mode_str != "":
                    continue

                if gesture == "PINCH":
                    mid_x = (idx_x + hand['thumb_tip_px'][0]) // 2
                    mid_y = (idx_y + hand['thumb_tip_px'][1]) // 2
                    scale = int(35 + (0.055 - hand['pinch_dist']) * 1000)
                    draw_3d_cube(frame, mid_x, mid_y, scale, rotation_angle, color)

                    execute_fireball(frame, (idx_x, idx_y), rotation_angle)

                elif gesture == "OPEN_PALM":
                    draw_cyber_shield(frame, palm_x, palm_y, 65, rotation_angle, color)

                elif gesture == "FIST":
                    draw_energy_core(frame, palm_x, palm_y, 45, rotation_angle, COLOR_ORANGE)

                elif gesture == "POINT":
                    draw_pyramid_and_laser(frame, (idx_x, idx_y), (0, -1), rotation_angle, COLOR_YELLOW)

                elif gesture == "PEACE":
                    draw_3d_star(frame, idx_x, idx_y - 50, 35, rotation_angle, COLOR_NEON_GREEN)

                elif gesture == "ROCK":
                    draw_electric_arcs(frame, (idx_x, idx_y), hand['pinky_tip_px'], COLOR_MAGENTA)
                    emit_particles(idx_x, idx_y, COLOR_MAGENTA, count=3)

                elif gesture in ["THUMBS_UP", "THUMBS_DOWN"]:
                    is_up = (gesture == "THUMBS_UP")
                    b_color = COLOR_NEON_GREEN if is_up else COLOR_RED
                    draw_status_badge(frame, hand['thumb_tip_px'][0], hand['thumb_tip_px'][1] - 40, is_up, b_color)

        # # Draw glowing finger trails
        # draw_finger_trails(frame)

        # Update floating particle animations
        update_and_draw_particles(frame)

        # Render HUD Overlay
        draw_telemetry_hud(frame, fps, hand_data_list, dual_mode_str, show_hud)

        cv2.imshow("AR Hand Tracking 3D Engine", frame)

        key = cv2.waitKey(1) & 0xFF
        if key in [27, ord('q'), ord('Q')]: # ESC or Q
            break
        elif key in [ord('h'), ord('H')]: # Toggle HUD
            show_hud = not show_hud

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()