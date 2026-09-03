import cv2
import math
import numpy as np


def draw_web(
    frame,
    center,
    radius=120,
    alpha=1.0,
    palm_center=None,
    hold_time=1.0
):
    """
    Renders a cinematic, realistic Spider-Man web shooter effect with dynamic motion.

    Motion & VFX:
    - Web deployment burst expansion (rapid elastic pop upon shooting)
    - Dynamic 16-spoke rotating cobweb net
    - Catenary wind-wave oscillation along web rings
    - High-speed spiral web fluid extrusion from palm shooter
    - Micro-splatters floating outwards from web center
    - Dual expanding shockwave wavefronts
    """
    x, y = center
    alpha = max(0.0, min(1.0, alpha))
    ticks = cv2.getTickCount() / cv2.getTickFrequency()

    # Cinematic deployment expansion curve (elastic pop from 20% to 100% size)
    deploy_progress = min(1.0, max(0.0, hold_time * 6.0))
    deploy_scale = math.sin(deploy_progress * math.pi / 2.0)
    current_radius = max(20, int(radius * (0.25 + 0.75 * deploy_scale)))

    web_color = (235, 235, 235)
    bright_color = (255, 255, 255)
    silver_color = (200, 200, 215)
    dark_shadow = (15, 15, 20)

    # ---------------------------------------------------------
    # 1. Ambient Shadow Overlay for Crisp Contrast
    # ---------------------------------------------------------
    overlay = frame.copy()
    cv2.circle(overlay, (x, y), current_radius + 15, dark_shadow, -1)
    cv2.circle(overlay, (x, y), current_radius + 30, (40, 40, 50), -1)
    cv2.addWeighted(overlay, 0.25 * alpha * deploy_scale, frame, 1.0 - 0.25 * alpha * deploy_scale, 0, frame)

    # ---------------------------------------------------------
    # 2. Multi-Strand High-Speed Web Fluid Beam (Palm to Target)
    # ---------------------------------------------------------
    if palm_center is not None:
        px, py = palm_center

        # Beam extending dynamically with deployment progress
        beam_target_x = int(px + (x - px) * deploy_scale)
        beam_target_y = int(py + (y - py) * deploy_scale)

        # Outer beam glow & core
        cv2.line(frame, (px, py), (beam_target_x, beam_target_y), (160, 160, 180), 5, cv2.LINE_AA)
        cv2.line(frame, (px, py), (beam_target_x, beam_target_y), web_color, 3, cv2.LINE_AA)
        cv2.line(frame, (px, py), (beam_target_x, beam_target_y), bright_color, 1, cv2.LINE_AA)

        # 3 High-Speed Spiral Fluid Micro-Strands
        dist = math.hypot(beam_target_x - px, beam_target_y - py)
        if dist > 10:
            beam_angle = math.atan2(beam_target_y - py, beam_target_x - px)
            steps = max(8, int(dist / 12))
            for strand_offset in [0, 2.094, 4.188]:
                pts = []
                for step in range(steps + 1):
                    t = step / float(steps)
                    bx = px + (beam_target_x - px) * t
                    by = py + (beam_target_y - py) * t
                    
                    phase = ticks * 16.0 + t * math.pi * 8.0 + strand_offset
                    amp = 7.0 * math.sin(t * math.pi)
                    disp_x = -math.sin(beam_angle) * amp * math.sin(phase)
                    disp_y = math.cos(beam_angle) * amp * math.sin(phase)
                    
                    pts.append((int(bx + disp_x), int(by + disp_y)))
                
                for idx in range(len(pts) - 1):
                    cv2.line(frame, pts[idx], pts[idx + 1], bright_color, 1, cv2.LINE_AA)

        # Palm Web-Shooter Burst Flash
        cv2.circle(frame, (px, py), 12, silver_color, 2, cv2.LINE_AA)
        cv2.circle(frame, (px, py), 6, bright_color, -1, cv2.LINE_AA)
        cv2.circle(frame, (px, py), 16, bright_color, 1, cv2.LINE_AA)

    # ---------------------------------------------------------
    # 3. Rotating 16 Radial Web Spokes
    # ---------------------------------------------------------
    spokes = 16
    spoke_pts = []
    rotation_offset = ticks * 0.7 # Smooth continuous web rotation

    for i in range(spokes):
        angle = (2 * math.pi * i / spokes - math.pi / 2) + rotation_offset
        end_x = int(x + math.cos(angle) * current_radius)
        end_y = int(y + math.sin(angle) * current_radius)
        spoke_pts.append((end_x, end_y))

        cv2.line(frame, (x, y), (end_x, end_y), silver_color, 2, cv2.LINE_AA)
        cv2.line(frame, (x, y), (end_x, end_y), bright_color, 1, cv2.LINE_AA)

    # ---------------------------------------------------------
    # 4. Oscillating Catenary Cobweb Net (Wind Wave Motion)
    # ---------------------------------------------------------
    ring_count = 6
    for ring in range(1, ring_count + 1):
        r_frac = ring / float(ring_count)
        r_dist = current_radius * r_frac

        # Catenary sag with dynamic wave motion
        wave = 0.03 * math.sin(ticks * 6.0 + ring * 0.8)
        sag_ratio = 0.82 + wave

        for i in range(spokes):
            a1 = (2 * math.pi * i / spokes - math.pi / 2) + rotation_offset
            a2 = (2 * math.pi * (i + 1) / spokes - math.pi / 2) + rotation_offset

            p1 = (int(x + math.cos(a1) * r_dist), int(y + math.sin(a1) * r_dist))
            p2 = (int(x + math.cos(a2) * r_dist), int(y + math.sin(a2) * r_dist))

            mid_a = (a1 + a2) / 2.0
            sag_d = r_dist * sag_ratio
            p_mid = (int(x + math.cos(mid_a) * sag_d), int(y + math.sin(mid_a) * sag_d))

            cv2.line(frame, p1, p_mid, silver_color, 1, cv2.LINE_AA)
            cv2.line(frame, p_mid, p2, silver_color, 1, cv2.LINE_AA)
            cv2.line(frame, p1, p_mid, bright_color, 1, cv2.LINE_AA)
            cv2.line(frame, p_mid, p2, bright_color, 1, cv2.LINE_AA)

            # Node dot at web lattice intersection
            cv2.circle(frame, p1, 2, bright_color, -1, cv2.LINE_AA)

    # ---------------------------------------------------------
    # 5. Web Micro-Splatters / Floating Thread Particles
    # ---------------------------------------------------------
    for p_idx in range(14):
        p_angle = (p_idx * 0.448) + (ticks * 0.6)
        p_dist = (current_radius * 0.15) + ((p_idx * 19.1 + ticks * 50.0) % (current_radius * 0.95))
        part_x = int(x + math.cos(p_angle) * p_dist)
        part_y = int(y + math.sin(p_angle) * p_dist)
        cv2.circle(frame, (part_x, part_y), 2, bright_color, -1, cv2.LINE_AA)

    # ---------------------------------------------------------
    # 6. Central Web Node Core & Reticle Ticks
    # ---------------------------------------------------------
    cv2.circle(frame, (x, y), 14, silver_color, 2, cv2.LINE_AA)
    cv2.circle(frame, (x, y), 8, bright_color, -1, cv2.LINE_AA)

    tick_len = 8
    cv2.line(frame, (x - 14 - tick_len, y), (x - 14, y), bright_color, 2, cv2.LINE_AA)
    cv2.line(frame, (x + 14, y), (x + 14 + tick_len, y), bright_color, 2, cv2.LINE_AA)
    cv2.line(frame, (x, y - 14 - tick_len), (x, y - 14), bright_color, 2, cv2.LINE_AA)
    cv2.line(frame, (x, y + 14), (x, y + 14 + tick_len), bright_color, 2, cv2.LINE_AA)

    # ---------------------------------------------------------
    # 7. Dual Expanding Web Pulse Wavefronts
    # ---------------------------------------------------------
    pulse1 = int(current_radius * ((ticks * 2.5) % 1.0))
    pulse2 = int(current_radius * (((ticks * 2.5) + 0.5) % 1.0))
    
    cv2.circle(frame, (x, y), pulse1, bright_color, 1, cv2.LINE_AA)
    cv2.circle(frame, (x, y), pulse2, silver_color, 1, cv2.LINE_AA)

    return frame

