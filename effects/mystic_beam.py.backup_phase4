import cv2
import math
import random
import time
import numpy as np

# Module-level particle state for the Plasma Tether
_plasma_tether_particles = []  # [pos_t, dir, speed, perp_offset, size, life, max_life, color]
MAX_TETHER_PARTICLES = 30


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

    # Unit direction vectors: Tangent and Normal
    dx = (x2 - x1) / dist
    dy = (y2 - y1) / dist
    nx = -dy
    ny = dx

    # ---------------------------------------------------------
    # 1. Soft Outer Glow Aura
    # ---------------------------------------------------------
    _draw_roi_glow_line(img, (x1, y1), (x2, y2), color, int(22 + math.sin(t_now * 10.0) * 4), 0.25)
    _draw_roi_glow_line(img, (x1, y1), (x2, y2), COLOR_CYAN, int(12 + math.cos(t_now * 8.0) * 2), 0.35)

    # ---------------------------------------------------------
    # 2. Multi-Strand Oscillating Plasma Waves
    # ---------------------------------------------------------
    steps = max(20, int(dist / 12))
    num_strands = 3

    for strand_idx in range(num_strands):
        pts = []
        freq = 6.0 + strand_idx * 4.0
        speed = (12.0 + strand_idx * 6.0) if strand_idx % 2 == 0 else -(14.0 + strand_idx * 5.0)
        amp_base = (8.0 + strand_idx * 4.0) * (0.8 + 0.4 * math.sin(t_now * 5.0 + strand_idx))

        for s_i in range(steps + 1):
            s = s_i / float(steps)
            # Envelope tapering to 0 at both endpoints
            envelope = math.sin(s * math.pi)

            # Oscillating sine displacement + subtle noise
            wave = math.sin(s * math.pi * freq + t_now * speed) * amp_base * envelope
            jitter = random.uniform(-1.5, 1.5) if strand_idx > 0 else 0.0

            px = int(x1 + s * (x2 - x1) + (wave + jitter) * nx)
            py = int(y1 + s * (y2 - y1) + (wave + jitter) * ny)
            pts.append([px, py])

        pts_arr = np.array(pts, dtype=np.int32).reshape((-1, 1, 2))

        strand_color = COLOR_WHITE if strand_idx == 0 else (color if strand_idx == 1 else COLOR_CYAN)
        thickness = 3 if strand_idx == 0 else 2
        cv2.polylines(img, [pts_arr], False, strand_color, thickness, cv2.LINE_AA)

    # Central Hot Core Line
    cv2.line(img, (x1, y1), (x2, y2), COLOR_WHITE, 2, cv2.LINE_AA)

    # ---------------------------------------------------------
    # 3. Bi-Directional Plasma Energy Particles
    # ---------------------------------------------------------
    # Spawn new particles travelling p1->p2 or p2->p1
    for _ in range(2):
        direction = 1 if random.random() < 0.5 else -1
        init_t = 0.0 if direction == 1 else 1.0
        p_speed = random.uniform(0.02, 0.045) * direction
        offset = random.uniform(-8.0, 8.0)
        p_size = random.randint(2, 4)
        life = random.randint(20, 35)
        p_color = COLOR_WHITE if random.random() < 0.4 else color
        _plasma_tether_particles.append([init_t, direction, p_speed, offset, p_size, life, life, p_color])

    # Update and render particles
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
    # 4. Traveling Energy Pulses / Nodes
    # ---------------------------------------------------------
    num_nodes = 5
    for i in range(num_nodes):
        node_t = (i / float(num_nodes) + (angle * 0.015)) % 1.0
        nx_pos = int(x1 * (1 - node_t) + x2 * node_t)
        ny_pos = int(y1 * (1 - node_t) + y2 * node_t)

        pulse_r = int(6 + 3 * math.sin(t_now * 12.0 + i))
        cv2.circle(img, (nx_pos, ny_pos), pulse_r + 4, color, 1, cv2.LINE_AA)
        cv2.circle(img, (nx_pos, ny_pos), pulse_r, COLOR_WHITE, -1, cv2.LINE_AA)

    # ---------------------------------------------------------
    # 5. Cyber Energy Rings around Both Palms
    # ---------------------------------------------------------
    draw_cyber_shield(img, x1, y1, 35, angle, COLOR_CYAN)
    draw_cyber_shield(img, x2, y2, 35, -angle, COLOR_MAGENTA)


def draw_cyber_shield(img, cx, cy, radius, angle, color):
    """Draws a futuristic energy ring around a palm."""

    COLOR_WHITE = (255, 255, 255)

    # Outer ring
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

    # Rotating tick marks
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

        tick_color = (
            COLOR_WHITE
            if i % 3 == 0
            else color
        )

        cv2.line(
            img,
            (x1, y1),
            (x2, y2),
            tick_color,
            2,
            cv2.LINE_AA
        )

    # Center crosshair
    length = 15

    cv2.line(
        img,
        (cx - length, cy),
        (cx + length, cy),
        color,
        1,
        cv2.LINE_AA
    )

    cv2.line(
        img,
        (cx, cy - length),
        (cx, cy + length),
        color,
        1,
        cv2.LINE_AA
    )