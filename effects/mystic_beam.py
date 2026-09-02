import cv2
import math


def calculate_2d_distance(pt1, pt2):
    """Calculate 2D distance between two pixel points."""
    return math.hypot(
        pt1[0] - pt2[0],
        pt1[1] - pt2[1]
    )


def draw_plasma_tether(img, palm_left, palm_right, angle, color):
    """Renders a glowing plasma beam and energy grid between two open palms."""

    COLOR_WHITE = (255, 255, 255)
    COLOR_CYAN = (255, 255, 0)
    COLOR_MAGENTA = (255, 0, 255)

    # Main plasma beam
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

    # Energy pulse nodes
    dist = calculate_2d_distance(palm_left, palm_right)
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

    # Cyber rings around both palms
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