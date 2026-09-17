// ============================================================
// Performance Monitor & Adaptive Quality Manager
// ============================================================

export class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.prevTime = performance.now();
        this.frameCount = 0;
        this.fpsHistory = [];
        this.maxParticles = 120;
    }

    tick() {
        const now = performance.now();
        const dt = (now - this.prevTime) / 1000;
        this.prevTime = now;

        if (dt > 0) {
            const currentFps = 1 / dt;
            this.fps = 0.9 * this.fps + 0.1 * currentFps;
        }

        // Adjust particle cap if FPS drops
        if (this.fps < 30) {
            this.maxParticles = 50;
        } else if (this.fps < 45) {
            this.maxParticles = 80;
        } else {
            this.maxParticles = 120;
        }

        return this.fps;
    }

    getFormattedFps() {
        return Math.round(this.fps);
    }
}
