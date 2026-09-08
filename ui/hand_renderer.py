import cv2
from core.utils import get_landmark_px

# ---------------------------------------------------------------------------
# Hand Connection Indices
# ---------------------------------------------------------------------------

HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),         # Thumb
    (0, 5), (5, 6), (6, 7), (7, 8),         # Index
    (5, 9), (9, 10), (10, 11), (11, 12),    # Middle
    (9, 13), (13, 14), (14, 15), (15, 16),  # Ring
    (13, 17), (17, 18), (18, 19), (19, 20), # Pinky
    (0, 17)                                  # Palm base
]


def draw_hand_skeleton(
    frame,
    landmarks,
    primary_color,
    secondary_color
):
    """Draws hand skeleton connections and keypoints."""

    h, w, _ = frame.shape

    pts = [
        get_landmark_px(lm, w, h)
        for lm in landmarks
    ]

    # Bone connections
    for p1_idx, p2_idx in HAND_CONNECTIONS:
        cv2.line(
            frame,
            pts[p1_idx],
            pts[p2_idx],
            primary_color,
            2,
            cv2.LINE_AA
        )

    # Joint dots
    for i, pt in enumerate(pts):

        # Fingertips
        if i in [4, 8, 12, 16, 20]:

            cv2.circle(
                frame,
                pt,
                6,
                secondary_color,
                -1,
                cv2.LINE_AA
            )

            cv2.circle(
                frame,
                pt,
                9,
                primary_color,
                1,
                cv2.LINE_AA
            )

        else:

            cv2.circle(
                frame,
                pt,
                3,
                (40, 40, 40),
                -1,
                cv2.LINE_AA
            )

            cv2.circle(
                frame,
                pt,
                3,
                primary_color,
                1,
                cv2.LINE_AA
            )
