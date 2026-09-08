class GestureStabilizer:
    """Stabilizes gesture labels by requiring a gesture to persist for a few frames."""

    def __init__(self, required_frames=3):
        self.required_frames = max(1, int(required_frames))
        self.current_gesture = "IDLE"
        self.candidate_gesture = None
        self.candidate_frames = 0

    def update(self, gesture):
        """Returns a stabilized gesture label."""
        if gesture == self.current_gesture:
            self.candidate_gesture = None
            self.candidate_frames = 0
            return self.current_gesture

        if gesture != self.candidate_gesture:
            self.candidate_gesture = gesture
            self.candidate_frames = 1
        else:
            self.candidate_frames += 1

        if self.candidate_frames >= self.required_frames:
            self.current_gesture = self.candidate_gesture
            self.candidate_gesture = None
            self.candidate_frames = 0

        return self.current_gesture

    def reset(self):
        """Resets the stabilizer to its default IDLE state."""
        self.current_gesture = "IDLE"
        self.candidate_gesture = None
        self.candidate_frames = 0