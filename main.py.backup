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
from actions.beam_action import execute_beam
from ui.hud import draw_hud

from actions.fireball_action import FireballAction
from effects.fireball import draw_fireball, trigger_fireball_launch

# Mystic Web
from actions.web_action import WebAction
from effects.mystic_web import draw_web


# ---------------------------------------------------------------------------
# Model Asset Management for MediaPipe Tasks API
# ---------------------------------------------------------------------------

MODEL_PATH = "hand_landmarker.task"

MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
)


def ensure_model_exists():
    """Downloads hand_landmarker.task if not present locally."""
    if not os.path.exists(MODEL_PATH):
        print(f"Downloading model task file from {MODEL_URL}...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print("Download complete.")


# ---------------------------------------------------------------------------
# Hand Connection Indices
# ---------------------------------------------------------------------------

HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),         # Thumb
    (0, 5), (5, 6), (6, 7), (7, 8),         # Index
    (5, 9), (9, 10), (10, 11), (11, 12),    # Middle
    (9, 13), (13, 14), (14, 15), (15, 16),  # Ring
    (13, 17), (17, 18), (18, 19), (19, 20), # Pinky
    (0, 17)                                  # Palm base
]


# ---------------------------------------------------------------------------
# Color Palette (BGR format)
# ---------------------------------------------------------------------------

COLOR_CYAN = (255, 255, 0)
COLOR_MAGENTA = (255, 0, 255)
COLOR_NEON_GREEN = (0, 255, 128)
COLOR_NEON_BLUE = (255, 165, 0)
COLOR_ORANGE = (0, 140, 255)
COLOR_YELLOW = (0, 230, 255)
COLOR_RED = (50, 50, 255)
COLOR_WHITE = (255, 255, 255)
COLOR_DARK_BG = (20, 20, 20)


# ---------------------------------------------------------------------------
# Particle System
# ---------------------------------------------------------------------------

particles = []


# ---------------------------------------------------------------------------
# Utility Math Functions
# ---------------------------------------------------------------------------

def calculate_distance(p1, p2):
    """Calculates Euclidean distance between two 3D landmarks."""
    return math.sqrt(
        (p1.x - p2.x) ** 2 +
        (p1.y - p2.y) ** 2 +
        (p1.z - p2.z) ** 2
    )


def calculate_2d_distance(pt1, pt2):
    """Calculates 2D Euclidean distance between pixel points."""
    return math.hypot(
        pt1[0] - pt2[0],
        pt1[1] - pt2[1]
    )


def get_landmark_px(lm, w, h):
    """Converts normalized landmark to integer pixel tuple."""
    return (
        int(lm.x * w),
        int(lm.y * h)
    )


def get_palm_center_px(landmarks, w, h):
    """Computes approximate palm center pixel coordinate."""
    wrist = landmarks[0]
    idx_mcp = landmarks[5]
    pinky_mcp = landmarks[17]

    cx = int(
        (wrist.x + idx_mcp.x + pinky_mcp.x)
        / 3.0 * w
    )

    cy = int(
        (wrist.y + idx_mcp.y + pinky_mcp.y)
        / 3.0 * h
    )

    return (cx, cy)


# ---------------------------------------------------------------------------
# Gesture Classification Engine
# ---------------------------------------------------------------------------

def is_finger_extended(
    landmarks,
    tip_idx,
    pip_idx,
    mcp_idx,
    wrist_idx=0
):
    """Determines whether a finger is extended relative to the wrist/MCP."""

    tip = landmarks[tip_idx]
    pip = landmarks[pip_idx]
    mcp = landmarks[mcp_idx]
    wrist = landmarks[wrist_idx]

    dist_tip_wrist = calculate_distance(tip, wrist)
    dist_pip_wrist = calculate_distance(pip, wrist)

    dist_tip_mcp = calculate_distance(tip, mcp)
    dist_pip_mcp = calculate_distance(pip, mcp)

    return (
        dist_tip_wrist > dist_pip_wrist
        and dist_tip_mcp > dist_pip_mcp
    )


def is_thumb_extended(landmarks):
    """Determines if the thumb is extended away from palm."""

    thumb_tip = landmarks[4]
    pinky_mcp = landmarks[17]
    index_mcp = landmarks[5]
    wrist = landmarks[0]

    dist_to_pinky = calculate_distance(
        thumb_tip,
        pinky_mcp
    )

    dist_to_idx = calculate_distance(
        thumb_tip,
        index_mcp
    )

    dist_to_wrist = calculate_distance(
        thumb_tip,
        wrist
    )

    return (
        dist_to_pinky > 0.23
        or (
            dist_to_idx > 0.14
            and dist_to_wrist > 0.20
        )
    )


def classify_hand_gesture(landmarks):
    """
    Classifies single-hand landmarks into gesture states:

    PINCH
    OPEN_PALM
    FIST
    POINT
    PEACE
    ROCK
    THUMBS_UP
    THUMBS_DOWN
    IDLE
    """

    thumb_tip = landmarks[4]
    index_tip = landmarks[8]

    # ---------------------------------------------------------------
    # Pinch distance check
    # ---------------------------------------------------------------

    pinch_dist = calculate_distance(
        thumb_tip,
        index_tip
    )

    if pinch_dist < 0.055:
        return "PINCH", pinch_dist

    # ---------------------------------------------------------------
    # Finger states
    # ---------------------------------------------------------------

    index_ext = is_finger_extended(
        landmarks, 8, 6, 5
    )

    middle_ext = is_finger_extended(
        landmarks, 12, 10, 9
    )

    ring_ext = is_finger_extended(
        landmarks, 16, 14, 13
    )

    pinky_ext = is_finger_extended(
        landmarks, 20, 18, 17
    )

    thumb_ext = is_thumb_extended(landmarks)

    ext_count = sum([
        index_ext,
        middle_ext,
        ring_ext,
        pinky_ext
    ])

    # ---------------------------------------------------------------
    # Open Palm
    # ---------------------------------------------------------------

    if ext_count >= 4 and thumb_ext:
        return "OPEN_PALM", pinch_dist

    if ext_count == 4:
        return "OPEN_PALM", pinch_dist

    # ---------------------------------------------------------------
    # Fist
    # ---------------------------------------------------------------

    if ext_count == 0 and not thumb_ext:
        return "FIST", pinch_dist

    # ---------------------------------------------------------------
    # Point
    # ---------------------------------------------------------------

    if (
        index_ext
        and not middle_ext
        and not ring_ext
        and not pinky_ext
    ):
        return "POINT", pinch_dist

    # ---------------------------------------------------------------
    # Peace / Victory
    # ---------------------------------------------------------------

    if (
        index_ext
        and middle_ext
        and not ring_ext
        and not pinky_ext
    ):
        return "PEACE", pinch_dist

    # ---------------------------------------------------------------
    # Rock / Metal
    # ---------------------------------------------------------------

    if (
        index_ext
        and pinky_ext
        and not middle_ext
        and not ring_ext
    ):
        return "ROCK", pinch_dist

    # ---------------------------------------------------------------
    # Thumbs Up / Down
    # ---------------------------------------------------------------

    if ext_count == 0 and thumb_ext:

        thumb_mcp = landmarks[2]

        if thumb_tip.y < thumb_mcp.y - 0.04:
            return "THUMBS_UP", pinch_dist

        elif thumb_tip.y > thumb_mcp.y + 0.04:
            return "THUMBS_DOWN", pinch_dist

    return "IDLE", pinch_dist


# ---------------------------------------------------------------------------
# Hand Skeleton Renderer
# ---------------------------------------------------------------------------

def draw_hand_skeleton(
    frame,
    landmarks,
    primary_color,
    secondary_color
):
    """Draws hand skeleton connections and keypoints."""

    h, w, _ = frame.shape

    pts = [
        get_landmark_px(lm, w, h)
        for lm in landmarks
    ]

    # Bone connections
    for p1_idx, p2_idx in HAND_CONNECTIONS:
        cv2.line(
            frame,
            pts[p1_idx],
            pts[p2_idx],
            primary_color,
            2,
            cv2.LINE_AA
        )

    # Joint dots
    for i, pt in enumerate(pts):

        # Fingertips
        if i in [4, 8, 12, 16, 20]:

            cv2.circle(
                frame,
                pt,
                6,
                secondary_color,
                -1,
                cv2.LINE_AA
            )

            cv2.circle(
                frame,
                pt,
                9,
                primary_color,
                1,
                cv2.LINE_AA
            )

        else:

            cv2.circle(
                frame,
                pt,
                3,
                (40, 40, 40),
                -1,
                cv2.LINE_AA
            )

            cv2.circle(
                frame,
                pt,
                3,
                primary_color,
                1,
                cv2.LINE_AA
            )


# ---------------------------------------------------------------------------
# Particle System
# ---------------------------------------------------------------------------

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

            radius = max(
                1,
                int(life * 5)
            )

            cv2.circle(
                frame,
                (int(x), int(y)),
                radius,
                color,
                -1,
                cv2.LINE_AA
            )

            new_particles.append([
                x,
                y,
                vx,
                vy,
                life,
                color
            ])

    particles = new_particles


def emit_particles(
    px,
    py,
    color,
    count=3
):
    """Emits floating particle burst."""

    global particles

    for _ in range(count):

        vx = random.uniform(
            -2.0,
            2.0
        )

        vy = random.uniform(
            -2.0,
            2.0
        )

        life = random.uniform(
            0.5,
            1.0
        )

        particles.append([
            px,
            py,
            vx,
            vy,
            life,
            color
        ])


# ---------------------------------------------------------------------------
# 3D Shape & Hologram Renderers
# ---------------------------------------------------------------------------

def draw_3d_cube(
    img,
    cx,
    cy,
    scale,
    angle,
    color
):
    """Renders rotating 3D wireframe cube."""

    rad = math.radians(angle)

    cos_a = math.cos(rad)
    sin_a = math.sin(rad)

    cos_b = math.cos(rad * 0.7)
    sin_b = math.sin(rad * 0.7)

    s = scale

    base_vertices = [
        [-s, -s, -s],
        [s, -s, -s],
        [s, s, -s],
        [-s, s, -s],
        [-s, -s, s],
        [s, -s, s],
        [s, s, s],
        [-s, s, s]
    ]

    screen_pts = []

    for x, y, z in base_vertices:

        xz_x = (
            x * cos_a
            + z * sin_a
        )

        xz_z = (
            -x * sin_a
            + z * cos_a
        )

        yz_y = (
            y * cos_b
            - xz_z * sin_b
        )

        px = int(cx + xz_x)
        py = int(cy + yz_y)

        screen_pts.append(
            (px, py)
        )

    edges = [
        (0, 1),
        (1, 2),
        (2, 3),
        (3, 0),
        (4, 5),
        (5, 6),
        (6, 7),
        (7, 4),
        (0, 4),
        (1, 5),
        (2, 6),
        (3, 7)
    ]

    for pt1, pt2 in edges:

        cv2.line(
            img,
            screen_pts[pt1],
            screen_pts[pt2],
            COLOR_WHITE,
            3,
            cv2.LINE_AA
        )

        cv2.line(
            img,
            screen_pts[pt1],
            screen_pts[pt2],
            color,
            1,
            cv2.LINE_AA
        )

    for pt in screen_pts:

        cv2.circle(
            img,
            pt,
            3,
            COLOR_WHITE,
            -1,
            cv2.LINE_AA
        )


def draw_cyber_shield(
    img,
    cx,
    cy,
    radius,
    angle,
    color
):
    """Renders futuristic rotating Cyber HUD Shield."""

    cv2.circle(
        img,
        (cx, cy),
        radius,
        color,
        2,
        cv2.LINE_AA
    )

    cv2.circle(
        img,
        (cx, cy),
        radius + 8,
        COLOR_WHITE,
        1,
        cv2.LINE_AA
    )

    cv2.circle(
        img,
        (cx, cy),
        int(radius * 0.6),
        color,
        1,
        cv2.LINE_AA
    )

    num_ticks = 12

    for i in range(num_ticks):

        a = math.radians(
            angle + i * (360 / num_ticks)
        )

        x1 = int(
            cx + (radius - 5) * math.cos(a)
        )

        y1 = int(
            cy + (radius - 5) * math.sin(a)
        )

        x2 = int(
            cx + (radius + 12) * math.cos(a)
        )

        y2 = int(
            cy + (radius + 12) * math.sin(a)
        )

        cv2.line(
            img,
            (x1, y1),
            (x2, y2),
            COLOR_WHITE if i % 3 == 0 else color,
            2,
            cv2.LINE_AA
        )

    l = 15

    cv2.line(
        img,
        (cx - l, cy),
        (cx + l, cy),
        color,
        1,
        cv2.LINE_AA
    )

    cv2.line(
        img,
        (cx, cy - l),
        (cx, cy + l),
        color,
        1,
        cv2.LINE_AA
    )


def draw_energy_core(
    img,
    cx,
    cy,
    scale,
    angle,
    color
):
    """Renders pulsing 3D energy core."""

    rad = math.radians(angle)

    for ring_idx in range(3):

        r_angle = (
            rad
            + ring_idx * (math.pi / 3)
        )

        axes = (
            scale,
            max(
                5,
                int(
                    scale
                    * abs(math.sin(r_angle))
                )
            )
        )

        cv2.ellipse(
            img,
            (cx, cy),
            axes,
            int(math.degrees(r_angle)),
            0,
            360,
            color,
            2,
            cv2.LINE_AA
        )

    cv2.circle(
        img,
        (cx, cy),
        int(scale * 0.4),
        COLOR_WHITE,
        -1,
        cv2.LINE_AA
    )

    cv2.circle(
        img,
        (cx, cy),
        int(scale * 0.5),
        color,
        2,
        cv2.LINE_AA
    )

    emit_particles(
        cx,
        cy,
        color,
        count=2
    )


def draw_pyramid_and_laser(
    img,
    tip_px,
    vector_dir,
    angle,
    color
):
    """Renders rotating 3D pyramid + laser."""

    cx, cy = tip_px

    rad = math.radians(angle)

    cos_a = math.cos(rad)
    sin_a = math.sin(rad)

    s = 35

    base_vertices = [
        [-s, s, -s],
        [s, s, -s],
        [s, s, s],
        [-s, s, s],
        [0, -s, 0]
    ]

    screen_pts = []

    for x, y, z in base_vertices:

        rx = (
            x * cos_a
            + z * sin_a
        )

        ry = y

        screen_pts.append(
            (
                int(cx + rx),
                int(cy + ry)
            )
        )

    edges = [
        (0, 1),
        (1, 2),
        (2, 3),
        (3, 0),
        (0, 4),
        (1, 4),
        (2, 4),
        (3, 4)
    ]

    for pt1, pt2 in edges:

        cv2.line(
            img,
            screen_pts[pt1],
            screen_pts[pt2],
            color,
            2,
            cv2.LINE_AA
        )

    apex_x, apex_y = screen_pts[4]

    laser_end = (
        apex_x,
        apex_y - 120
    )

    cv2.line(
        img,
        (apex_x, apex_y),
        laser_end,
        COLOR_WHITE,
        4,
        cv2.LINE_AA
    )

    cv2.line(
        img,
        (apex_x, apex_y),
        laser_end,
        color,
        2,
        cv2.LINE_AA
    )

    cv2.circle(
        img,
        laser_end,
        5,
        COLOR_WHITE,
        -1,
        cv2.LINE_AA
    )


def draw_3d_star(
    img,
    cx,
    cy,
    scale,
    angle,
    color
):
    """Renders rotating 3D octahedron star."""

    rad = math.radians(angle)

    cos_a = math.cos(rad)
    sin_a = math.sin(rad)

    s = scale

    verts = [
        [0, -s, 0],
        [0, s, 0],
        [-s, 0, 0],
        [s, 0, 0],
        [0, 0, -s],
        [0, 0, s]
    ]

    screen_pts = []

    for x, y, z in verts:

        rx = (
            x * cos_a
            + z * sin_a
        )

        ry = y

        screen_pts.append(
            (
                int(cx + rx),
                int(cy + ry)
            )
        )

    edges = [
        (0, 2),
        (0, 3),
        (0, 4),
        (0, 5),
        (1, 2),
        (1, 3),
        (1, 4),
        (1, 5),
        (2, 4),
        (4, 3),
        (3, 5),
        (5, 2)
    ]

    for pt1, pt2 in edges:

        cv2.line(
            img,
            screen_pts[pt1],
            screen_pts[pt2],
            color,
            2,
            cv2.LINE_AA
        )

    for pt in screen_pts:

        cv2.circle(
            img,
            pt,
            3,
            COLOR_WHITE,
            -1,
            cv2.LINE_AA
        )


def draw_electric_arcs(
    img,
    pt1,
    pt2,
    color
):
    """Renders dynamic plasma lightning."""

    dist = calculate_2d_distance(
        pt1,
        pt2
    )

    steps = max(
        5,
        int(dist / 15)
    )

    pts = [pt1]

    for i in range(1, steps):

        t = i / steps

        lx = int(
            pt1[0] * (1 - t)
            + pt2[0] * t
            + random.randint(-12, 12)
        )

        ly = int(
            pt1[1] * (1 - t)
            + pt2[1] * t
            + random.randint(-12, 12)
        )

        pts.append(
            (lx, ly)
        )

    pts.append(pt2)

    for i in range(len(pts) - 1):

        cv2.line(
            img,
            pts[i],
            pts[i + 1],
            COLOR_WHITE,
            3,
            cv2.LINE_AA
        )

        cv2.line(
            img,
            pts[i],
            pts[i + 1],
            color,
            1,
            cv2.LINE_AA
        )


def draw_status_badge(
    img,
    cx,
    cy,
    is_up,
    color
):
    """Renders holographic status badge."""

    w_box = 140
    h_box = 50

    x1 = cx - w_box // 2
    y1 = cy - h_box // 2

    x2 = cx + w_box // 2
    y2 = cy + h_box // 2

    overlay = img.copy()

    cv2.rectangle(
        overlay,
        (x1, y1),
        (x2, y2),
        (10, 10, 10),
        -1
    )

    cv2.addWeighted(
        overlay,
        0.6,
        img,
        0.4,
        0,
        img
    )

    cv2.rectangle(
        img,
        (x1, y1),
        (x2, y2),
        color,
        2,
        cv2.LINE_AA
    )

    label = (
        "LIKE [APPROVED]"
        if is_up
        else
        "DISLIKE [REJECTED]"
    )

    arrow = "^" if is_up else "v"

    cv2.putText(
        img,
        label,
        (x1 + 10, cy + 5),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.45,
        color,
        2
    )

    cv2.putText(
        img,
        arrow,
        (x2 - 20, cy + 6),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        COLOR_WHITE,
        2
    )


# ---------------------------------------------------------------------------
# Dual-Hand Interactive Effects
# ---------------------------------------------------------------------------

def draw_dual_pinch_cage(
    img,
    pt_left,
    pt_right,
    angle,
    color
):
    """Draws 3D bounding cage between pinch points."""

    cx = (
        pt_left[0]
        + pt_right[0]
    ) // 2

    cy = (
        pt_left[1]
        + pt_right[1]
    ) // 2

    dist = calculate_2d_distance(
        pt_left,
        pt_right
    )

    cv2.line(
        img,
        pt_left,
        pt_right,
        COLOR_WHITE,
        2,
        cv2.LINE_AA
    )

    cv2.line(
        img,
        pt_left,
        pt_right,
        color,
        1,
        cv2.LINE_AA
    )

    draw_3d_cube(
        img,
        cx,
        cy,
        int(max(25, dist * 0.35)),
        angle,
        color
    )

    cv2.circle(
        img,
        pt_left,
        12,
        COLOR_WHITE,
        2,
        cv2.LINE_AA
    )

    cv2.circle(
        img,
        pt_right,
        12,
        COLOR_WHITE,
        2,
        cv2.LINE_AA
    )


def draw_plasma_tether(
    img,
    palm_left,
    palm_right,
    angle,
    color
):
    """Renders glowing plasma beam between palms."""

    cv2.line(
        img,
        palm_left,
        palm_right,
        COLOR_WHITE,
        4,
        cv2.LINE_AA
    )

    cv2.line(
        img,
        palm_left,
        palm_right,
        color,
        2,
        cv2.LINE_AA
    )

    num_nodes = 5

    for i in range(num_nodes):

        t = (
            i / float(num_nodes - 1)
            + (angle * 0.02)
        ) % 1.0

        nx = int(
            palm_left[0] * (1 - t)
            + palm_right[0] * t
        )

        ny = int(
            palm_left[1] * (1 - t)
            + palm_right[1] * t
        )

        cv2.circle(
            img,
            (nx, ny),
            6,
            COLOR_WHITE,
            -1,
            cv2.LINE_AA
        )

        cv2.circle(
            img,
            (nx, ny),
            10,
            color,
            1,
            cv2.LINE_AA
        )

    draw_cyber_shield(
        img,
        palm_left[0],
        palm_left[1],
        35,
        angle,
        COLOR_CYAN
    )

    draw_cyber_shield(
        img,
        palm_right[0],
        palm_right[1],
        35,
        -angle,
        COLOR_MAGENTA
    )


def draw_dual_reactor_core(
    img,
    palm_left,
    palm_right,
    angle
):
    """Renders central AR energy reactor."""

    cx = (
        palm_left[0]
        + palm_right[0]
    ) // 2

    cy = (
        palm_left[1]
        + palm_right[1]
    ) // 2

    dist = calculate_2d_distance(
        palm_left,
        palm_right
    )

    scale = int(
        max(30, dist * 0.4)
    )

    draw_energy_core(
        img,
        cx,
        cy,
        scale,
        angle,
        COLOR_ORANGE
    )

    cv2.line(
        img,
        palm_left,
        (cx, cy),
        COLOR_YELLOW,
        2,
        cv2.LINE_AA
    )

    cv2.line(
        img,
        palm_right,
        (cx, cy),
        COLOR_YELLOW,
        2,
        cv2.LINE_AA
    )


# ---------------------------------------------------------------------------
# Main Execution Loop
# ---------------------------------------------------------------------------

def main():

    ensure_model_exists()

    # ---------------------------------------------------------------
    # MediaPipe HandLandmarker
    # ---------------------------------------------------------------

    base_options = python.BaseOptions(
        model_asset_path=MODEL_PATH
    )

    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=2,
        min_hand_detection_confidence=0.65,
        min_hand_presence_confidence=0.65,
        min_tracking_confidence=0.65
    )

    detector = vision.HandLandmarker.create_from_options(
        options
    )

    # ---------------------------------------------------------------
    # Webcam
    # ---------------------------------------------------------------

    cap = cv2.VideoCapture(0)

    cap.set(
        cv2.CAP_PROP_FRAME_WIDTH,
        960
    )

    cap.set(
        cv2.CAP_PROP_FRAME_HEIGHT,
        540
    )

    # ---------------------------------------------------------------
    # Runtime State
    # ---------------------------------------------------------------

    rotation_angle = 0

    show_hud = True

    prev_time = time.time()

    fps = 0.0

    # Fireball system
    fireball_actions = [
        FireballAction(),
        FireballAction()
    ]

    active_fireballs = []

    # Mystic Web system
    web_actions = [
        WebAction(),
        WebAction()
    ]

    # ---------------------------------------------------------------
    # Console Information
    # ---------------------------------------------------------------

    print(
        "\n======================================================="
    )

    print(
        "   AR Hand Tracking 3D Engine Initialized (Dual Hand)"
    )

    print(
        "======================================================="
    )

    print("  Supported Gestures:")

    print(
        "   - Pinch           -> Rotating 3D Wireframe Cube"
    )

    print(
        "   - Open Palm       -> Cyber HUD Energy Shield"
    )

    print(
        "   - Fist            -> 3D Energy Core"
    )

    print(
        "   - Point           -> 3D Pyramid & Fingertip Laser"
    )

    print(
        "   - Peace / Victory -> 3D Floating Octahedron Star"
    )

    print(
        "   - Rock / Metal    -> Electric Lightning Arcs"
    )

    print(
        "   - Thumbs Up/Down  -> 3D Holographic Status Badge"
    )

    print(
        "   - Fireball Pose   -> Charging Fireball + Launch"
    )

    print(
        "   - Web Pose        -> Mystic Web"
    )

    print("  Dual-Hand Interactive FX:")

    print(
        "   - Dual Pinch      -> 3D Stretch Bounding Cage"
    )

    print(
        "   - Dual Open Palm  -> Glowing Plasma Energy Beam"
    )

    print(
        "   - Dual Fist       -> Central AR Energy Reactor"
    )

    print(
        "=======================================================\n"
    )

    # -------------------------------------------------------------------
    # Main Camera Loop
    # -------------------------------------------------------------------

    while cap.isOpened():

        success, frame = cap.read()

        if not success:

            print(
                "Failed to capture frame from webcam."
            )

            break

        # ---------------------------------------------------------------
        # FPS
        # ---------------------------------------------------------------

        curr_time = time.time()

        dt = curr_time - prev_time

        prev_time = curr_time

        if dt > 0:

            fps = (
                0.9 * fps
                + 0.1 * (1.0 / dt)
            )

        # ---------------------------------------------------------------
        # Mirror Camera
        # ---------------------------------------------------------------

        frame = cv2.flip(
            frame,
            1
        )

        h, w, _ = frame.shape

        # ---------------------------------------------------------------
        # MediaPipe Detection
        # ---------------------------------------------------------------

        rgb_frame = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb_frame
        )

        results = detector.detect(
            mp_image
        )

        # ---------------------------------------------------------------
        # Animation Rotation
        # ---------------------------------------------------------------

        rotation_angle = (
            rotation_angle + 3
        ) % 360

        # ---------------------------------------------------------------
        # Frame State
        # ---------------------------------------------------------------

        hand_data_list = []

        dual_mode_str = ""

        # ---------------------------------------------------------------
        # Hand Processing
        # ---------------------------------------------------------------

        if results.hand_landmarks:

            num_detected = len(
                results.hand_landmarks
            )

            for i in range(num_detected):

                landmarks = (
                    results.hand_landmarks[i]
                )

                # -------------------------------------------------------
                # Handedness
                # -------------------------------------------------------

                handedness_cat = (
                    results.handedness[i][0]
                )

                raw_label = (
                    handedness_cat.category_name
                )

                score = (
                    handedness_cat.score
                )

                label = (
                    "Right"
                    if raw_label == "Left"
                    else "Left"
                )

                primary_color = (
                    COLOR_CYAN
                    if label == "Left"
                    else COLOR_MAGENTA
                )

                secondary_color = (
                    COLOR_NEON_GREEN
                    if label == "Left"
                    else COLOR_YELLOW
                )

                # -------------------------------------------------------
                # Skeleton
                # -------------------------------------------------------

                draw_hand_skeleton(
                    frame,
                    landmarks,
                    primary_color,
                    secondary_color
                )

                # -------------------------------------------------------
                # Existing Gesture Classification
                # -------------------------------------------------------

                gesture, pinch_dist = (
                    classify_hand_gesture(
                        landmarks
                    )
                )

                # -------------------------------------------------------
                # Landmark Pixel Positions
                # -------------------------------------------------------

                palm_px = get_palm_center_px(
                    landmarks,
                    w,
                    h
                )

                index_tip_px = get_landmark_px(
                    landmarks[8],
                    w,
                    h
                )

                middle_tip_px = get_landmark_px(
                    landmarks[12],
                    w,
                    h
                )

                thumb_tip_px = get_landmark_px(
                    landmarks[4],
                    w,
                    h
                )

                pinky_tip_px = get_landmark_px(
                    landmarks[20],
                    w,
                    h
                )

                # -------------------------------------------------------
                # Fireball Center
                # -------------------------------------------------------

                fb_center = (
                    (
                        index_tip_px[0]
                        + middle_tip_px[0]
                    ) // 2,

                    (
                        index_tip_px[1]
                        + middle_tip_px[1]
                    ) // 2
                )

                # -------------------------------------------------------
                # Existing Particle FX
                # -------------------------------------------------------

                emit_particles(
                    index_tip_px[0],
                    index_tip_px[1],
                    secondary_color,
                    count=1
                )

                # =======================================================
                # FIREBALL SYSTEM
                # =======================================================

                fb_action = (
                    fireball_actions[i]
                    if i < len(fireball_actions)
                    else FireballAction()
                )

                fireball_state = (
                    fb_action.update(
                        landmarks,
                        dt=dt if dt > 0 else 1 / 60
                    )
                )

                fireball_active = False

                # -------------------------------------------------------
                # Fireball Charging
                # -------------------------------------------------------

                if (
                    fireball_state["active"]
                    or fireball_state["charge"] > 0
                ):

                    fireball_active = True

                    charge = (
                        fireball_state["charge"]
                    )

                    fb_size = int(
                        10 + charge * 25
                    )

                    is_ready_status = (
                        fireball_state["status"]
                        == "READY"
                    )

                    draw_fireball(
                        frame,
                        fb_center,
                        size=fb_size,
                        angle=rotation_angle * 3,
                        charge=charge,
                        is_ready=is_ready_status
                    )

                    if (
                        fireball_state["status"]
                        == "READY"
                    ):

                        cv2.putText(
                            frame,
                            "READY!",
                            (
                                fb_center[0] - 30,
                                fb_center[1] - fb_size - 10
                            ),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.5,
                            (0, 140, 255),
                            2,
                            cv2.LINE_AA
                        )

                    elif (
                        fireball_state["status"]
                        == "CHARGING"
                    ):

                        cv2.putText(
                            frame,
                            f"CHARGING {int(charge * 100)}%",
                            (
                                fb_center[0] - 45,
                                fb_center[1] - fb_size - 10
                            ),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.45,
                            (0, 230, 255),
                            1,
                            cv2.LINE_AA
                        )

                # -------------------------------------------------------
                # Fireball Launch
                # -------------------------------------------------------

                if fireball_state["fire_requested"]:

                    dx = (
                        fb_center[0]
                        - palm_px[0]
                    )

                    dy = (
                        fb_center[1]
                        - palm_px[1]
                    )

                    dist = math.hypot(
                        dx,
                        dy
                    )

                    if dist > 0:

                        vx = (
                            dx / dist
                        ) * 18.0

                        vy = (
                            dy / dist
                        ) * 18.0

                    else:

                        vx = 0.0
                        vy = -18.0

                    active_fireballs.append({
                        "pos": [
                            float(fb_center[0]),
                            float(fb_center[1])
                        ],

                        "vel": [
                            vx,
                            vy
                        ],

                        "life": 25,
                        "max_life": 25
                    })

                    emit_particles(
                        fb_center[0],
                        fb_center[1],
                        COLOR_ORANGE,
                        count=12
                    )

                    trigger_fireball_launch(
                        fb_center,
                        (vx, vy)
                    )

                # =======================================================
                # MYSTIC WEB SYSTEM
                # =======================================================

                web_action = (
                    web_actions[i]
                    if i < len(web_actions)
                    else WebAction()
                )

                web_state = (
                    web_action.update(
                        landmarks,
                        dt=dt if dt > 0 else 1 / 60
                    )
                )

                web_active = (
                    web_state["active"]
                )

                # -------------------------------------------------------
                # Hand Data
                # -------------------------------------------------------

                hand_data = {
                    "index": i,
                    "label": label,
                    "score": score,
                    "gesture": gesture,
                    "landmarks": landmarks,

                    "palm_px": palm_px,

                    "index_tip_px": index_tip_px,

                    "thumb_tip_px": thumb_tip_px,

                    "pinky_tip_px": pinky_tip_px,

                    "pinch_dist": pinch_dist,

                    "color": primary_color,

                    "fireball_active": fireball_active,

                    "web_active": web_active,
                    "web_hold_time": web_state.get("hold_time", 0.0)
                }

                hand_data_list.append(
                    hand_data
                )

            # ===========================================================
            # DUAL-HAND INTERACTIVITY
            # ===========================================================

            if len(hand_data_list) == 2:

                h1 = hand_data_list[0]
                h2 = hand_data_list[1]

                g1 = h1["gesture"]
                g2 = h2["gesture"]

                # -------------------------------------------------------
                # Dual Pinch
                # -------------------------------------------------------

                if (
                    g1 == "PINCH"
                    and g2 == "PINCH"
                ):

                    dual_mode_str = (
                        "DUAL PINCH CAGE"
                    )

                    mid_pinch_1 = (
                        (
                            h1["index_tip_px"][0]
                            + h1["thumb_tip_px"][0]
                        ) // 2,

                        (
                            h1["index_tip_px"][1]
                            + h1["thumb_tip_px"][1]
                        ) // 2
                    )

                    mid_pinch_2 = (
                        (
                            h2["index_tip_px"][0]
                            + h2["thumb_tip_px"][0]
                        ) // 2,

                        (
                            h2["index_tip_px"][1]
                            + h2["thumb_tip_px"][1]
                        ) // 2
                    )

                    draw_dual_pinch_cage(
                        frame,
                        mid_pinch_1,
                        mid_pinch_2,
                        rotation_angle,
                        COLOR_NEON_GREEN
                    )

                # -------------------------------------------------------
                # Dual Open Palm
                # -------------------------------------------------------

                elif (
                    g1 == "OPEN_PALM"
                    and g2 == "OPEN_PALM"
                ):

                    dual_mode_str = (
                        "PLASMA TETHER"
                    )

                    execute_beam(
                        frame,
                        h1["palm_px"],
                        h2["palm_px"],
                        rotation_angle,
                        COLOR_NEON_BLUE
                    )

                    # ---------------------------------------------------
                    # Mystic Portal
                    # ---------------------------------------------------

                    portal_x = (
                        h1["palm_px"][0]
                        + h2["palm_px"][0]
                    ) // 2

                    portal_y = (
                        h1["palm_px"][1]
                        + h2["palm_px"][1]
                    ) // 2

                    hand_distance = math.hypot(
                        h2["palm_px"][0]
                        - h1["palm_px"][0],

                        h2["palm_px"][1]
                        - h1["palm_px"][1]
                    )

                    portal_radius = int(
                        max(
                            60,
                            min(
                                180,
                                hand_distance * 0.45
                            )
                        )
                    )

                    execute_portal(
                        frame,
                        (
                            portal_x,
                            portal_y
                        ),
                        portal_radius,
                        rotation_angle
                    )

                # -------------------------------------------------------
                # Dual Fist
                # -------------------------------------------------------

                elif (
                    g1 == "FIST"
                    and g2 == "FIST"
                ):

                    dual_mode_str = (
                        "REACTOR CORE"
                    )

                    draw_dual_reactor_core(
                        frame,
                        h1["palm_px"],
                        h2["palm_px"],
                        rotation_angle
                    )

            # ===========================================================
            # SINGLE-HAND AR RENDERINGS
            # ===========================================================

            for hand in hand_data_list:

                gesture = hand["gesture"]

                palm_x, palm_y = (
                    hand["palm_px"]
                )

                idx_x, idx_y = (
                    hand["index_tip_px"]
                )

                color = hand["color"]

                # -------------------------------------------------------
                # IMPORTANT:
                # Web is rendered independently from normal gesture
                # classification.
                # -------------------------------------------------------

                if hand.get("web_active", False):

                    web_center = (
                        (
                            hand["index_tip_px"][0]
                            + hand["pinky_tip_px"][0]
                        ) // 2,
                        (
                            hand["index_tip_px"][1]
                            + hand["pinky_tip_px"][1]
                        ) // 2
                    )

                    draw_web(
                        frame,
                        web_center,
                        radius=120,
                        alpha=1.0,
                        palm_center=hand["palm_px"],
                        hold_time=hand.get("web_hold_time", 0.0)
                    )

                    cv2.putText(
                        frame,
                        "WEB",
                        (
                            web_center[0] - 25,
                            web_center[1] - 135
                        ),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        COLOR_WHITE,
                        2,
                        cv2.LINE_AA
                    )

                # -------------------------------------------------------
                # Skip normal single-hand effects during dual mode
                # -------------------------------------------------------

                if dual_mode_str != "":
                    continue

                # -------------------------------------------------------
                # Existing PINCH
                # -------------------------------------------------------

                if gesture == "PINCH":

                    mid_x = (
                        idx_x
                        + hand["thumb_tip_px"][0]
                    ) // 2

                    mid_y = (
                        idx_y
                        + hand["thumb_tip_px"][1]
                    ) // 2

                    scale = int(
                        35
                        + (
                            0.055
                            - hand["pinch_dist"]
                        ) * 1000
                    )

                    draw_3d_cube(
                        frame,
                        mid_x,
                        mid_y,
                        scale,
                        rotation_angle,
                        color
                    )

                # -------------------------------------------------------
                # Existing OPEN PALM
                # -------------------------------------------------------

                elif gesture == "OPEN_PALM":

                    draw_cyber_shield(
                        frame,
                        palm_x,
                        palm_y,
                        65,
                        rotation_angle,
                        color
                    )

                # -------------------------------------------------------
                # Existing FIST
                # -------------------------------------------------------

                elif gesture == "FIST":

                    draw_energy_core(
                        frame,
                        palm_x,
                        palm_y,
                        45,
                        rotation_angle,
                        COLOR_ORANGE
                    )

                # -------------------------------------------------------
                # Existing POINT
                # -------------------------------------------------------

                elif gesture == "POINT":

                    draw_pyramid_and_laser(
                        frame,
                        (idx_x, idx_y),
                        (0, -1),
                        rotation_angle,
                        COLOR_YELLOW
                    )

                # -------------------------------------------------------
                # Existing PEACE
                # -------------------------------------------------------

                elif gesture == "PEACE":

                    if not hand.get(
                        "fireball_active",
                        False
                    ):

                        draw_3d_star(
                            frame,
                            idx_x,
                            idx_y - 50,
                            35,
                            rotation_angle,
                            COLOR_NEON_GREEN
                        )

                # -------------------------------------------------------
                # Existing ROCK
                # -------------------------------------------------------

                elif gesture == "ROCK":

                    if not hand.get(
                        "web_active",
                        False
                    ):

                        draw_electric_arcs(
                            frame,
                            (idx_x, idx_y),
                            hand["pinky_tip_px"],
                            COLOR_MAGENTA
                        )

                        emit_particles(
                            idx_x,
                            idx_y,
                            COLOR_MAGENTA,
                            count=3
                        )

                # -------------------------------------------------------
                # Existing THUMBS
                # -------------------------------------------------------

                elif gesture in [
                    "THUMBS_UP",
                    "THUMBS_DOWN"
                ]:

                    is_up = (
                        gesture == "THUMBS_UP"
                    )

                    b_color = (
                        COLOR_NEON_GREEN
                        if is_up
                        else COLOR_RED
                    )

                    draw_status_badge(
                        frame,
                        hand["thumb_tip_px"][0],
                        hand["thumb_tip_px"][1] - 40,
                        is_up,
                        b_color
                    )

        # =================================================================
        # FIREBALL PROJECTILES
        # =================================================================

        for fb in active_fireballs[:]:

            fb["pos"][0] += (
                fb["vel"][0]
            )

            fb["pos"][1] += (
                fb["vel"][1]
            )

            fb["life"] -= 1

            life_ratio = (
                fb["life"]
                / fb["max_life"]
            )

            fb_size = int(
                35 * life_ratio
            )

            if fb_size >= 5:

                draw_fireball(
                    frame,
                    (
                        int(fb["pos"][0]),
                        int(fb["pos"][1])
                    ),
                    size=fb_size,
                    angle=rotation_angle * 4,
                    charge=1.0,
                    is_projectile=True,
                    velocity=(
                        fb["vel"][0],
                        fb["vel"][1]
                    )
                )

                emit_particles(
                    int(fb["pos"][0]),
                    int(fb["pos"][1]),
                    COLOR_ORANGE,
                    count=2
                )

            if fb["life"] <= 0:

                active_fireballs.remove(
                    fb
                )

        # =================================================================
        # Particle Animation
        # =================================================================

        update_and_draw_particles(
            frame
        )

        # =================================================================
        # HUD
        # =================================================================

        hud_hand_info = []

        if show_hud:

            for hand in hand_data_list:

                hud_hand_info.append({
                    "label": (
                        f"HAND "
                        f"{hand['index'] + 1}: "
                        f"{hand['label'].upper()}"
                    ),

                    "confidence": (
                        hand["score"] * 100
                    ),

                    "gesture": hand["gesture"],

                    "color": hand["color"]
                })

        draw_hud(
            frame,
            fps,
            len(hand_data_list),
            2,
            hud_hand_info,
            dual_mode_str
        )

        # =================================================================
        # Display
        # =================================================================

        cv2.imshow(
            "AR Hand Tracking 3D Engine",
            frame
        )

        key = (
            cv2.waitKey(1)
            & 0xFF
        )

        # ESC / Q
        if key in [
            27,
            ord("q"),
            ord("Q")
        ]:
            break

        # H = HUD toggle
        elif key in [
            ord("h"),
            ord("H")
        ]:
            show_hud = not show_hud

    # =====================================================================
    # Cleanup
    # =====================================================================

    cap.release()

    cv2.destroyAllWindows()


# ---------------------------------------------------------------------------
# Application Entry Point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    main()