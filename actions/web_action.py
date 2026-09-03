import math


class WebAction:

    def __init__(self):
        self.active = False
        self.web_requested = False
        self.cooldown = 0
        self.hold_time = 0.0

    # ---------------------------------------------------------------
    # Distance Helper
    # ---------------------------------------------------------------

    def distance(self, p1, p2):
        return math.sqrt(
            (p1.x - p2.x) ** 2 +
            (p1.y - p2.y) ** 2 +
            (p1.z - p2.z) ** 2
        )

    # ---------------------------------------------------------------
    # Finger Extension Detection (Scale-Normalized)
    # ---------------------------------------------------------------

    def finger_extended(
        self,
        landmarks,
        tip_idx,
        pip_idx,
        mcp_idx,
        palm_size
    ):
        tip = landmarks[tip_idx]
        pip = landmarks[pip_idx]
        mcp = landmarks[mcp_idx]
        wrist = landmarks[0]

        tip_wrist = self.distance(tip, wrist)
        pip_wrist = self.distance(pip, wrist)
        tip_mcp = self.distance(tip, mcp)
        pip_mcp = self.distance(pip, mcp)

        return (
            tip_wrist > pip_wrist
            and tip_mcp > pip_mcp
            and tip_mcp > 0.45 * palm_size
        )

    # ---------------------------------------------------------------
    # Spider-Man Web Shooter Pose (Left & Right Hand Symmetric)
    # ---------------------------------------------------------------

    def is_web_pose(self, landmarks):
        wrist = landmarks[0]
        thumb_tip = landmarks[4]
        index_mcp = landmarks[5]
        middle_mcp = landmarks[9]
        middle_pip = landmarks[10]
        ring_pip = landmarks[14]
        pinky_mcp = landmarks[17]

        # Scale reference based on palm size
        palm_size = max(
            0.01,
            self.distance(wrist, middle_mcp)
        )

        index_extended = self.finger_extended(
            landmarks, 8, 6, 5, palm_size
        )

        middle_extended = self.finger_extended(
            landmarks, 12, 10, 9, palm_size
        )

        ring_extended = self.finger_extended(
            landmarks, 16, 14, 13, palm_size
        )

        pinky_extended = self.finger_extended(
            landmarks, 20, 18, 17, palm_size
        )

        # 1. Base finger configuration: Index & Pinky extended, Middle & Ring curled
        base_fingers = (
            index_extended
            and not middle_extended
            and not ring_extended
            and pinky_extended
        )

        if not base_fingers:
            return False

        # 2. Spider-Man Web Thumb requirement (Left & Right hand symmetric):
        # Thumb tip must be tightly folded inwards against palm center or middle/ring PIP
        palm_cx = (wrist.x + index_mcp.x + pinky_mcp.x) / 3.0
        palm_cy = (wrist.y + index_mcp.y + pinky_mcp.y) / 3.0
        
        dist_thumb_palm = math.hypot(thumb_tip.x - palm_cx, thumb_tip.y - palm_cy)
        dist_thumb_mid_pip = self.distance(thumb_tip, middle_pip)
        dist_thumb_ring_pip = self.distance(thumb_tip, ring_pip)

        thumb_folded_tight = (
            dist_thumb_palm < 0.38 * palm_size
            or dist_thumb_mid_pip < 0.38 * palm_size
            or dist_thumb_ring_pip < 0.38 * palm_size
        )

        return base_fingers and thumb_folded_tight

    # ---------------------------------------------------------------
    # Update
    # ---------------------------------------------------------------

    def update(
        self,
        landmarks,
        dt=1 / 60
    ):

        self.web_requested = False

        if self.cooldown > 0:
            self.cooldown -= 1

        web_pose = self.is_web_pose(
            landmarks
        )

        if web_pose:

            self.active = True

            self.hold_time += dt

            # Trigger once when the pose appears
            if (
                self.hold_time <= dt * 2
                and self.cooldown == 0
            ):

                self.web_requested = True

                self.cooldown = 15

        else:

            self.active = False
            self.hold_time = 0.0

        return {
            "active": self.active,
            "web_requested": self.web_requested,
            "cooldown": self.cooldown,
            "hold_time": self.hold_time
        }