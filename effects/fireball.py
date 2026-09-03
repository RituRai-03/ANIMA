import cv2
import math
import random
import numpy as np

def draw_fireball(frame, center, size=35, angle=0):
    x, y = center
    size = max(5, int(size))

    #Outer glow
    for r in range(size + 25, size, -5):
        alpha = (size + 25 - r) / 25

        overlay = frame.copy()

        cv2.circle(
            overlay, (x,y), r, (0, 80, 255), -1,
            cv2.LINE_AA
        )

        frame[:] = cv2.addWeighted(
            overlay, 0.08*alpha, frame, 1 - 0.08*alpha, 0
        )

    #Inner glow
    for r in range(size, 0, -5):
        alpha = (size - r)/size
        overlay = frame.copy()

        cv2.circle(
            overlay, (x,y), r, (0, 150, 255), -1,
            cv2.LINE_AA
        )
        frame[:] = cv2.addWeighted(
            overlay, 0.1*alpha, frame, 1 - 0.1*alpha, 0
        )

    #Fireball body
    cv2.circle(
        frame, (x,y), size, (0, 80, 255), -1,
        cv2.LINE_AA
    )

    #Rotating flames

    for i in range(12):
        a = math.radians(angle + i * 30)

        distance = size + random.randint(2, 5)

        px = int(x + distance * math.cos(a))
        py = int(y + distance * math.sin(a))

        particle_size = random.randint(2, 5)

        cv2.circle(
            frame, (px, py), particle_size, (0, 150, 255), -1,
            cv2.LINE_AA
        )
    return frame



