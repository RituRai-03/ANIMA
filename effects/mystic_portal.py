import cv2
import math
import random
import time
import numpy as np

# Persistent portal particle system
_portal_particles = []  # [x, y, radius, angle, speed, size, life, max_life, color]
MAX_PORTAL_PARTICLES = 50


def _point(cx, cy, radius, angle):
    rad = math.radians(angle)
    return (
        int(cx + radius * math.cos(rad)),
        int(cy + radius * math.sin(rad))
    )


def _draw_rune(canvas, center, size, angle, rune_id, color, thickness=2):
    """
    Draws procedural mystical symbols with high-contrast geometry.
    """
    cx, cy = center
    pts = []

    if rune_id % 5 == 0:
        # Triangle rune
        for a in (0, 120, 240):
            pts.append(_point(cx, cy, size, angle + a))
        cv2.polylines(canvas, [np.array(pts, dtype=np.int32)], True, color, thickness, cv2.LINE_AA)

    elif rune_id % 5 == 1:
        # Diamond rune
        pts = [
            _point(cx, cy, size, angle),
            _point(cx, cy, size * 0.55, angle + 90),
            _point(cx, cy, size, angle + 180),
            _point(cx, cy, size * 0.55, angle + 270)
        ]
        cv2.polylines(canvas, [np.array(pts, dtype=np.int32)], True, color, thickness, cv2.LINE_AA)

    elif rune_id % 5 == 2:
        # Cross-star rune
        p1 = _point(cx, cy, size, angle)
        p2 = _point(cx, cy, size, angle + 180)
        p3 = _point(cx, cy, size * 0.65, angle + 90)
        p4 = _point(cx, cy, size * 0.65, angle + 270)
        cv2.line(canvas, p1, p2, color, thickness, cv2.LINE_AA)
        cv2.line(canvas, p3, p4, color, thickness, cv2.LINE_AA)

    elif rune_id % 5 == 3:
        # Hexagonal rune
        pts = [_point(cx, cy, size, angle + i * 60) for i in range(6)]
        cv2.polylines(canvas, [np.array(pts, dtype=np.int32)], True, color, thickness, cv2.LINE_AA)

    else:
        # Concentric Eye Rune
        cv2.circle(canvas, (cx, cy), max(2, int(size * 0.7)), color, thickness, cv2.LINE_AA)
        cv2.circle(canvas, (cx, cy), max(1, int(size * 0.25)), color, -1, cv2.LINE_AA)


def _draw_portal_distortion(frame, center, radius):
    """
    Fast sub-image ROI spatial distortion overlay creating pseudo-refractive
    swirling ripples around the portal rim using standard OpenCV operations.
    """
    cx, cy = int(center[0]), int(center[1])
    r = int(radius * 1.1)
    h, w = frame.shape[:2]

    x1 = max(0, cx - r)
    x2 = min(w, cx + r)
    y1 = max(0, cy - r)
    y2 = min(h, cy + r)

    if x1 >= x2 or y1 >= y2:
        return

    roi = frame[y1:y2, x1:x2]
    rh, rw = roi.shape[:2]

    # Create subtle swirl distortion map
    map_x = np.zeros((rh, rw), dtype=np.float32)
    map_y = np.zeros((rh, rw), dtype=np.float32)

    lcx = cx - x1
    lcy = cy - y1

    grid_y, grid_x = np.mgrid[0:rh, 0:rw].astype(np.float32)
    dx = grid_x - lcx
    dy = grid_y - lcy
    dist = np.sqrt(dx * dx + dy * dy)

    # Ripple frequency band near radius edge
    mask = (dist > r * 0.5) & (dist < r * 1.05)
    angle_shift = 0.08 * np.sin(dist * 0.2)

    cos_a = np.cos(angle_shift)
    sin_a = np.sin(angle_shift)

    map_x = grid_x.copy()
    map_y = grid_y.copy()

    map_x[mask] = lcx + (dx[mask] * cos_a[mask] - dy[mask] * sin_a[mask])
    map_y[mask] = lcy + (dx[mask] * sin_a[mask] + dy[mask] * cos_a[mask])

    distorted_roi = cv2.remap(roi, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    cv2.addWeighted(distorted_roi, 0.45, roi, 0.55, 0, roi)


def draw_mystic_portal(frame, center, radius, rotation=0, scale=1.0, alpha=1.0):
    """
    Renders a multi-layered, pseudo-3D Mystic Portal effect with rotating runes,
    depth/parallax movement, floating energy sparks, distortion ripples, and smooth entrance/exit scaling.
    """
    global _portal_particles

    cx, cy = int(center[0]), int(center[1])
    scale = max(0.01, min(2.5, scale))
    alpha = max(0.0, min(1.0, alpha))
    current_radius = max(10, int(radius * scale))
    t = time.time()

    # ---------------------------------------------------------
    # 0. Sub-image Distortion Ripple Effect
    # ---------------------------------------------------------
    if current_radius > 25:
        _draw_portal_distortion(frame, (cx, cy), current_radius)

    # ---------------------------------------------------------
    # 1. PARALLAX LAYER: BACK (Deep Ambient Glow & Shadow Disk)
    # ---------------------------------------------------------
    glow = np.zeros_like(frame)
    cv2.circle(glow, (cx, cy), int(current_radius * 0.95), (0, 100, 255), 10, cv2.LINE_AA)
    glow = cv2.GaussianBlur(glow, (35, 35), 0)
    cv2.addWeighted(glow, 0.4 * alpha, frame, 1.0, 0, frame)

    # Back depth ring (Cyan/Navy)
    cv2.circle(frame, (cx, cy), int(current_radius * 1.05), (180, 80, 0), max(1, int(2 * scale)), cv2.LINE_AA)

    # ---------------------------------------------------------
    # 2. PARALLAX LAYER: MID (Main Gold/Orange Outer Energy Rings)
    # ---------------------------------------------------------
    cv2.circle(frame, (cx, cy), current_radius, (0, 180, 255), max(1, int(2 * scale)), cv2.LINE_AA)
    cv2.circle(frame, (cx, cy), int(current_radius * 0.88), (0, 230, 255), max(1, int(2 * scale)), cv2.LINE_AA)
    cv2.circle(frame, (cx, cy), int(current_radius * 0.70), (255, 140, 30), max(1, int(2 * scale)), cv2.LINE_AA)

    # ---------------------------------------------------------
    # 3. ROTATING RUNES (Layered Depth & Varying Speeds)
    # ---------------------------------------------------------
    rune_count = 12
    rune_radius_mid = current_radius * 0.84
    rune_radius_back = current_radius * 0.62

    # Mid Layer Runes (Gold/Yellow)
    for i in range(rune_count):
        angle = rotation * 0.8 + i * (360.0 / rune_count)
        rx, ry = _point(cx, cy, rune_radius_mid, angle)
        rsize = max(4, int(current_radius * 0.075))

        # Pulsing rune brightness
        pulse = 0.8 + 0.3 * math.sin(t * 5.0 + i * 0.8)
        color = (
            int(255 * pulse),
            int(190 * pulse),
            int(70 * pulse)
        )

        rune_layer = np.zeros_like(frame)
        _draw_rune(rune_layer, (rx, ry), rsize, -rotation * 2.0 + i * 20, i, color, max(1, int(2 * scale)))
        rune_glow = cv2.GaussianBlur(rune_layer, (11, 11), 0)

        cv2.addWeighted(rune_glow, 0.6 * alpha, frame, 1.0, 0, frame)
        cv2.addWeighted(rune_layer, 0.9 * alpha, frame, 1.0, 0, frame)

    # Back Layer Counter-Rotating Runes (Cyan/Blue)
    for i in range(6):
        angle = -rotation * 1.2 + i * 60.0
        rx, ry = _point(cx, cy, rune_radius_back, angle)
        rsize = max(3, int(current_radius * 0.055))
        color = (255, 230, 100)

        rune_layer = np.zeros_like(frame)
        _draw_rune(rune_layer, (rx, ry), rsize, rotation * 3.0 + i * 30, i + 2, color, max(1, int(1 * scale)))
        cv2.addWeighted(rune_layer, 0.7 * alpha, frame, 1.0, 0, frame)

    # ---------------------------------------------------------
    # 4. ROTATING ARC SEGMENTS & ENERGY TICKS
    # ---------------------------------------------------------
    for i in range(8):
        start_angle = rotation * 1.5 + i * 45
        cv2.ellipse(frame, (cx, cy), (current_radius, current_radius), 0, start_angle, start_angle + 25, (0, 220, 255), max(1, int(3 * scale)), cv2.LINE_AA)

    for i in range(6):
        start_angle = -rotation * 2.0 + i * 60
        cv2.ellipse(frame, (cx, cy), (int(current_radius * 0.70), int(current_radius * 0.70)), 0, start_angle, start_angle + 35, (255, 150, 40), max(1, int(2 * scale)), cv2.LINE_AA)

    for i in range(24):
        angle = -rotation * 1.3 + i * 15
        inner = current_radius * 0.88
        outer = current_radius * 0.98
        p1 = _point(cx, cy, inner, angle)
        p2 = _point(cx, cy, outer, angle)
        cv2.line(frame, p1, p2, (0, 210, 255), max(1, int(2 * scale)), cv2.LINE_AA)

    # ---------------------------------------------------------
    # 5. PARALLAX LAYER: FRONT (Inner Core & Orbiting Sparks)
    # ---------------------------------------------------------
    core_pulse = 1.0 + 0.14 * math.sin(math.radians(rotation * 6))
    core_radius = max(4, int(current_radius * 0.14 * core_pulse))

    cv2.circle(frame, (cx, cy), core_radius + int(12 * scale), (0, 150, 255), max(1, int(2 * scale)), cv2.LINE_AA)
    cv2.circle(frame, (cx, cy), core_radius, (255, 255, 255), -1, cv2.LINE_AA)

    # Orbiting energy sparks
    for i in range(12):
        angle = rotation * 3.2 + i * 30
        spark_r = current_radius * (0.35 + 0.3 * math.sin(t * 4.0 + i))
        sx, sy = _point(cx, cy, spark_r, angle)
        spark_size = max(1, int((2 + (i % 3)) * scale))
        cv2.circle(frame, (sx, sy), spark_size, (0, 220, 255), -1, cv2.LINE_AA)

    # ---------------------------------------------------------
    # 6. DYNAMIC ENERGY PARTICLES (Sparks & Inward Floating Embers)
    # ---------------------------------------------------------
    if random.random() < 0.7:
        p_ang = random.uniform(0, 360)
        p_r = current_radius * random.uniform(0.3, 1.1)
        p_spd = random.uniform(-1.5, -0.3)
        p_life = random.randint(15, 35)
        p_size = random.randint(2, 4)
        p_col = (0, random.randint(160, 255), 255)
        _portal_particles.append([float(cx), float(cy), p_r, p_ang, p_spd, p_size, p_life, p_life, p_col])

    new_particles = []
    for p in _portal_particles:
        pcx, pcy, pr, pang, pspd, psz, plife, pmax_l, pcol = p
        pr += pspd
        pang += 1.8
        plife -= 1

        if pr > 5 and plife > 0:
            px, py = _point(pcx, pcy, pr, pang)
            p_alpha = plife / float(pmax_l)
            curr_sz = max(1, int(psz * p_alpha * scale))
            cv2.circle(frame, (px, py), curr_sz, pcol, -1, cv2.LINE_AA)
            new_particles.append([pcx, pcy, pr, pang, pspd, psz, plife, pmax_l, pcol])

    _portal_particles = new_particles[-MAX_PORTAL_PARTICLES:]

    return frame