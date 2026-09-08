import cv2
import math
import random

from core.utils import calculate_2d_distance
from effects.particles import emit_particles

# ---------------------------------------------------------------------------
# Color Constants
# ---------------------------------------------------------------------------
COLOR_WHITE = (255, 255, 255)


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
