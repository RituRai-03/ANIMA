from effects.mystic_beam import draw_plasma_tether


def execute_beam(frame, palm_left, palm_right, rotation_angle, color):
    """Execute the Plasma Tether visual effect."""

    draw_plasma_tether(
        frame,
        palm_left,
        palm_right,
        rotation_angle,
        color
    )