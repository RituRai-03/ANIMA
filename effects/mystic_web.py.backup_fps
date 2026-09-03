import cv2
import math
import numpy as np


def draw_web_muzzle_flash(frame, origin_pt, hold_time=0.0, hand_scale=1.0):
    """
    Renders a fast, mechanical/energy web-shooter ejection burst at the palm/shooter origin.
    Only active during the first ~0.25 seconds of shooting.
    """
    if hold_time > 0.25:
        return

    ox, oy = int(origin_pt[0]), int(origin_pt[1])
    progress = hold_time / 0.25
    fade = max(0.0, 1.0 - progress)

    bright_white = (255, 255, 255)
    cyan_glow = (255, 235, 200) # Subtle cyan-blue energy tint
    silk_silver = (215, 215, 230)

    # Scale elements dynamically based on hand distance
    s = max(0.5, min(2.2, hand_scale))

    # 1. High-speed radial web ejection spikes & mechanical energy burst
    spikes = 10
    spike_len = int(35 * fade * s)
    for i in range(spikes):
        angle = (2 * math.pi * i / spikes) + (progress * 1.2)
        ex = int(ox + math.cos(angle) * spike_len)
        ey = int(oy + math.sin(angle) * spike_len)
        # Inner white spike, outer cyan glow
        cv2.line(frame, (ox, oy), (ex, ey), cyan_glow, max(1, int(3 * s)), cv2.LINE_AA)
        cv2.line(frame, (ox, oy), (ex, ey), bright_white, max(1, int(1 * s)), cv2.LINE_AA)

    # 2. Concentric mechanical shooter flash rings & diamond nozzle core
    r_inner = max(2, int(8 * fade * s))
    r_outer = max(4, int(22 * fade * s))
    cv2.circle(frame, (ox, oy), r_outer, cyan_glow, max(1, int(2 * s)), cv2.LINE_AA)
    cv2.circle(frame, (ox, oy), r_inner, bright_white, -1, cv2.LINE_AA)

    # Diamond crosshair burst
    d_size = int(14 * fade * s)
    pts = np.array([
        [ox, oy - d_size],
        [ox + d_size, oy],
        [ox, oy + d_size],
        [ox - d_size, oy]
    ], np.int32)
    cv2.polylines(frame, [pts], True, silk_silver, max(1, int(1 * s)), cv2.LINE_AA)


def draw_web_projectile_and_impact(frame, proj, hand_scale=1.0):
    """
    Renders a flying Spider-Man web projectile with trailing tension strand,
    motion particles, and radial web impact burst upon reaching the target.
    """
    pos = proj.get('pos', [0, 0])
    origin = proj.get('origin', [0, 0])
    target = proj.get('target', [0, 0])
    life = proj.get('life', 20)
    max_life = proj.get('max_life', 20)
    phase = proj.get('phase', 'shooting')

    px, py = int(pos[0]), int(pos[1])
    ox, oy = int(origin[0]), int(origin[1])
    tx, ty = int(target[0]), int(target[1])

    life_ratio = max(0.0, life / float(max_life))
    bright_white = (255, 255, 255)
    silk_silver = (215, 215, 230)
    cyan_glow = (255, 235, 200)

    s = max(0.5, min(2.2, hand_scale))

    if phase == 'shooting':
        # 1. Main elastic web cable from shooter origin to projectile tip
        cv2.line(frame, (ox, oy), (px, py), (140, 140, 160), max(2, int(5 * s)), cv2.LINE_AA)
        cv2.line(frame, (ox, oy), (px, py), silk_silver, max(1, int(3 * s)), cv2.LINE_AA)
        cv2.line(frame, (ox, oy), (px, py), bright_white, max(1, int(1 * s)), cv2.LINE_AA)

        # 2. Secondary spiral trailing web fluid micro-strands & curved motion
        dist = math.hypot(px - ox, py - oy)
        if dist > 15:
            angle = math.atan2(py - oy, px - ox)
            steps = max(6, int(dist / 15))
            for strand_offset in [0, math.pi]:
                pts = []
                for step in range(steps + 1):
                    t = step / float(steps)
                    bx = ox + (px - ox) * t
                    by = oy + (py - oy) * t
                    amp = 7.0 * s * math.sin(t * math.pi)
                    phase_angle = t * math.pi * 6.0 + strand_offset
                    dx = -math.sin(angle) * amp * math.sin(phase_angle)
                    dy = math.cos(angle) * amp * math.sin(phase_angle)
                    pts.append((int(bx + dx), int(by + dy)))

                for i in range(len(pts) - 1):
                    cv2.line(frame, pts[i], pts[i + 1], bright_white, max(1, int(1 * s)), cv2.LINE_AA)

            # Motion trail particles along trajectory
            for p_idx in range(4):
                trail_t = max(0.0, 1.0 - (p_idx * 0.2))
                trx = int(ox + (px - ox) * trail_t)
                try_pt = int(oy + (py - oy) * trail_t)
                r_trail = max(1, int((3 - p_idx * 0.5) * s))
                cv2.circle(frame, (trx, try_pt), r_trail, cyan_glow, -1, cv2.LINE_AA)

        # 3. Flying web projectile tip (scales slightly during outward travel)
        r = max(3, int((6 + 6 * (1.0 - life_ratio)) * s))
        cv2.circle(frame, (px, py), r + int(4 * s), silk_silver, max(1, int(1 * s)), cv2.LINE_AA)
        cv2.circle(frame, (px, py), r, bright_white, -1, cv2.LINE_AA)

    elif phase == 'impact':
        # Dynamic radial web impact burst at target
        radius = max(15, int(45 * (1.0 - life_ratio) * s))
        spokes = 10
        spoke_pts = []
        for i in range(spokes):
            angle = 2 * math.pi * i / spokes
            ex = int(tx + math.cos(angle) * radius)
            ey = int(ty + math.sin(angle) * radius)
            spoke_pts.append((ex, ey))
            cv2.line(frame, (tx, ty), (ex, ey), bright_white, max(1, int(1 * s)), cv2.LINE_AA)

        # Connect spoke ends with web impact arcs
        for i in range(spokes):
            p1 = spoke_pts[i]
            p2 = spoke_pts[(i + 1) % spokes]
            cv2.line(frame, p1, p2, silk_silver, max(1, int(1 * s)), cv2.LINE_AA)

        # Center impact flash & splatter particles
        cv2.circle(frame, (tx, ty), max(2, radius), cyan_glow, max(1, int(1 * s)), cv2.LINE_AA)
        cv2.circle(frame, (tx, ty), max(2, int(8 * life_ratio * s)), bright_white, -1, cv2.LINE_AA)

        # Splatter particles
        for p_idx in range(6):
            p_angle = 2 * math.pi * p_idx / 6.0
            p_dist = radius * 1.2 * (1.0 - life_ratio)
            px_sp = int(tx + math.cos(p_angle) * p_dist)
            py_sp = int(ty + math.sin(p_angle) * p_dist)
            cv2.circle(frame, (px_sp, py_sp), max(1, int(2 * s)), bright_white, -1, cv2.LINE_AA)


def draw_web(
    frame,
    center,
    radius=120,
    alpha=1.0,
    palm_center=None,
    hold_time=1.0
):
    """
    Renders an ultra-clean, realistic, cinematic Spider-Man cobweb net effect.

    Visual Features:
    - Camera-distance independent scaling (scales proportionally with hand size)
    - High-contrast ambient shadow backdrop
    - Multi-strand elastic web fluid cable with spring recoil tension
    - Mechanical muzzle flash burst on shooter trigger
    - 12 radial spokes with smooth continuous rotation
    - 5 catenary cobweb rings with concave sagged arcs
    - Lattice intersection node dots
    - Floating web fluid droplets / motion splatters
    - Central web reticle core & expanding wavefront pulse rings
    """
    cx, cy = int(center[0]), int(center[1])
    alpha = max(0.0, min(1.0, alpha))
    ticks = cv2.getTickCount() / cv2.getTickFrequency()

    # ---------------------------------------------------------
    # 0. Camera-Distance Independence (Hand Scale Normalization)
    # ---------------------------------------------------------
    hand_scale = 1.0
    if palm_center is not None:
        px, py = int(palm_center[0]), int(palm_center[1])
        hand_dist = math.hypot(cx - px, cy - py)
        # Reference palm-to-fingertip distance is ~100px on standard webcam feed
        hand_scale = max(0.4, min(2.5, hand_dist / 100.0))

    current_base_radius = radius * hand_scale

    # Muzzle flash at shooter origin during trigger
    if palm_center is not None and hold_time < 0.25:
        draw_web_muzzle_flash(frame, palm_center, hold_time, hand_scale=hand_scale)

    # ---------------------------------------------------------
    # 1. Smooth Elastic Deployment Expansion & Recoil Tension
    # ---------------------------------------------------------
    deploy_t = min(1.0, max(0.0, hold_time * 8.0))
    # Recoil oscillation dampening to prevent harsh snapping
    recoil = 0.1 * math.sin(hold_time * 22.0) * math.exp(-hold_time * 3.5)
    deploy_scale = max(0.1, math.sin(deploy_t * math.pi / 2.0) + recoil)
    current_radius = max(20, int(current_base_radius * (0.3 + 0.7 * deploy_scale)))

    bright_white = (255, 255, 255)
    silk_silver = (215, 215, 230)
    shadow_dark = (12, 12, 18)
    cyan_glow = (255, 235, 200)

    # ---------------------------------------------------------
    # 2. Shadow Overlay for High-Contrast Visibility
    # ---------------------------------------------------------
    overlay = frame.copy()
    cv2.circle(overlay, (cx, cy), current_radius + int(15 * hand_scale), shadow_dark, -1)
    cv2.addWeighted(overlay, 0.28 * alpha * min(1.0, deploy_scale), frame, 1.0 - 0.28 * alpha * min(1.0, deploy_scale), 0, frame)

    # ---------------------------------------------------------
    # 3. Main Web Fluid Cable (Palm Shooter to Web Net)
    # ---------------------------------------------------------
    if palm_center is not None:
        px, py = int(palm_center[0]), int(palm_center[1])

        # Dynamic target point extending with deployment progress & elastic recoil
        target_x = int(px + (cx - px) * min(1.0, deploy_scale))
        target_y = int(py + (cy - py) * min(1.0, deploy_scale))

        # Braided main cable with scale-proportional thickness
        th_outer = max(2, int(5 * hand_scale))
        th_mid = max(1, int(3 * hand_scale))
        th_inner = max(1, int(1 * hand_scale))

        cv2.line(frame, (px, py), (target_x, target_y), (140, 140, 160), th_outer, cv2.LINE_AA)
        cv2.line(frame, (px, py), (target_x, target_y), silk_silver, th_mid, cv2.LINE_AA)
        cv2.line(frame, (px, py), (target_x, target_y), bright_white, th_inner, cv2.LINE_AA)

        # Wrapping spiral threads around main cable with elastic tension sag
        cable_dist = math.hypot(target_x - px, target_y - py)
        if cable_dist > 15:
            cable_angle = math.atan2(target_y - py, target_x - px)
            steps = max(8, int(cable_dist / 12))
            for strand_offset in [0, 2.094, 4.188]:
                pts = []
                for s in range(steps + 1):
                    t = s / float(steps)
                    bx = px + (target_x - px) * t
                    by = py + (target_y - py) * t
                    phase = ticks * 14.0 + t * math.pi * 6.0 + strand_offset
                    amp = (5.0 + 2.0 * math.sin(ticks * 8.0)) * hand_scale * math.sin(t * math.pi)
                    dx = -math.sin(cable_angle) * amp * math.sin(phase)
                    dy = math.cos(cable_angle) * amp * math.sin(phase)
                    pts.append((int(bx + dx), int(by + dy)))

                for i in range(len(pts) - 1):
                    cv2.line(frame, pts[i], pts[i + 1], bright_white, max(1, int(1 * hand_scale)), cv2.LINE_AA)

        # Web shooter nozzle ring at palm
        nozzle_r = max(4, int(10 * hand_scale))
        nozzle_inner = max(2, int(5 * hand_scale))
        cv2.circle(frame, (px, py), nozzle_r, silk_silver, max(1, int(2 * hand_scale)), cv2.LINE_AA)
        cv2.circle(frame, (px, py), nozzle_inner, bright_white, -1, cv2.LINE_AA)

    # ---------------------------------------------------------
    # 4. 12 Radial Web Spokes (Clean Cobweb Grid)
    # ---------------------------------------------------------
    spokes = 12
    spoke_angles = []
    rotation_offset = ticks * 0.4 # Slow, smooth web rotation

    for i in range(spokes):
        angle = (2 * math.pi * i / spokes - math.pi / 2) + rotation_offset
        spoke_angles.append(angle)
        end_x = int(cx + math.cos(angle) * current_radius)
        end_y = int(cy + math.sin(angle) * current_radius)

        # Dual-layer spoke lines (silver backdrop + bright core)
        cv2.line(frame, (cx, cy), (end_x, end_y), silk_silver, max(1, int(2 * hand_scale)), cv2.LINE_AA)
        cv2.line(frame, (cx, cy), (end_x, end_y), bright_white, max(1, int(1 * hand_scale)), cv2.LINE_AA)

    # ---------------------------------------------------------
    # 5. 5 Catenary Cobweb Rings (Curved Sagged Arcs)
    # ---------------------------------------------------------
    ring_count = 5
    for ring in range(1, ring_count + 1):
        r_dist = current_radius * (ring / float(ring_count))
        # Subtle wind wave motion along catenary sags
        wave = 0.02 * math.sin(ticks * 5.0 + ring * 0.7)
        sag_ratio = 0.84 + wave

        for i in range(spokes):
            a1 = spoke_angles[i]
            a2 = spoke_angles[(i + 1) % spokes]

            p1 = (int(cx + math.cos(a1) * r_dist), int(cy + math.sin(a1) * r_dist))
            p2 = (int(cx + math.cos(a2) * r_dist), int(cy + math.sin(a2) * r_dist))

            mid_a = (a1 + a2) / 2.0
            sag_d = r_dist * sag_ratio
            p_mid = (int(cx + math.cos(mid_a) * sag_d), int(cy + math.sin(mid_a) * sag_d))

            # Render smooth concave arc using 2 sub-segments
            cv2.line(frame, p1, p_mid, silk_silver, max(1, int(1 * hand_scale)), cv2.LINE_AA)
            cv2.line(frame, p_mid, p2, silk_silver, max(1, int(1 * hand_scale)), cv2.LINE_AA)
            cv2.line(frame, p1, p_mid, bright_white, max(1, int(1 * hand_scale)), cv2.LINE_AA)
            cv2.line(frame, p_mid, p2, bright_white, max(1, int(1 * hand_scale)), cv2.LINE_AA)

            # Node dot at lattice intersection
            node_r = max(1, int(2 * hand_scale))
            cv2.circle(frame, p1, node_r, bright_white, -1, cv2.LINE_AA)

    # ---------------------------------------------------------
    # 6. Floating Web Droplets / Micro-Splatters
    # ---------------------------------------------------------
    for p_idx in range(10):
        p_angle = (p_idx * 0.628) + (ticks * 0.5)
        p_dist = (current_radius * 0.2) + ((p_idx * 17.0 + ticks * 45.0) % (current_radius * 0.9))
        part_x = int(cx + math.cos(p_angle) * p_dist)
        part_y = int(cy + math.sin(p_angle) * p_dist)
        drop_r = max(1, int(2 * hand_scale))
        cv2.circle(frame, (part_x, part_y), drop_r, bright_white, -1, cv2.LINE_AA)

    # ---------------------------------------------------------
    # 7. Central Web Node Hub & Reticle Ticks
    # ---------------------------------------------------------
    hub_r_out = max(4, int(12 * hand_scale))
    hub_r_in = max(2, int(6 * hand_scale))
    cv2.circle(frame, (cx, cy), hub_r_out, silk_silver, max(1, int(2 * hand_scale)), cv2.LINE_AA)
    cv2.circle(frame, (cx, cy), hub_r_in, bright_white, -1, cv2.LINE_AA)

    tick_len = max(3, int(7 * hand_scale))
    offset = hub_r_out
    cv2.line(frame, (cx - offset - tick_len, cy), (cx - offset, cy), bright_white, max(1, int(2 * hand_scale)), cv2.LINE_AA)
    cv2.line(frame, (cx + offset, cy), (cx + offset + tick_len, cy), bright_white, max(1, int(2 * hand_scale)), cv2.LINE_AA)
    cv2.line(frame, (cx, cy - offset - tick_len), (cx, cy - offset), bright_white, max(1, int(2 * hand_scale)), cv2.LINE_AA)
    cv2.line(frame, (cx, cy + offset), (cx, cy + offset + tick_len), bright_white, max(1, int(2 * hand_scale)), cv2.LINE_AA)

    # ---------------------------------------------------------
    # 8. Dual Expanding Pulse Wavefront Rings
    # ---------------------------------------------------------
    pulse1 = int(current_radius * ((ticks * 2.0) % 1.0))
    pulse2 = int(current_radius * (((ticks * 2.0) + 0.5) % 1.0))

    cv2.circle(frame, (cx, cy), pulse1, bright_white, max(1, int(1 * hand_scale)), cv2.LINE_AA)
    cv2.circle(frame, (cx, cy), pulse2, silk_silver, max(1, int(1 * hand_scale)), cv2.LINE_AA)

    return frame




