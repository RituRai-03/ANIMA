import math


def calculate_distance(p1, p2):
    """Calculates Euclidean distance between two 3D landmarks."""
    return math.sqrt(
        (p1.x - p2.x) ** 2 +
        (p1.y - p2.y) ** 2 +
        (p1.z - p2.z) ** 2
    )


def calculate_2d_distance(pt1, pt2):
    """Calculates 2D Euclidean distance between pixel points."""
    return math.hypot(
        pt1[0] - pt2[0],
        pt1[1] - pt2[1]
    )


def get_landmark_px(lm, w, h):
    """Converts normalized landmark to integer pixel tuple."""
    return (
        int(lm.x * w),
        int(lm.y * h)
    )


def get_palm_center_px(landmarks, w, h):
    """Computes approximate palm center pixel coordinate."""
    wrist = landmarks[0]
    idx_mcp = landmarks[5]
    pinky_mcp = landmarks[17]

    cx = int(
        (wrist.x + idx_mcp.x + pinky_mcp.x)
        / 3.0 * w
    )

    cy = int(
        (wrist.y + idx_mcp.y + pinky_mcp.y)
        / 3.0 * h
    )

    return (cx, cy)
