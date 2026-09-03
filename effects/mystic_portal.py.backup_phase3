import cv2
import math
import numpy as np


def _point(cx, cy, radius, angle):
    rad = math.radians(angle)

    return (
        int(cx + radius * math.cos(rad)),
        int(cy + radius * math.sin(rad))
    )


def _draw_rune(canvas, center, size, angle, rune_id, color):
    """
    Draws procedural mystical symbols.
    These are original geometric runes.
    """

    cx, cy = center

    pts = []

    # Different geometric rune patterns
    if rune_id % 4 == 0:
        # Triangle rune
        for a in (0, 120, 240):
            pts.append(_point(cx, cy, size, angle + a))

        cv2.polylines(
            canvas,
            [np.array(pts, dtype=np.int32)],
            True,
            color,
            2,
            cv2.LINE_AA
        )

    elif rune_id % 4 == 1:
        # Diamond rune
        pts = [
            _point(cx, cy, size, angle),
            _point(cx, cy, size * 0.55, angle + 90),
            _point(cx, cy, size, angle + 180),
            _point(cx, cy, size * 0.55, angle + 270)
        ]

        cv2.polylines(
            canvas,
            [np.array(pts, dtype=np.int32)],
            True,
            color,
            2,
            cv2.LINE_AA
        )

    elif rune_id % 4 == 2:
        # Cross rune
        p1 = _point(cx, cy, size, angle)
        p2 = _point(cx, cy, size, angle + 180)

        p3 = _point(cx, cy, size * 0.65, angle + 90)
        p4 = _point(cx, cy, size * 0.65, angle + 270)

        cv2.line(canvas, p1, p2, color, 2, cv2.LINE_AA)
        cv2.line(canvas, p3, p4, color, 2, cv2.LINE_AA)

    else:
        # Hexagonal rune
        pts = [
            _point(cx, cy, size, angle + i * 60)
            for i in range(6)
        ]

        cv2.polylines(
            canvas,
            [np.array(pts, dtype=np.int32)],
            True,
            color,
            2,
            cv2.LINE_AA
        )


def draw_mystic_portal(frame, center, radius, rotation=0):

    cx, cy = center

    # ---------------------------------------------------------
    # GLOW / BLOOM LAYER
    # ---------------------------------------------------------

    glow = np.zeros_like(frame)

    cv2.circle(
        glow,
        (cx, cy),
        int(radius * 0.95),
        (0, 100, 255),
        8,
        cv2.LINE_AA
    )

    glow = cv2.GaussianBlur(glow, (31, 31), 0)

    frame[:] = cv2.addWeighted(
        frame,
        1.0,
        glow,
        0.35,
        0
    )

    # ---------------------------------------------------------
    # OUTER ENERGY RINGS
    # ---------------------------------------------------------

    cv2.circle(
        frame,
        (cx, cy),
        radius,
        (0, 180, 255),
        2,
        cv2.LINE_AA
    )

    cv2.circle(
        frame,
        (cx, cy),
        int(radius * 0.88),
        (0, 230, 255),
        2,
        cv2.LINE_AA
    )

    cv2.circle(
        frame,
        (cx, cy),
        int(radius * 0.70),
        (255, 140, 30),
        2,
        cv2.LINE_AA
    )

    # ---------------------------------------------------------
    # ROTATING ARC SEGMENTS
    # ---------------------------------------------------------

    for i in range(8):

        start_angle = rotation * 1.5 + i * 45

        cv2.ellipse(
            frame,
            (cx, cy),
            (radius, radius),
            0,
            start_angle,
            start_angle + 25,
            (0, 220, 255),
            3,
            cv2.LINE_AA
        )

    # Inner ring rotates opposite direction

    for i in range(6):

        start_angle = -rotation * 2 + i * 60

        cv2.ellipse(
            frame,
            (cx, cy),
            (int(radius * 0.70), int(radius * 0.70)),
            0,
            start_angle,
            start_angle + 35,
            (255, 150, 40),
            2,
            cv2.LINE_AA
        )

    # ---------------------------------------------------------
    # ROTATING RUNES
    # ---------------------------------------------------------

    rune_count = 12

    rune_radius = radius * 0.82

    for i in range(rune_count):

        angle = rotation * 0.8 + i * (360 / rune_count)

        rune_x, rune_y = _point(
            cx,
            cy,
            rune_radius,
            angle
        )

        rune_size = max(5, int(radius * 0.075))

        rune_layer = np.zeros_like(frame)

        _draw_rune(
            rune_layer,
            (rune_x, rune_y),
            rune_size,
            -rotation * 2 + i * 20,
            i,
            (255, 190, 70)
        )

        # Rune glow
        rune_glow = cv2.GaussianBlur(
            rune_layer,
            (11, 11),
            0
        )

        frame[:] = cv2.addWeighted(
            frame,
            1.0,
            rune_glow,
            0.7,
            0
        )

        frame[:] = cv2.addWeighted(
            frame,
            1.0,
            rune_layer,
            1.0,
            0
        )

    # ---------------------------------------------------------
    # ENERGY TICKS
    # ---------------------------------------------------------

    for i in range(24):

        angle = -rotation * 1.3 + i * 15

        inner = radius * 0.88
        outer = radius * 0.98

        p1 = _point(cx, cy, inner, angle)
        p2 = _point(cx, cy, outer, angle)

        cv2.line(
            frame,
            p1,
            p2,
            (0, 210, 255),
            2,
            cv2.LINE_AA
        )

    # ---------------------------------------------------------
    # INNER ENERGY CORE
    # ---------------------------------------------------------

    pulse = 1.0 + 0.12 * math.sin(math.radians(rotation * 5))

    core_radius = max(
        5,
        int(radius * 0.12 * pulse)
    )

    cv2.circle(
        frame,
        (cx, cy),
        core_radius + 12,
        (0, 150, 255),
        2,
        cv2.LINE_AA
    )

    cv2.circle(
        frame,
        (cx, cy),
        core_radius,
        (255, 255, 255),
        -1,
        cv2.LINE_AA
    )

    # ---------------------------------------------------------
    # ROTATING ENERGY SPARKS
    # ---------------------------------------------------------

    for i in range(10):

        angle = rotation * 3 + i * 36

        spark_radius = radius * 0.55

        sx, sy = _point(
            cx,
            cy,
            spark_radius,
            angle
        )

        spark_size = 2 + (i % 3)

        cv2.circle(
            frame,
            (sx, sy),
            spark_size,
            (0, 220, 255),
            -1,
            cv2.LINE_AA
        )

    return frame