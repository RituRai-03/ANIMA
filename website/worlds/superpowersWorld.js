// ============================================================
// WORLD 02 — SUPERPOWERS CINEMATIC CONTROLLER
// ============================================================

import { CameraManager, CAMERA_STATES } from "../core/camera.js";
import { CanvasManager } from "../core/canvas.js";
import { PerformanceMonitor } from "../core/performance.js";
import { globalAudio } from "../core/audio.js";
import { HandTracker } from "../tracking/handTracker.js";
import { classifyHandGesture, getLandmarkPx, getPalmCenterPx } from "../tracking/gestureDetector.js";
import { GestureStabilizer } from "../tracking/gestureStabilizer.js";
import { ParticleSystem } from "../effects/particles.js";
import { drawHandSkeleton } from "../effects/geometric.js";
import { FireballSystem, drawChargingFireball } from "../effects/fireball.js";
import { drawWebShooterFlash, drawWebNetworkMatrix } from "../effects/web.js";
import { drawPlasmaBeam, drawMysticPortal } from "../effects/energy.js";

export class SuperpowersWorld {
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

        this.fireballSystems = [new FireballSystem(), new FireballSystem()];
        this.stabilizers = [new GestureStabilizer(5), new GestureStabilizer(5)];

        this.rotationAngle = 0;
        this.trackingLostTimer = 0;
        this.isRunning = false;
        this.isInitializing = false;
        this.animationFrame = null;
    }

    async start() {
        if (this.startBtn) {
            this.startBtn.addEventListener("click", () => {
                globalAudio.init();
                this.init();
            });
        }
    }

    async init() {
        if (this.isRunning || this.isInitializing) return;
        this.isInitializing = true;

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        try {
            const camOk = await this.cameraManager.start();
            if (!camOk) return;

            const trackOk = await this.tracker.init((statusText) => {
                this.cameraManager.updateStatus(statusText);
            });

            if (trackOk) {
                this.isRunning = true;
                this.loop();
            }
        } catch (error) {
            console.error("SuperpowersWorld Initialization Error:", error);
            this.cameraManager.updateStatus(CAMERA_STATES.ERROR);
        } finally {
            this.isInitializing = false;
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
                const middleTipPx = getLandmarkPx(landmarks[12], w, h);
                const pinkyTipPx = getLandmarkPx(landmarks[20], w, h);

                const fbCenter = {
                    x: (indexTipPx.x + middleTipPx.x) / 2,
                    y: (indexTipPx.y + middleTipPx.y) / 2
                };

                handDataList.push({
                    index: i,
                    label: label,
                    gesture: stabResult.gesture,
                    holdTime: stabResult.holdTime,
                    landmarks: landmarks,
                    palmPx: palmPx,
                    indexTipPx: indexTipPx,
                    middleTipPx: middleTipPx,
                    pinkyTipPx: pinkyTipPx,
                    fbCenter: fbCenter,
                    color: primaryColor
                });
            }

            if (handDataList.length === 2) {
                const h1 = handDataList[0];
                const h2 = handDataList[1];

                if (h1.gesture === "OPEN_PALM" && h2.gesture === "OPEN_PALM") {
                    dualModeStr = "PLASMA BEAM + MYSTIC PORTAL";
                    drawPlasmaBeam(ctx, h1.palmPx, h2.palmPx, this.rotationAngle, "#0099ff");

                    const portalCenter = {
                        x: (h1.palmPx.x + h2.palmPx.x) / 2,
                        y: (h1.palmPx.y + h2.palmPx.y) / 2
                    };
                    const dist = Math.hypot(h1.palmPx.x - h2.palmPx.x, h1.palmPx.y - h2.palmPx.y);
                    const portalRadius = Math.max(50, Math.min(180, dist * 0.45));
                    drawMysticPortal(ctx, portalCenter, portalRadius, this.rotationAngle);
                }
            }

            if (!dualModeStr) {
                handDataList.forEach((hand, idx) => {
                    const fbSys = this.fireballSystems[idx];
                    const isCharging = hand.gesture === "PINCH" || hand.gesture === "FIST";
                    const fbState = fbSys.updateCharge(isCharging, 0.016);

                    if (fbState.status === "CHARGING" || fbState.status === "READY") {
                        drawChargingFireball(ctx, hand.fbCenter.x, hand.fbCenter.y, fbState.charge, fbState.status === "READY", this.rotationAngle);
                    } else if (fbState.status === "LAUNCH_REQUESTED") {
                        fbSys.launch(hand.fbCenter.x, hand.fbCenter.y, hand.fbCenter.x, hand.fbCenter.y - 150, this.particleSystem, globalAudio);
                    }

                    if (hand.gesture === "WEB_POSE") {
                        drawWebShooterFlash(ctx, hand.palmPx.x, hand.palmPx.y, hand.holdTime);
                        const webCenter = {
                            x: (hand.indexTipPx.x + hand.pinkyTipPx.x) / 2,
                            y: (hand.indexTipPx.y + hand.pinkyTipPx.y) / 2
                        };
                        drawWebNetworkMatrix(ctx, webCenter, 130, hand.palmPx);

                        if (hand.holdTime < 0.05) {
                            globalAudio.playWebShootSFX();
                        }
                    }

                    fbSys.updateAndDraw(ctx, this.particleSystem, 0.016);
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
        if (this.isRunning) {
            this.animationFrame = requestAnimationFrame(() => this.loop());
        }
    }

    stop() {
        this.isRunning = false;
        this.isInitializing = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        if (this.cameraManager) {
            this.cameraManager.stop();
        }
        if (this.particleSystem) {
            this.particleSystem.clear();
        }
        this.stabilizers.forEach(s => s.reset());
    }
}
