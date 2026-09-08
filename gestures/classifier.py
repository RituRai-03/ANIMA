import math


def calculate_distance(p1, p2):
    """Calculates Euclidean distance between two 3D landmarks."""
    return math.sqrt(
        (p1.x - p2.x) ** 2 +
        (p1.y - p2.y) ** 2 +
        (p1.z - p2.z) ** 2
    )


def is_finger_extended(
    landmarks,
    tip_idx,
    pip_idx,
    mcp_idx,
    wrist_idx=0
):
    """Determines whether a finger is extended relative to the wrist/MCP."""

    tip = landmarks[tip_idx]
    pip = landmarks[pip_idx]
    mcp = landmarks[mcp_idx]
    wrist = landmarks[wrist_idx]

    dist_tip_wrist = calculate_distance(tip, wrist)
    dist_pip_wrist = calculate_distance(pip, wrist)

    dist_tip_mcp = calculate_distance(tip, mcp)
    dist_pip_mcp = calculate_distance(pip, mcp)

    return (
        dist_tip_wrist > dist_pip_wrist
        and dist_tip_mcp > dist_pip_mcp
    )


def is_thumb_extended(landmarks):
    """Determines if the thumb is extended away from palm."""

    thumb_tip = landmarks[4]
    pinky_mcp = landmarks[17]
    index_mcp = landmarks[5]
    wrist = landmarks[0]

    dist_to_pinky = calculate_distance(
        thumb_tip,
        pinky_mcp
    )

    dist_to_idx = calculate_distance(
        thumb_tip,
        index_mcp
    )

    dist_to_wrist = calculate_distance(
        thumb_tip,
        wrist
    )

    return (
        dist_to_pinky > 0.23
        or (
            dist_to_idx > 0.14
            and dist_to_wrist > 0.20
        )
    )


def classify_hand_gesture(landmarks):
    """
    Classifies single-hand landmarks into gesture states:

    PINCH
    OPEN_PALM
    FIST
    POINT
    PEACE
    ROCK
    THUMBS_UP
    THUMBS_DOWN
    IDLE
    """

    thumb_tip = landmarks[4]
    index_tip = landmarks[8]

    # ---------------------------------------------------------------
    # Pinch distance check
    # ---------------------------------------------------------------

    pinch_dist = calculate_distance(
        thumb_tip,
        index_tip
    )

    if pinch_dist < 0.055:
        return "PINCH", pinch_dist

    # ---------------------------------------------------------------
    # Finger states
    # ---------------------------------------------------------------

    index_ext = is_finger_extended(
        landmarks, 8, 6, 5
    )

    middle_ext = is_finger_extended(
        landmarks, 12, 10, 9
    )

    ring_ext = is_finger_extended(
        landmarks, 16, 14, 13
    )

    pinky_ext = is_finger_extended(
        landmarks, 20, 18, 17
    )

    thumb_ext = is_thumb_extended(landmarks)

    ext_count = sum([
        index_ext,
        middle_ext,
        ring_ext,
        pinky_ext
    ])

    # ---------------------------------------------------------------
    # Open Palm
    # ---------------------------------------------------------------

    if ext_count >= 4 and thumb_ext:
        return "OPEN_PALM", pinch_dist

    if ext_count == 4:
        return "OPEN_PALM", pinch_dist

    # ---------------------------------------------------------------
    # Fist
    # ---------------------------------------------------------------

    if ext_count == 0 and not thumb_ext:
        return "FIST", pinch_dist

    # ---------------------------------------------------------------
    # Point
    # ---------------------------------------------------------------

    if (
        index_ext
        and not middle_ext
        and not ring_ext
        and not pinky_ext
    ):
        return "POINT", pinch_dist

    # ---------------------------------------------------------------
    # Peace / Victory
    # ---------------------------------------------------------------

    if (
        index_ext
        and middle_ext
        and not ring_ext
        and not pinky_ext
    ):
        return "PEACE", pinch_dist

    # ---------------------------------------------------------------
    # Rock / Metal
    # ---------------------------------------------------------------

    if (
        index_ext
        and pinky_ext
        and not middle_ext
        and not ring_ext
    ):
        return "ROCK", pinch_dist

    # ---------------------------------------------------------------
    # Thumbs Up / Down
    # ---------------------------------------------------------------

    if ext_count == 0 and thumb_ext:

        thumb_mcp = landmarks[2]

        if thumb_tip.y < thumb_mcp.y - 0.04:
            return "THUMBS_UP", pinch_dist

        elif thumb_tip.y > thumb_mcp.y + 0.04:
            return "THUMBS_DOWN", pinch_dist

    return "IDLE", pinch_dist
