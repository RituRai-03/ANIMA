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
        (w, 50),
        COLOR_DARK,
        -1
    )

    cv2.addWeighted(
        overlay,
        0.78,
        frame,
        0.22,
        0,
        frame
    )

    # Top cyan accent line
    cv2.line(
        frame,
        (0, 49),
        (w, 49),
        COLOR_CYAN,
        2,
        cv2.LINE_AA
    )

    # System status indicator
    cv2.circle(
        frame,
        (18, 24),
        5,
        COLOR_GREEN,
        -1,
        cv2.LINE_AA
    )

    # System title
    cv2.putText(
        frame,
        "AR DUAL-HAND TRACKING ENGINE",
        (32, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.60,
        COLOR_CYAN,
        2,
        cv2.LINE_AA
    )

    # FPS separator
    cv2.line(
        frame,
        (w - 105, 12),
        (w - 105, 38),
        COLOR_CYAN,
        1,
        cv2.LINE_AA
    )

    # FPS
    cv2.putText(
        frame,
        f"{fps:.1f} FPS",
        (w - 92, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.50,
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
    x2 = 315

    # Compact panel when no hands are detected
    if not hand_info:
        panel_height = 70
    else:
        panel_height = 82 + len(hand_info) * 55

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
        0.72,
        frame,
        0.28,
        0,
        frame
    )

    # Panel border
    cv2.rectangle(
        frame,
        (x1, y1),
        (x2, y2),
        COLOR_CYAN,
        1,
        cv2.LINE_AA
    )

    # Header line
    cv2.line(
        frame,
        (x1, y1 + 35),
        (x2, y1 + 35),
        COLOR_CYAN,
        1,
        cv2.LINE_AA
    )

    # Active hands
    cv2.putText(
        frame,
        f"HANDS  {hands_count} / {max_hands}",
        (x1 + 12, y1 + 24),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.50,
        COLOR_WHITE,
        1,
        cv2.LINE_AA
    )

    # No hand detected
    if not hand_info:

        cv2.circle(
            frame,
            (x1 + 18, y1 + 53),
            4,
            COLOR_YELLOW,
            -1,
            cv2.LINE_AA
        )

        cv2.putText(
            frame,
            "WAITING FOR HAND...",
            (x1 + 30, y1 + 57),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.43,
            COLOR_YELLOW,
            1,
            cv2.LINE_AA
        )

        return

    # Hand information
    y = y1 + 60

    for info in hand_info:

        label = info.get("label", "HAND")
        confidence = info.get("confidence", 0)
        gesture = info.get("gesture", "UNKNOWN")
        color = info.get("color", COLOR_CYAN)

        # Hand indicator
        cv2.circle(
            frame,
            (x1 + 16, y - 5),
            4,
            color,
            -1,
            cv2.LINE_AA
        )

        # Hand + confidence
        cv2.putText(
            frame,
            f"{label}  {confidence:.0f}%",
            (x1 + 28, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.46,
            color,
            1,
            cv2.LINE_AA
        )

        # Gesture
        cv2.putText(
            frame,
            f"GESTURE  {gesture}",
            (x1 + 28, y + 22),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.42,
            COLOR_WHITE,
            1,
            cv2.LINE_AA
        )

        y += 55

# ============================================================
# DUAL MODE
# ============================================================

def draw_dual_mode(frame, mode):

    if not mode:
        return

    h, w = frame.shape[:2]

    # Bottom-left position
    x = 23
    y = h - 58

    # Mode label
    label = f"DUAL MODE  //  {mode}"

    # Measure text for a dynamic panel
    (text_w, text_h), _ = cv2.getTextSize(
        label,
        cv2.FONT_HERSHEY_SIMPLEX,
        0.50,
        1
    )

    panel_x1 = x
    panel_y1 = y - 30
    panel_x2 = x + text_w + 30
    panel_y2 = y + 12

    # Transparent background
    overlay = frame.copy()

    cv2.rectangle(
        overlay,
        (panel_x1, panel_y1),
        (panel_x2, panel_y2),
        COLOR_DARK,
        -1
    )

    cv2.addWeighted(
        overlay,
        0.78,
        frame,
        0.22,
        0,
        frame
    )

    # Border
    cv2.rectangle(
        frame,
        (panel_x1, panel_y1),
        (panel_x2, panel_y2),
        COLOR_YELLOW,
        1,
        cv2.LINE_AA
    )

    # Active indicator
    cv2.circle(
        frame,
        (x + 12, y - 9),
        4,
        COLOR_YELLOW,
        -1,
        cv2.LINE_AA
    )

    # Mode text
    cv2.putText(
        frame,
        label,
        (x + 23, y - 4),
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