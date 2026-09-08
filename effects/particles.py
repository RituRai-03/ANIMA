import cv2
import random

# ---------------------------------------------------------------------------
# Particle System State
# ---------------------------------------------------------------------------

particles = []


# ---------------------------------------------------------------------------
# Particle System Functions
# ---------------------------------------------------------------------------

def update_and_draw_particles(frame):
    """Updates fingertip trailing particle system."""

    global particles

    new_particles = []

    for p in particles:

        x, y, vx, vy, life, color = p

        x += vx
        y += vy
        life -= 0.05

        if life > 0:

            radius = max(
                1,
                int(life * 5)
            )

            cv2.circle(
                frame,
                (int(x), int(y)),
                radius,
                color,
                -1,
                cv2.LINE_AA
            )

            new_particles.append([
                x,
                y,
                vx,
                vy,
                life,
                color
            ])

    particles = new_particles


def emit_particles(
    px,
    py,
    color,
    count=3
):
    """Emits floating particle burst."""

    global particles

    for _ in range(count):

        vx = random.uniform(
            -2.0,
            2.0
        )

        vy = random.uniform(
            -2.0,
            2.0
        )

        life = random.uniform(
            0.5,
            1.0
        )

        particles.append([
            px,
            py,
            vx,
            vy,
            life,
            color
        ])
