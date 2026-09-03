import cv2
import math
import random
import time
import numpy as np

# Persistent particle state for the Plasma Tether
_plasma_tether_particles = []  # [pos_t, dir, speed, perp_offset, size, life, max_life, color]
MAX_TETHER_PARTICLES = 50


def calculate_2d_distance(pt1, pt2):
    """Calculate 2D distance between two pixel points."""
    return math.hypot(pt1[0] - pt2[0], pt1[1] - pt2[1])


def _draw_roi_glow_line(img, p1, p2, color, thickness, alpha):
    """Draws a soft alpha glow line between p1 and p2 using ROI blending."""
    if alpha <= 0 or thickness <= 0:
        return
    x1, y1 = p1
    x2, y2 = p2
    pad = int(thickness) + 5
    h, w = img.shape[:2]

    min_x = max(0, min(x1, x2) - pad)
    max_x = min(w, max(x1, x2) + pad)
    min_y = max(0, min(y1, y2) - pad)
    max_y = min(h, max(y1, y2) + pad)

    if min_x >= max_x or min_y >= max_y:
        return

    roi = img[min_y:max_y, min_x:max_x]
    overlay = roi.copy()

    lp1 = (x1 - min_x, y1 - min_y)
    lp2 = (x2 - min_x, y2 - min_y)

    cv2.line(overlay, lp1, lp2, color, thickness, cv2.LINE_AA)
    cv2.addWeighted(overlay, min(1.0, alpha), roi, 1.0 - min(1.0, alpha), 0, roi)


def _draw_lightning_branch(img, start_pt, angle_rad, length, color):
    """
    Renders a jagged, branching lightning arc extending from the main tether.
    """
    segments = 4
    pts = [start_pt]
    curr_x, curr_y = start_pt
    seg_len = length / float(segments)

    for i in range(segments):
        offset_angle = angle_rad + random.uniform(-0.5, 0.5)
        curr_x += seg_len * math.cos(offset_angle)
        curr_y += seg_len * math.sin(offset_angle)
        pts.append((int(curr_x), int(curr_y)))

    for idx in range(len(pts) - 1):
        cv2.line(img, pts[idx], pts[idx + 1], color, 1, cv2.LINE_AA)
        cv2.circle(img, pts[idx + 1], 1, (255, 255, 255), -1, cv2.LINE_AA)


def draw_plasma_tether(img, palm_left, palm_right, angle, color):
    """Renders a cinematic, futuristic AR Plasma Energy Tether between two open palms."""
    global _plasma_tether_particles

    x1, y1 = int(palm_left[0]), int(palm_left[1])
    x2, y2 = int(palm_right[0]), int(palm_right[1])

    dist = calculate_2d_distance((x1, y1), (x2, y2))
    if dist < 5:
        return

    t_now = time.time()
    COLOR_WHITE = (255, 255, 255)
    COLOR_CYAN = (255, 255, 0)
    COLOR_MAGENTA = (255, 0, 255)
    COLOR_BLUE_WHITE = (255, 230, 180)

    # Unit direction vectors: Tangent and Normal
    dx = (x2 - x1) / dist
    dy = (y2 - y1) / dist
    nx = -dy
    ny = dx

    # ---------------------------------------------------------
    # 1. Soft Outer Glow Aura & Dynamic Fluctuation
    # ---------------------------------------------------------
    glow_w1 = int(24 + math.sin(t_now * 12.0) * 6)
    glow_w2 = int(14 + math.cos(t_now * 9.0) * 4)
    _draw_roi_glow_line(img, (x1, y1), (x2, y2), color, glow_w1, 0.28)
    _draw_roi_glow_line(img, (x1, y1), (x2, y2), COLOR_CYAN, glow_w2, 0.40)

    # ---------------------------------------------------------
    # 2. Multi-Strand Sinuous Curved Plasma Waves
    # ---------------------------------------------------------
    steps = max(24, int(dist / 10))
    num_strands = 4

    main_curve_pts = []

    for strand_idx in range(num_strands):
        pts = []
        freq = 4.0 + strand_idx * 3.5
        speed = (10.0 + strand_idx * 5.0) if strand_idx % 2 == 0 else -(12.0 + strand_idx * 4.0)
        amp_base = (10.0 + strand_idx * 5.0) * (0.8 + 0.4 * math.sin(t_now * 6.0 + strand_idx))

        for s_i in range(steps + 1):
            s = s_i / float(steps)
            envelope = math.sin(s * math.pi)

            # Continuous curved wave movement
            wave = math.sin(s * math.pi * freq + t_now * speed) * amp_base * envelope
            jitter = random.uniform(-2.0, 2.0) if strand_idx > 0 else 0.0

            px = int(x1 + s * (x2 - x1) + (wave + jitter) * nx)
            py = int(y1 + s * (y2 - y1) + (wave + jitter) * ny)
            pts.append([px, py])

            if strand_idx == 0:
                main_curve_pts.append((px, py))

        pts_arr = np.array(pts, dtype=np.int32).reshape((-1, 1, 2))
        strand_color = COLOR_WHITE if strand_idx == 0 else (color if strand_idx == 1 else (COLOR_CYAN if strand_idx == 2 else COLOR_BLUE_WHITE))
        thickness = max(1, 3 if strand_idx == 0 else 2)
        cv2.polylines(img, [pts_arr], False, strand_color, thickness, cv2.LINE_AA)

    # ---------------------------------------------------------
    # 3. Dynamic Branching Lightning Arcs
    # ---------------------------------------------------------
    if len(main_curve_pts) > 6:
        for _ in range(3):
            branch_idx = random.randint(2, len(main_curve_pts) - 3)
            b_pt = main_curve_pts[branch_idx]
            b_angle = math.atan2(ny, nx) + (math.pi / 2.0 if random.random() < 0.5 else -math.pi / 2.0)
            _draw_lightning_branch(img, b_pt, b_angle, random.uniform(15, 35), COLOR_BLUE_WHITE)

    # ---------------------------------------------------------
    # 4. Bi-Directional Traveling Energy Pulses (HAND A -> HAND B & HAND B -> HAND A)
    # ---------------------------------------------------------
    # Pulses moving A -> B
    num_pulses = 4
    for i in range(num_pulses):
        # Forward pulse (A -> B)
        pulse_t1 = ((t_now * 0.85) + i * (1.0 / num_pulses)) % 1.0
        px1 = int(x1 * (1.0 - pulse_t1) + x2 * pulse_t1)
        py1 = int(y1 * (1.0 - pulse_t1) + y2 * pulse_t1)
        env1 = math.sin(pulse_t1 * math.pi)
        r_pulse1 = int((7 + 4 * math.sin(t_now * 14.0 + i)) * env1)

        if r_pulse1 > 1:
            cv2.circle(img, (px1, py1), r_pulse1 + 4, color, 1, cv2.LINE_AA)
            cv2.circle(img, (px1, py1), r_pulse1, COLOR_WHITE, -1, cv2.LINE_AA)

        # Reverse pulse (B -> A)
        pulse_t2 = (1.0 - ((t_now * 0.6) + i * (1.0 / num_pulses))) % 1.0
        px2 = int(x1 * (1.0 - pulse_t2) + x2 * pulse_t2)
        py2 = int(y1 * (1.0 - pulse_t2) + y2 * pulse_t2)
        env2 = math.sin(pulse_t2 * math.pi)
        r_pulse2 = int((6 + 3 * math.cos(t_now * 12.0 + i)) * env2)

        if r_pulse2 > 1:
            cv2.circle(img, (px2, py2), r_pulse2 + 3, COLOR_CYAN, 1, cv2.LINE_AA)
            cv2.circle(img, (px2, py2), r_pulse2, COLOR_WHITE, -1, cv2.LINE_AA)

    # ---------------------------------------------------------
    # 5. Particle Discharge around Hands & Tether
    # ---------------------------------------------------------
    # Hand A & Hand B discharge particles
    for hand_pt in [(x1, y1), (x2, y2)]:
        if random.random() < 0.6:
            p_ang = random.uniform(0, 2 * math.pi)
            p_dist = random.uniform(5, 30)
            px_p = int(hand_pt[0] + math.cos(p_ang) * p_dist)
            py_p = int(hand_pt[1] + math.sin(p_ang) * p_dist)
            cv2.circle(img, (px_p, py_p), random.randint(1, 3), COLOR_WHITE, -1, cv2.LINE_AA)

    # Tether particle emission along beam
    for _ in range(2):
        direction = 1 if random.random() < 0.5 else -1
        init_t = 0.0 if direction == 1 else 1.0
        p_speed = random.uniform(0.02, 0.05) * direction
        offset = random.uniform(-10.0, 10.0)
        p_size = random.randint(2, 5)
        life = random.randint(18, 32)
        p_color = COLOR_WHITE if random.random() < 0.4 else color
        _plasma_tether_particles.append([init_t, direction, p_speed, offset, p_size, life, life, p_color])

    new_particles = []
    for p in _plasma_tether_particles:
        pos_t, p_dir, p_speed, offset, p_size, life, max_l, p_color = p
        pos_t += p_speed
        life -= 1

        if 0.0 <= pos_t <= 1.0 and life > 0:
            envelope = math.sin(pos_t * math.pi)
            px = int(x1 + pos_t * (x2 - x1) + (offset * envelope) * nx)
            py = int(y1 + pos_t * (y2 - y1) + (offset * envelope) * ny)

            alpha = life / max_l
            curr_size = max(1, int(p_size * alpha))

            cv2.circle(img, (px, py), curr_size + 2, COLOR_CYAN, -1, cv2.LINE_AA)
            cv2.circle(img, (px, py), curr_size, COLOR_WHITE, -1, cv2.LINE_AA)
            new_particles.append([pos_t, p_dir, p_speed, offset, p_size, life, max_l, p_color])

    _plasma_tether_particles = new_particles[-MAX_TETHER_PARTICLES:]

    # ---------------------------------------------------------
    # 6. Cyber Energy Rings around Both Palms
    # ---------------------------------------------------------
    draw_cyber_shield(img, x1, y1, 35, angle, COLOR_CYAN)
    draw_cyber_shield(img, x2, y2, 35, -angle, COLOR_MAGENTA)


def draw_cyber_shield(img, cx, cy, radius, angle, color):
    """Draws a futuristic energy ring around a palm."""
    COLOR_WHITE = (255, 255, 255)

    cv2.circle(img, (cx, cy), radius, color, 2, cv2.LINE_AA)
    cv2.circle(img, (cx, cy), radius + 8, COLOR_WHITE, 1, cv2.LINE_AA)
    cv2.circle(img, (cx, cy), int(radius * 0.6), color, 1, cv2.LINE_AA)

    # Rotating tick marks
    num_ticks = 12
    for i in range(num_ticks):
        a = math.radians(angle + i * (360 / num_ticks))
        x1 = int(cx + (radius - 5) * math.cos(a))
        y1 = int(cy + (radius - 5) * math.sin(a))
        x2 = int(cx + (radius + 12) * math.cos(a))
        y2 = int(cy + (radius + 12) * math.sin(a))
        tick_color = COLOR_WHITE if i % 3 == 0 else color
        cv2.line(img, (x1, y1), (x2, y2), tick_color, 2, cv2.LINE_AA)

    # Center crosshair
    length = 15
    cv2.line(img, (cx - length, cy), (cx + length, cy), color, 1, cv2.LINE_AA)
    cv2.line(img, (cx, cy - length), (cx, cy + length), color, 1, cv2.LINE_AA)