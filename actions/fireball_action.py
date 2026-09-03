import math


class FireballAction:
    def __init__(self, confirm_frames=6, release_frames=3):
        self.active = False
        self.charge = 0.0
        self.cooldown = 0
        self.fire_requested = False

        # Temporal debouncing & stabilization state
        self.fire_pose_frames = 0
        self.release_frames = 0
        self.FIRE_CONFIRM_FRAMES = confirm_frames
        self.RELEASE_CONFIRM_FRAMES = release_frames

    def reset(self):
        self.active = False
        self.charge = 0.0
        self.fire_requested = False
        self.fire_pose_frames = 0
        self.release_frames = 0

    def is_fire_cast_pose(self, landmarks):
        """
        Fireball gesture:

        Thumb  -> extended sideways/outward away from palm & index finger
        Index  -> extended
        Middle -> extended
        Ring   -> curled
        Pinky  -> curled

        Kept separate from the main gesture classifier.
        Uses scale-normalized geometry relative to palm size.
        """
        wrist = landmarks[0]
        thumb_mcp = landmarks[2]
        thumb_tip = landmarks[4]

        index_mcp = landmarks[5]
        index_pip = landmarks[6]
        index_tip = landmarks[8]

        middle_mcp = landmarks[9]
        middle_pip = landmarks[10]
        middle_tip = landmarks[12]

        ring_pip = landmarks[14]
        ring_tip = landmarks[16]

        pinky_mcp = landmarks[17]
        pinky_pip = landmarks[18]
        pinky_tip = landmarks[20]

        # Reference scale based on palm size (wrist to middle MCP distance)
        palm_size = max(0.01, math.hypot(middle_mcp.x - wrist.x, middle_mcp.y - wrist.y))

        # Palm center coordinates
        palm_cx = (wrist.x + index_mcp.x + pinky_mcp.x) / 3.0
        palm_cy = (wrist.y + index_mcp.y + pinky_mcp.y) / 3.0

        # ---------------------------------------------------------
        # INDEX + MIDDLE MUST BE EXTENDED
        # ---------------------------------------------------------
        index_extended = index_tip.y < index_pip.y - 0.015
        middle_extended = middle_tip.y < middle_pip.y - 0.015

        # ---------------------------------------------------------
        # RING + PINKY MUST BE CURLED
        # ---------------------------------------------------------
        ring_curled = ring_tip.y > ring_pip.y
        pinky_curled = pinky_tip.y > pinky_pip.y

        # ---------------------------------------------------------
        # THUMB GEOMETRY: MUST BE CLEARLY EXTENDED & SEPARATED
        # ---------------------------------------------------------
        # 1. Thumb length extension relative to thumb MCP
        thumb_length = math.hypot(thumb_tip.x - thumb_mcp.x, thumb_tip.y - thumb_mcp.y)
        thumb_extended_len = (thumb_length > 0.45 * palm_size) and (thumb_length > 0.07)

        # 2. Separation between thumb tip and index MCP joint
        thumb_index_mcp_dist = math.hypot(thumb_tip.x - index_mcp.x, thumb_tip.y - index_mcp.y)
        thumb_index_mcp_sep = (thumb_index_mcp_dist > 0.45 * palm_size) and (thumb_index_mcp_dist > 0.075)

        # 3. Separation between thumb tip and index tip
        thumb_index_tip_dist = math.hypot(thumb_tip.x - index_tip.x, thumb_tip.y - index_tip.y)
        thumb_index_tip_sep = (thumb_index_tip_dist > 0.45 * palm_size) and (thumb_index_tip_dist > 0.08)

        # 4. Separation between thumb tip and palm center
        thumb_palm_dist = math.hypot(thumb_tip.x - palm_cx, thumb_tip.y - palm_cy)
        thumb_palm_sep = (thumb_palm_dist > 0.55 * palm_size) and (thumb_palm_dist > 0.09)

        # ---------------------------------------------------------
        # FINAL FIREBALL POSE CONFIRMATION
        # ---------------------------------------------------------
        return (
            index_extended
            and middle_extended
            and ring_curled
            and pinky_curled
            and thumb_extended_len
            and thumb_index_mcp_sep
            and thumb_index_tip_sep
            and thumb_palm_sep
        )

    def update(self, landmarks, dt=1 / 60):
        self.fire_requested = False

        # ---------------------------------------------------------
        # COOLDOWN
        # ---------------------------------------------------------
        if self.cooldown > 0:
            self.cooldown -= 1

        # ---------------------------------------------------------
        # DETECT FIREBALL POSE CANDIDATE
        # ---------------------------------------------------------
        fire_pose = self.is_fire_cast_pose(landmarks)

        # ---------------------------------------------------------
        # TEMPORAL DEBOUNCING & CHARGING LOGIC
        # ---------------------------------------------------------
        if fire_pose:
            # Reset release counter since pose is detected
            self.release_frames = 0
            self.fire_pose_frames += 1

            # Require consecutive confirmed frames before activating charging
            if self.fire_pose_frames >= self.FIRE_CONFIRM_FRAMES or self.active:
                self.active = True
                self.charge = min(1.0, self.charge + dt * 1.5)
        else:
            # Reset activation counter since pose candidate is absent
            self.fire_pose_frames = 0

            if self.active:
                self.release_frames += 1
                # Require consecutive absent frames before confirming release
                if self.release_frames >= self.RELEASE_CONFIRM_FRAMES:
                    if self.charge >= 1.0 and self.cooldown == 0:
                        self.fire_requested = True
                        self.cooldown = 30

                    self.active = False
                    self.charge = max(0.0, self.charge - dt * 3.0)
                    self.release_frames = 0
            else:
                self.charge = max(0.0, self.charge - dt * 3.0)
                self.release_frames = 0

        # ---------------------------------------------------------
        # STATUS DETERMINATION
        # ---------------------------------------------------------
        if self.charge >= 1.0 and self.active:
            status = "READY"
        elif self.active:
            status = "CHARGING"
        else:
            status = "IDLE"

        return {
            "active": self.active,
            "charge": self.charge,
            "cooldown": self.cooldown,
            "status": status,
            "fire_requested": self.fire_requested
        }