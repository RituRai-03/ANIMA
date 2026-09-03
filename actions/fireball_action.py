import math

class FireballAction:
    def __init__(self):
        self.active = False
        self.charge = 0.0
        self.cooldown = 0
        self.fire_requested = False

    def reset(self):
        self.active = False
        self.charge = 0.0
        self.fire_requested = False

    def is_fire_cast_pose(self, landmarks):
        """
        Detects the Fireball pose.

        Gesture:
        - Thumb  -> Extended
        - Index  -> Extended
        - Middle -> Extended
        - Ring   -> Curled
        - Pinky  -> Curled

        This detector is intentionally separate from
        the existing gesture classifier.
        """

        # ---------------------------------------------------------
        # MediaPipe landmark indexes
        # ---------------------------------------------------------

        thumb_tip = landmarks[4]
        thumb_mcp = landmarks[2]

        index_tip = landmarks[8]
        index_pip = landmarks[6]

        middle_tip = landmarks[12]
        middle_pip = landmarks[10]

        ring_tip = landmarks[16]
        ring_pip = landmarks[14]

        pinky_tip = landmarks[20]
        pinky_pip = landmarks[18]

        # ---------------------------------------------------------
        # Thumb extended
        # ---------------------------------------------------------

        thumb_extended = (
            math.hypot(thumb_tip.x - thumb_mcp.x, thumb_tip.y - thumb_mcp.y) > 0.04
        )

        # ---------------------------------------------------------
        # Index extended
        # ---------------------------------------------------------

        index_extended = (
            index_tip.y < index_pip.y - 0.02
        )

        # ---------------------------------------------------------
        # Middle extended
        # ---------------------------------------------------------

        middle_extended = (
            middle_tip.y < middle_pip.y - 0.02
        )

        # ---------------------------------------------------------
        # Ring curled
        # ---------------------------------------------------------

        ring_curled = (
            ring_tip.y > ring_pip.y
        )

        # ---------------------------------------------------------
        # Pinky curled
        # ---------------------------------------------------------

        pinky_curled = (
            pinky_tip.y > pinky_pip.y
        )

        # ---------------------------------------------------------
        # Final Fireball pose
        # ---------------------------------------------------------

        return (
            thumb_extended
            and index_extended
            and middle_extended
            and ring_curled
            and pinky_curled
        )

    def update(self, landmarks, dt=1 / 60):
        """
        Updates Fireball action state.

        Hold the Fireball gesture:
            CHARGING → READY

        Release the gesture after reaching READY:
            FIREBALL is requested.
        """

        # Reset fire request every frame
        self.fire_requested = False

        # ---------------------------------------------------------
        # Cooldown
        # ---------------------------------------------------------

        if self.cooldown > 0:
            self.cooldown -= 1

        # ---------------------------------------------------------
        # Detect Fireball gesture
        # ---------------------------------------------------------

        fire_pose = self.is_fire_cast_pose(landmarks)

        # ---------------------------------------------------------
        # Charging
        # ---------------------------------------------------------

        if fire_pose:

            self.active = True

            self.charge = min(
                1.0,
                self.charge + dt * 1.5
            )

        # ---------------------------------------------------------
        # Gesture released
        # ---------------------------------------------------------

        else:

            # Fire only after completely charging
            if (
                self.active
                and self.charge >= 1.0
                and self.cooldown == 0
            ):
                self.fire_requested = True

                # Prevent immediate repeated firing
                self.cooldown = 30

            self.active = False

            # Slowly drain charge
            self.charge = max(
                0.0,
                self.charge - dt * 3.0
            )

        # ---------------------------------------------------------
        # Status
        # ---------------------------------------------------------

        if self.charge >= 1.0:
            status = "READY"

        elif self.charge > 0.05:
            status = "CHARGING"

        else:
            status = "IDLE"

        # ---------------------------------------------------------
        # Return state
        # ---------------------------------------------------------

        return {
            "active": self.active,
            "charge": self.charge,
            "cooldown": self.cooldown,
            "status": status,
            "fire_requested": self.fire_requested
        }