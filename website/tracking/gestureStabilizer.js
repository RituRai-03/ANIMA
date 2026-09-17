// ============================================================
// Gesture Stabilizer & Debouncer (Prevents Flicker & Ghosting)
// ============================================================

export class GestureStabilizer {
    constructor(historySize = 5) {
        this.historySize = historySize;
        this.gestureHistory = [];
        this.activeGesture = "IDLE";
        this.holdTime = 0;
        this.cooldown = 0;
    }

    update(rawGesture, dt = 0.016) {
        this.gestureHistory.push(rawGesture);
        if (this.gestureHistory.length > this.historySize) {
            this.gestureHistory.shift();
        }

        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }

        // Count occurrences
        const counts = {};
        let maxCount = 0;
        let dominantGesture = rawGesture;

        for (const g of this.gestureHistory) {
            counts[g] = (counts[g] || 0) + 1;
            if (counts[g] > maxCount) {
                maxCount = counts[g];
                dominantGesture = g;
            }
        }

        // Require majority consensus to change active gesture
        if (maxCount >= Math.ceil(this.historySize / 2)) {
            if (this.activeGesture === dominantGesture) {
                this.holdTime += dt;
            } else {
                this.activeGesture = dominantGesture;
                this.holdTime = 0;
            }
        }

        return {
            gesture: this.activeGesture,
            holdTime: this.holdTime,
            isCoolingDown: this.cooldown > 0
        };
    }

    triggerCooldown(duration = 0.3) {
        this.cooldown = duration;
    }

    reset() {
        this.gestureHistory = [];
        this.activeGesture = "IDLE";
        this.holdTime = 0;
        this.cooldown = 0;
    }
}
