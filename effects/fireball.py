import cv2
import math
import random
import time
import numpy as np

# Module-level state for persistent fireball particle FX
_fireball_embers = []      # [x, y, vx, vy, size, life, max_life, color]
_fireball_shockwaves = []  # [x, y, radius, max_radius, life, max_life, color]
_fireball_flashes = []     # [x, y, radius, life, max_life]

MAX_EMBERS = 60

def _draw_roi_glow(frame, center, radius, color, alpha):
    """
    Fast sub-image ROI alpha blending for glow circles.
    Avoids copying the full frame buffer.
    """
    if alpha <= 0 or radius <= 0:
        return
    x, y = center
    r = int(radius)
    h, w = frame.shape[:2]

    x1 = max(0, x - r)
    x2 = min(w, x + r)
    y1 = max(0, y - r)
    y2 = min(h, y + r)

    if x1 >= x2 or y1 >= y2:
        return

    roi = frame[y1:y2, x1:x2]
    overlay = roi.copy()
    lx = x - x1
    ly = y - y1

    cv2.circle(overlay, (lx, ly), r, color, -1, cv2.LINE_AA)
    cv2.addWeighted(overlay, min(1.0, alpha), roi, 1.0 - min(1.0, alpha), 0, roi)


def trigger_fireball_launch(center, velocity=(0, -18.0)):
    """
    Triggers an explosive launch effect at the given center location.
    Includes a bright launch flash, an expanding shockwave ring, and a burst of fast embers.
    """
    global _fireball_embers, _fireball_shockwaves, _fireball_flashes

    cx, cy = int(center[0]), int(center[1])
    vx, vy = velocity

    # Bright launch flash
    _fireball_flashes.append([cx, cy, 45, 5, 5])

    # Expanding shockwave ring
    _fireball_shockwaves.append([cx, cy, 10, 70, 12, 12, (0, 180, 255)])

    # Explosive directional ember burst
    for _ in range(18):
        angle = random.uniform(0, 2 * math.pi)
        speed = random.uniform(3.0, 9.0)
        evx = math.cos(angle) * speed + vx * 0.3
        evy = math.sin(angle) * speed + vy * 0.3
        life = random.randint(12, 24)
        size = random.randint(2, 5)
        color = (0, random.randint(120, 240), 255)
        _fireball_embers.append([float(cx), float(cy), evx, evy, size, life, life, color])

    # Enforce maximum particle count
    if len(_fireball_embers) > MAX_EMBERS:
        _fireball_embers = _fireball_embers[-MAX_EMBERS:]


def draw_fireball(frame, center, size=35, angle=0, charge=1.0, is_ready=False, is_projectile=False, velocity=(0, 0)):
    """
    Renders a cinematic, multi-layered AR Fireball effect.

    Parameters:
        frame: OpenCV image frame.
        center: Tuple (x, y) coordinates of fireball center.
        size: Base size/radius of fireball core.
        angle: Animation angle/timestamp for rotation.
        charge: Charge progression factor (0.0 to 1.0).
        is_ready: Boolean indicating if charge reached READY state.
        is_projectile: Boolean indicating if fireball is in projectile flight mode.
        velocity: Tuple (vx, vy) for directional flight trail.
    """
    global _fireball_embers, _fireball_shockwaves, _fireball_flashes

    x, y = int(center[0]), int(center[1])
    base_size = max(5, int(size))
    t = time.time()

    # ---------------------------------------------------------
    # 1. Pulsing / Breathing Animation
    # ---------------------------------------------------------
    if is_ready:
        pulse = math.sin(t * 12.0) * 3.5 + math.cos(t * 23.0) * 1.5
        effective_size = max(8, int(base_size + pulse))
    else:
        pulse = math.sin(t * 6.0) * (1.5 * charge)
        effective_size = max(6, int(base_size + pulse))

    # ---------------------------------------------------------
    # 2. Outer Soft Glow Layers (ROI Gradient)
    # ---------------------------------------------------------
    glow_mult = 2.2 if is_ready else (1.4 + 0.5 * charge)
    glow_r1 = int(effective_size * glow_mult)
    glow_r2 = int(effective_size * (glow_mult * 0.7))

    glow_alpha1 = 0.25 if is_ready else (0.12 * charge)
    glow_alpha2 = 0.35 if is_ready else (0.20 * charge)

    # Deep red/orange outer aura
    _draw_roi_glow(frame, (x, y), glow_r1, (0, 50, 255), glow_alpha1)
    # Bright orange middle aura
    _draw_roi_glow(frame, (x, y), glow_r2, (0, 130, 255), glow_alpha2)

    # ---------------------------------------------------------
    # 3. Rotating & Flickering Flame Lobes
    # ---------------------------------------------------------
    num_lobes = 10 if is_ready else 8
    rot_base = angle * 2.0 if angle != 0 else (t * 180.0)

    for i in range(num_lobes):
        lobe_angle = math.radians(rot_base + i * (360.0 / num_lobes))
        # Random flicking distance
        dist = effective_size * (1.05 + 0.25 * math.sin(t * 15.0 + i))
        lx = int(x + dist * math.cos(lobe_angle))
        ly = int(y + dist * math.sin(lobe_angle))
        lsize = max(2, int(effective_size * 0.28 + random.randint(-1, 2)))

        # Outer flame lobes
        cv2.circle(frame, (lx, ly), lsize, (0, random.randint(100, 200), 255), -1, cv2.LINE_AA)

    # ---------------------------------------------------------
    # 4. Multi-Layered Fireball Core
    # ---------------------------------------------------------
    # Layer 1: Outer flame rim (Red-Orange)
    cv2.circle(frame, (x, y), effective_size, (0, 70, 255), -1, cv2.LINE_AA)

    # Layer 2: Mid flame body (Vivid Orange)
    mid_r = int(effective_size * 0.72)
    if mid_r > 0:
        cv2.circle(frame, (x, y), mid_r, (0, 140, 255), -1, cv2.LINE_AA)

    # Layer 3: Inner flame core (Bright Yellow-Orange)
    inner_r = int(effective_size * 0.45)
    if inner_r > 0:
        cv2.circle(frame, (x, y), inner_r, (0, 210, 255), -1, cv2.LINE_AA)

    # Layer 4: Hot center (Intense White/Yellow)
    hot_r = int(effective_size * 0.22)
    if hot_r > 0:
        core_color = (255, 255, 255) if (is_ready or charge > 0.8) else (180, 245, 255)
        cv2.circle(frame, (x, y), hot_r, core_color, -1, cv2.LINE_AA)

    # ---------------------------------------------------------
    # 5. Ready State Electric Arcs & Plasma Sparks
    # ---------------------------------------------------------
    if is_ready:
        for _ in range(3):
            arc_angle = random.uniform(0, 2 * math.pi)
            r1 = effective_size * random.uniform(0.8, 1.1)
            r2 = effective_size * random.uniform(1.3, 1.7)
            x1 = int(x + r1 * math.cos(arc_angle))
            y1 = int(y + r1 * math.sin(arc_angle))
            x2 = int(x + r2 * math.cos(arc_angle + random.uniform(-0.3, 0.3)))
            y2 = int(y + r2 * math.sin(arc_angle + random.uniform(-0.3, 0.3)))
            cv2.line(frame, (x1, y1), (x2, y2), (200, 255, 255), 1, cv2.LINE_AA)

    # ---------------------------------------------------------
    # 6. Particle Emission (Embers & Trailing Wake)
    # ---------------------------------------------------------
    if is_projectile:
        # Directional trailing embers opposite to velocity
        vx, vy = velocity
        for _ in range(2):
            evx = -vx * random.uniform(0.2, 0.6) + random.uniform(-1.0, 1.0)
            evy = -vy * random.uniform(0.2, 0.6) + random.uniform(-1.0, 1.0)
            life = random.randint(10, 20)
            esize = random.randint(2, 4)
            color = (0, random.randint(140, 240), 255)
            _fireball_embers.append([float(x), float(y), evx, evy, esize, life, life, color])
    else:
        # Floating embers during charging / ready
        spawn_rate = 3 if is_ready else (1 if random.random() < charge else 0)
        for _ in range(spawn_rate):
            ang = random.uniform(0, 2 * math.pi)
            dist = random.uniform(0, effective_size * 0.8)
            px = x + dist * math.cos(ang)
            py = y + dist * math.sin(ang)
            evx = random.uniform(-1.2, 1.2)
            evy = random.uniform(-2.2, -0.5)
            life = random.randint(12, 28)
            esize = random.randint(2, 4)
            color = (0, random.randint(120, 230), 255)
            _fireball_embers.append([px, py, evx, evy, esize, life, life, color])

    # Cap particle list
    if len(_fireball_embers) > MAX_EMBERS:
        _fireball_embers = _fireball_embers[-MAX_EMBERS:]

    # ---------------------------------------------------------
    # 7. Render Active Launch Flashes & Shockwaves
    # ---------------------------------------------------------
    # Render launch flashes
    new_flashes = []
    for flash in _fireball_flashes:
        fx, fy, fr, life, max_l = flash
        alpha = life / max_l
        _draw_roi_glow(frame, (fx, fy), fr * alpha, (200, 240, 255), 0.6 * alpha)
        life -= 1
        if life > 0:
            new_flashes.append([fx, fy, fr, life, max_l])
    _fireball_flashes = new_flashes

    # Render expanding shockwaves
    new_shockwaves = []
    for sw in _fireball_shockwaves:
        sx, sy, r_curr, r_max, life, max_l, color = sw
        progress = 1.0 - (life / max_l)
        curr_r = int(r_curr + (r_max - r_curr) * progress)
        alpha = life / max_l
        _draw_roi_glow(frame, (sx, sy), curr_r, color, 0.25 * alpha)
        cv2.circle(frame, (sx, sy), curr_r, (0, int(200 * alpha), 255), max(1, int(3 * alpha)), cv2.LINE_AA)
        life -= 1
        if life > 0:
            new_shockwaves.append([sx, sy, r_curr, r_max, life, max_l, color])
    _fireball_shockwaves = new_shockwaves

    # ---------------------------------------------------------
    # 8. Render & Update Floating Embers
    # ---------------------------------------------------------
    new_embers = []
    for p in _fireball_embers:
        px, py, evx, evy, esize, life, max_l, color = p
        px += evx
        py += evy
        life -= 1

        alpha = life / max_l
        curr_size = max(1, int(esize * alpha))

        # Render ember
        cv2.circle(frame, (int(px), int(py)), curr_size, color, -1, cv2.LINE_AA)

        if life > 0:
            new_embers.append([px, py, evx, evy, esize, life, max_l, color])
    _fireball_embers = new_embers

    return frame




