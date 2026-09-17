// ============================================================
// WORLD 01 — GEOMETRIC SHAPES CONTROLLER
// ============================================================

import { CameraManager, CAMERA_STATES } from "../core/camera.js";
import { CanvasManager } from "../core/canvas.js";
import { PerformanceMonitor } from "../core/performance.js";
import { HandTracker } from "../tracking/handTracker.js";
import { classifyHandGesture, getLandmarkPx, getPalmCenterPx } from "../tracking/gestureDetector.js";
import { GestureStabilizer } from "../tracking/gestureStabilizer.js";
import { ParticleSystem } from "../effects/particles.js";
import {
    drawHandSkeleton,
    draw3DCube,
    drawCyberShield,
    drawEnergyCore,
    drawPyramidAndLaser,
    draw3DStar,
    drawElectricArcs,
    drawStatusBadge,
    drawDualPinchCage
} from "../effects/geometric.js";
import { drawPlasmaBeam } from "../effects/energy.js";

export class GeometricWorld {
    constructor() {
        this.video = document.getElementById("camera");
        this.canvas = document.getElementById("ar-canvas");
        this.messageEl = document.getElementById("camera-message");
        this.startBtn = document.getElementById("start-camera");
        this.trackingStatus = document.getElementById("tracking-status");
        this.fpsCounter = document.getElementById("fps-counter");

        this.cameraManager = new CameraManager(this.video, this.messageEl, this.trackingStatus);
        this.canvasManager = new CanvasManager(this.canvas, this.video);
        this.perfMonitor = new PerformanceMonitor();
        this.tracker = new HandTracker();
        this.particleSystem = new ParticleSystem();

        this.stabilizers = [new GestureStabilizer(5), new GestureStabilizer(5)];
        this.rotationAngle = 0;
        this.trackingLostTimer = 0;
        this.isRunning = false;
    }

    async start() {
        if (this.startBtn) {
            this.startBtn.addEventListener("click", () => this.init());
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

        this.rotationAngle = (this.rotationAngle + 3) % 360;

        const results = this.tracker.detect(this.video);
        const handDataList = [];
        let dualModeStr = "";

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

                const rawGestureData = classifyHandGesture(landmarks);
                const stabilizer = this.stabilizers[i] || new GestureStabilizer(5);
                const stabResult = stabilizer.update(rawGestureData.gesture);

                const palmPx = getPalmCenterPx(landmarks, w, h);
                const indexTipPx = getLandmarkPx(landmarks[8], w, h);
                const thumbTipPx = getLandmarkPx(landmarks[4], w, h);
                const pinkyTipPx = getLandmarkPx(landmarks[20], w, h);

                this.particleSystem.emit(indexTipPx.x, indexTipPx.y, secondaryColor, 1);

                handDataList.push({
                    index: i,
                    label: label,
                    gesture: stabResult.gesture,
                    landmarks: landmarks,
                    palmPx: palmPx,
                    indexTipPx: indexTipPx,
                    thumbTipPx: thumbTipPx,
                    pinkyTipPx: pinkyTipPx,
                    pinchDist: rawGestureData.pinchDist,
                    color: primaryColor
                });
            }

            if (handDataList.length === 2) {
                const h1 = handDataList[0];
                const h2 = handDataList[1];

                if (h1.gesture === "PINCH" && h2.gesture === "PINCH") {
                    dualModeStr = "DUAL PINCH CAGE";
                    const mid1 = { x: (h1.indexTipPx.x + h1.thumbTipPx.x) / 2, y: (h1.indexTipPx.y + h1.thumbTipPx.y) / 2 };
                    const mid2 = { x: (h2.indexTipPx.x + h2.thumbTipPx.x) / 2, y: (h2.indexTipPx.y + h2.thumbTipPx.y) / 2 };
                    drawDualPinchCage(ctx, mid1, mid2, this.rotationAngle, "#00ff66");
                } else if (h1.gesture === "OPEN_PALM" && h2.gesture === "OPEN_PALM") {
                    dualModeStr = "PLASMA TETHER";
                    drawPlasmaBeam(ctx, h1.palmPx, h2.palmPx, this.rotationAngle, "#0099ff");
                }
            }

            if (!dualModeStr) {
                handDataList.forEach(hand => {
                    const g = hand.gesture;
                    const color = hand.color;

                    if (g === "PINCH") {
                        const midX = (hand.indexTipPx.x + hand.thumbTipPx.x) / 2;
                        const midY = (hand.indexTipPx.y + hand.thumbTipPx.y) / 2;
                        const scale = Math.floor(35 + (0.065 - hand.pinchDist) * 1000);
                        draw3DCube(ctx, midX, midY, scale, this.rotationAngle, color);
                    } else if (g === "OPEN_PALM") {
                        drawCyberShield(ctx, hand.palmPx.x, hand.palmPx.y, 65, this.rotationAngle, color);
                    } else if (g === "FIST") {
                        drawEnergyCore(ctx, hand.palmPx.x, hand.palmPx.y, 45, this.rotationAngle, "#ff8c00", this.particleSystem);
                    } else if (g === "POINT") {
                        drawPyramidAndLaser(ctx, hand.indexTipPx, this.rotationAngle, "#ffee00");
                    } else if (g === "PEACE") {
                        draw3DStar(ctx, hand.indexTipPx.x, hand.indexTipPx.y - 50, 35, this.rotationAngle, "#00ff66");
                    } else if (g === "ROCK") {
                        drawElectricArcs(ctx, hand.indexTipPx, hand.pinkyTipPx, "#ff00a0");
                        this.particleSystem.emit(hand.indexTipPx.x, hand.indexTipPx.y, "#ff00a0", 3);
                    } else if (g === "THUMBS_UP" || g === "THUMBS_DOWN") {
                        const isUp = g === "THUMBS_UP";
                        drawStatusBadge(ctx, hand.thumbTipPx.x, hand.thumbTipPx.y - 40, isUp, isUp ? "#00ff66" : "#ff2255");
                    }
                });
            }

            const active = handDataList.map(h => h.gesture).filter(g => g !== "IDLE");
            const infoText = dualModeStr || (active.length > 0 ? active.join(" + ") : `${handDataList.length} HANDS ACTIVE`);
            this.cameraManager.updateStatus(CAMERA_STATES.TRACKING, infoText);
        } else {
            this.trackingLostTimer += 0.016;
            if (this.trackingLostTimer > 0.2) {
                this.cameraManager.updateStatus(CAMERA_STATES.TRACKING_LOST);
            }
            this.stabilizers.forEach(s => s.reset());
        }

        this.particleSystem.updateAndDraw(ctx, 0.016, this.perfMonitor.maxParticles);
        requestAnimationFrame(() => this.loop());
    }
}
