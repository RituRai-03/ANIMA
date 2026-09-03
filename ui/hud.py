import cv2


# ============================================================
# HUD COLORS
# ============================================================

COLOR_CYAN = (255, 255, 0)
COLOR_MAGENTA = (255, 0, 255)
COLOR_GREEN = (0, 255, 0)
COLOR_YELLOW = (0, 255, 255)
COLOR_WHITE = (255, 255, 255)
COLOR_DARK = (15, 15, 15)


# ============================================================
# TOP HEADER
# ============================================================

def draw_header(frame, fps):

    h, w = frame.shape[:2]

    # Dark transparent header
    overlay = frame.copy()

    cv2.rectangle(
        overlay,
        (0, 0),
        (w, 45),
        COLOR_DARK,
        -1
    )

    cv2.addWeighted(
        overlay,
        0.70,
        frame,
        0.30,
        0,
        frame
    )

    # Cyan separator
    cv2.line(
        frame,
        (0, 45),
        (w, 45),
        COLOR_CYAN,
        1,
        cv2.LINE_AA
    )

    # System title
    cv2.putText(
        frame,
        "SYSTEM: AR DUAL-HAND TRACKING ENGINE",
        (28, 29),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        COLOR_CYAN,
        2,
        cv2.LINE_AA
    )

    # FPS
    cv2.putText(
        frame,
        f"FPS: {fps:.1f}",
        (w - 130, 29),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        COLOR_GREEN,
        2,
        cv2.LINE_AA
    )


# ============================================================
# HAND INFORMATION PANEL
# ============================================================

def draw_hand_panel(
    frame,
    hands_count,
    max_hands,
    hand_info
):

    x1 = 23
    y1 = 90
    x2 = 303

    # Dynamic panel height
    panel_height = 90 + len(hand_info) * 52
    y2 = y1 + panel_height

    overlay = frame.copy()

    cv2.rectangle(
        overlay,
        (x1, y1),
        (x2, y2),
        COLOR_DARK,
        -1
    )

    cv2.addWeighted(
        overlay,
        0.70,
        frame,
        0.30,
        0,
        frame
    )

    # Panel border
    cv2.rectangle(
        frame,
        (x1, y1),
        (x2, y2),
        COLOR_CYAN,
        1
    )

    # Active hands
    cv2.putText(
        frame,
        f"ACTIVE HANDS: {hands_count} / {max_hands} DETECTED",
        (33, y1 + 25),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.48,
        COLOR_WHITE,
        1,
        cv2.LINE_AA
    )

    # Hand information
    y = y1 + 55

    for info in hand_info:

        label = info.get("label", "HAND")
        confidence = info.get("confidence", 0)
        gesture = info.get("gesture", "UNKNOWN")
        color = info.get("color", COLOR_CYAN)

        cv2.putText(
            frame,
            f"{label} ({confidence:.0f}%)",
            (33, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.48,
            color,
            1,
            cv2.LINE_AA
        )

        cv2.putText(
            frame,
            f"GESTURE: {gesture}",
            (43, y + 22),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.43,
            COLOR_WHITE,
            1,
            cv2.LINE_AA
        )

        y += 52


# ============================================================
# DUAL MODE
# ============================================================

def draw_dual_mode(frame, mode):

    if not mode:
        return

    h, w = frame.shape[:2]

    # Bottom-left position
    x = 33
    y = h - 75

    cv2.line(
        frame,
        (x, y - 17),
        (295, y - 17),
        COLOR_YELLOW,
        1,
        cv2.LINE_AA
    )

    cv2.putText(
        frame,
        f"DUAL MODE: {mode}",
        (x, y),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.50,
        COLOR_YELLOW,
        1,
        cv2.LINE_AA
    )


# ============================================================
# COMPLETE HUD
# ============================================================

def draw_hud(
    frame,
    fps,
    hands_count,
    max_hands,
    hand_info,
    dual_mode=""
):

    draw_header(
        frame,
        fps
    )

    draw_hand_panel(
        frame,
        hands_count,
        max_hands,
        hand_info
    )

    draw_dual_mode(
        frame,
        dual_mode
    )