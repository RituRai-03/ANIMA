// ============================================================
// WORLD 04 — MUSIC AUDIO-VISUAL CONTROLLER
// ============================================================

import { CameraManager, CAMERA_STATES } from "../core/camera.js";
import { CanvasManager } from "../core/canvas.js";
import { PerformanceMonitor } from "../core/performance.js";
import { globalAudio } from "../core/audio.js";
import { HandTracker } from "../tracking/handTracker.js";
import { classifyHandGesture, getLandmarkPx } from "../tracking/gestureDetector.js";
import { GestureStabilizer } from "../tracking/gestureStabilizer.js";
import { ParticleSystem } from "../effects/particles.js";
import { drawHandSkeleton } from "../effects/geometric.js";

export class MusicWorld {
    constructor() {
        this.video = document.getElementById("camera");
        this.canvas = document.getElementById("ar-canvas");
        this.messageEl = document.getElementById("camera-message");
        this.startBtn = document.getElementById("start-camera");
        this.trackingStatus = document.getElementById("tracking-status");
        this.fpsCounter = document.getElementById("fps-counter");

        this.muteBtn = document.getElementById("mute-btn");
        this.volumeSlider = document.getElementById("volume-slider");

        this.cameraManager = new CameraManager(this.video, this.messageEl, this.trackingStatus);
        this.canvasManager = new CanvasManager(this.canvas, this.video);
        this.perfMonitor = new PerformanceMonitor();
        this.tracker = new HandTracker();
        this.particleSystem = new ParticleSystem();
        this.stabilizers = [new GestureStabilizer(3), new GestureStabilizer(3)];

        this.pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
        this.wavePhase = 0;
        this.lastTriggerTime = 0;
        this.trackingLostTimer = 0;
        this.isRunning = false;
    }

    async start() {
        if (this.startBtn) {
            this.startBtn.addEventListener("click", () => {
                globalAudio.init();
                this.init();
            });
        }

        if (this.muteBtn) {
            this.muteBtn.addEventListener("click", () => {
                const muted = globalAudio.toggleMute();
                this.muteBtn.textContent = muted ? "UNMUTE" : "MUTE";
            });
        }

        if (this.volumeSlider) {
            this.volumeSlider.addEventListener("input", (e) => {
                globalAudio.setVolume(parseFloat(e.target.value));
            });
        }
    }

    async init() {
        const camOk = await this.cameraManager.start();
        if (!camOk) return;

        const trackOk = await this.tracker.init((statusText) => {
            this.cameraManager.updateStatus(statusText);
        });

        if (trackOk) {
            this.isRunning = true;
            this.loop();
        }
    }

    drawTonalGrid(ctx, w, h) {
        ctx.save();
        const cols = 8;
        const colWidth = w / cols;

        for (let i = 0; i < cols; i++) {
            const x = i * colWidth;
            ctx.strokeStyle = "rgba(120, 169, 214, 0.15)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();

            ctx.font = "10px system-ui, sans-serif";
            ctx.fillStyle = "rgba(120, 169, 214, 0.4)";
            ctx.fillText(`NOTE ${i + 1}`, x + 10, 25);
        }
        ctx.restore();
    }

    drawAudioVisualizer(ctx, w, h, activeFreq = 440) {
        ctx.save();
        this.wavePhase += 0.05;

        ctx.beginPath();
        for (let x = 0; x < w; x += 5) {
            const y = h / 2 + Math.sin(x * 0.02 + this.wavePhase) * (activeFreq * 0.1);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "#3B82C4";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#78A9D6";
        ctx.shadowBlur = 12;
        ctx.stroke();

        ctx.restore();
    }

    loop() {
        if (!this.isRunning) return;

        const fps = this.perfMonitor.tick();
        if (this.fpsCounter) {
            this.fpsCounter.textContent = `${this.perfMonitor.getFormattedFps()} FPS`;
        }

        this.canvasManager.clear();
        const ctx = this.canvasManager.ctx;
        const w = this.canvasManager.width;
        const h = this.canvasManager.height;

        this.drawTonalGrid(ctx, w, h);

        const results = this.tracker.detect(this.video);
        let activeFreq = 440;
        let activeNoteName = "";

        if (results && results.landmarks && results.landmarks.length > 0) {
            this.trackingLostTimer = 0;
            const numDetected = results.landmarks.length;

            for (let i = 0; i < numDetected; i++) {
                const landmarks = results.landmarks[i];
                const handednessCat = results.handedness && results.handedness[i] ? results.handedness[i][0] : null;
                const rawLabel = handednessCat ? handednessCat.category_name : (i === 0 ? "Right" : "Left");
                const label = rawLabel === "Left" ? "Right" : "Left";

                const primaryColor = label === "Left" ? "#00f0ff" : "#ff00a0";
                const secondaryColor = label === "Left" ? "#00ff66" : "#ffee00";

                drawHandSkeleton(ctx, landmarks, primaryColor, secondaryColor, w, h);

                const rawG = classifyHandGesture(landmarks);
                const stab = (this.stabilizers[i] || new GestureStabilizer(3)).update(rawG.gesture);

                const indexTip = getLandmarkPx(landmarks[8], w, h);
                const colIdx = Math.max(0, Math.min(7, Math.floor((indexTip.x / w) * 8)));
                activeFreq = this.pentatonicScale[colIdx];
                activeNoteName = `NOTE ${colIdx + 1} (${Math.round(activeFreq)} Hz)`;

                const colWidth = w / 8;
                ctx.save();
                ctx.fillStyle = "rgba(59, 130, 196, 0.12)";
                ctx.fillRect(colIdx * colWidth, 0, colWidth, h);
                ctx.restore();

                if ((stab.gesture === "PINCH" || stab.gesture === "POINT") && performance.now() - this.lastTriggerTime > 140) {
                    globalAudio.playNote(activeFreq, stab.gesture === "PINCH" ? "sawtooth" : "sine", 0.35);
                    this.particleSystem.emit(indexTip.x, indexTip.y, primaryColor, 10, 2.0);
                    this.lastTriggerTime = performance.now();
                }

                if (stab.gesture === "OPEN_PALM" && performance.now() - this.lastTriggerTime > 250) {
                    globalAudio.playNote(activeFreq * 0.75, "triangle", 0.6);
                    globalAudio.playNote(activeFreq * 1.25, "sine", 0.6);
                    this.particleSystem.addShockwave(indexTip.x, indexTip.y, secondaryColor, 100);
                    this.lastTriggerTime = performance.now();
                }
            }

            this.cameraManager.updateStatus(CAMERA_STATES.TRACKING, activeNoteName);
        } else {
            this.trackingLostTimer += 0.016;
            if (this.trackingLostTimer > 0.2) {
                this.cameraManager.updateStatus(CAMERA_STATES.TRACKING_LOST);
            }
            this.stabilizers.forEach(s => s.reset());
        }

        this.drawAudioVisualizer(ctx, w, h, activeFreq);
        this.particleSystem.updateAndDraw(ctx, 0.016, this.perfMonitor.maxParticles);
        requestAnimationFrame(() => this.loop());
    }
}
