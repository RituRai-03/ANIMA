// ============================================================
// WORLD 03 — GAMES CONTROLLER (Cosmic Dodger Playable Engine)
// ============================================================

import { CameraManager, CAMERA_STATES } from "../core/camera.js";
import { CanvasManager } from "../core/canvas.js";
import { PerformanceMonitor } from "../core/performance.js";
import { globalAudio } from "../core/audio.js";
import { HandTracker } from "../tracking/handTracker.js";
import { classifyHandGesture, getIndexTipPx } from "../tracking/gestureDetector.js";
import { GestureStabilizer } from "../tracking/gestureStabilizer.js";
import { ParticleSystem } from "../effects/particles.js";
import { drawHandSkeleton } from "../effects/geometric.js";

export const GAME_STATES = {
    MENU: "MENU",
    CAMERA_LOADING: "CAMERA_LOADING",
    READY: "READY",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    GAME_OVER: "GAME_OVER"
};

export class CosmicDodgerGame {
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
        this.stabilizer = new GestureStabilizer(3);

        // State Machine
        this.state = GAME_STATES.MENU;

        // Player Ship Avatar
        this.player = {
            x: 480,
            y: 400,
            targetX: 480,
            targetY: 400,
            radius: 22,
            shieldActive: false,
            lastShotTime: 0
        };

        // Gameplay Metrics
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.asteroids = [];
        this.lasers = [];
        this.spawnTimer = 0;
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
    }

    async init() {
        this.state = GAME_STATES.CAMERA_LOADING;
        const camOk = await this.cameraManager.start();
        if (!camOk) {
            this.state = GAME_STATES.MENU;
            return;
        }

        const trackOk = await this.tracker.init((statusText) => {
            this.cameraManager.updateStatus(statusText);
        });

        if (trackOk) {
            this.state = GAME_STATES.READY;
            this.isRunning = true;
            this.loop();
        } else {
            this.state = GAME_STATES.MENU;
        }
    }

    restartGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.asteroids = [];
        this.lasers = [];
        this.state = GAME_STATES.PLAYING;
    }

    spawnAsteroids(w, h) {
        this.spawnTimer++;
        const spawnInterval = Math.max(12, 42 - this.level * 3);
        if (this.spawnTimer % spawnInterval === 0) {
            this.asteroids.push({
                x: Math.random() * (w - 60) + 30,
                y: -30,
                radius: Math.random() * 16 + 14,
                speedY: Math.random() * 2.5 + 2 + this.level * 0.4,
                speedX: (Math.random() - 0.5) * 1.5,
                color: Math.random() > 0.5 ? "#ff3b30" : "#ff9500"
            });
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

        const results = this.tracker.detect(this.video);

        let handDetected = false;
        let currentGesture = "IDLE";

        if (results && results.landmarks && results.landmarks.length > 0) {
            handDetected = true;
            this.trackingLostTimer = 0;
            const landmarks = results.landmarks[0];
            drawHandSkeleton(ctx, landmarks, "#00f0ff", "#00ff66", w, h);

            // Index tip controls ship target position
            const indexTip = landmarks[8];
            this.player.targetX = (1 - indexTip.x) * w;
            this.player.targetY = indexTip.y * h;

            const rawG = classifyHandGesture(landmarks);
            const stab = this.stabilizer.update(rawG.gesture);
            currentGesture = stab.gesture;

            if (this.state === GAME_STATES.READY) {
                this.state = GAME_STATES.PLAYING;
            }

            this.cameraManager.updateStatus(CAMERA_STATES.TRACKING, currentGesture);
        } else {
            this.trackingLostTimer += 0.016;
            if (this.state === GAME_STATES.PLAYING && this.trackingLostTimer > 0.2) {
                this.cameraManager.updateStatus(CAMERA_STATES.TRACKING_LOST);
            }
        }

        // Smooth Position Lerp Interpolation
        this.player.x += (this.player.targetX - this.player.x) * 0.18;
        this.player.y += (this.player.targetY - this.player.y) * 0.18;

        // Player Controls
        this.player.shieldActive = currentGesture === "OPEN_PALM";

        if (currentGesture === "PINCH" && performance.now() - this.player.lastShotTime > 160 && this.state === GAME_STATES.PLAYING) {
            this.lasers.push({
                x: this.player.x,
                y: this.player.y - 25,
                speedY: -15,
                radius: 4
            });
            globalAudio.playLaserSFX();
            this.player.lastShotTime = performance.now();
        }

        if (currentGesture === "FIST" && this.state === GAME_STATES.PLAYING) {
            // EMP Bomb shockwave burst
            this.particleSystem.addShockwave(this.player.x, this.player.y, "#00f0ff", 200);
            this.asteroids = this.asteroids.filter(a => {
                const dist = Math.hypot(a.x - this.player.x, a.y - this.player.y);
                if (dist < 200) {
                    this.score += 15;
                    this.particleSystem.emit(a.x, a.y, "#ffee00", 12);
                    return false;
                }
                return true;
            });
        }

        if (this.state === GAME_STATES.PLAYING) {
            this.spawnAsteroids(w, h);

            // Update & Draw Lasers
            const activeLasers = [];
            this.lasers.forEach(l => {
                l.y += l.speedY;
                ctx.beginPath();
                ctx.arc(l.x, l.y, l.radius, 0, Math.PI * 2);
                ctx.fillStyle = "#00ff66";
                ctx.shadowColor = "#00ff66";
                ctx.shadowBlur = 10;
                ctx.fill();

                if (l.y > -20) activeLasers.push(l);
            });
            this.lasers = activeLasers;

            // Update & Draw Asteroids
            const activeAsteroids = [];
            this.asteroids.forEach(a => {
                a.x += a.speedX;
                a.y += a.speedY;

                ctx.save();
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
                ctx.fillStyle = a.color;
                ctx.shadowColor = a.color;
                ctx.shadowBlur = 12;
                ctx.fill();
                ctx.restore();

                let destroyed = false;
                this.lasers.forEach((l, lIdx) => {
                    const dist = Math.hypot(a.x - l.x, a.y - l.y);
                    if (dist < a.radius + l.radius) {
                        destroyed = true;
                        this.lasers.splice(lIdx, 1);
                        this.score += 10;
                        globalAudio.playExplosionSFX();
                        this.particleSystem.emit(a.x, a.y, a.color, 12);
                    }
                });

                const playerDist = Math.hypot(a.x - this.player.x, a.y - this.player.y);
                if (!destroyed && playerDist < a.radius + this.player.radius) {
                    if (this.player.shieldActive) {
                        destroyed = true;
                        this.particleSystem.addShockwave(this.player.x, this.player.y, "#00f0ff", 60);
                    } else {
                        destroyed = true;
                        this.lives--;
                        globalAudio.playExplosionSFX();
                        this.particleSystem.emit(this.player.x, this.player.y, "#ff2255", 25);
                        if (this.lives <= 0) {
                            this.state = GAME_STATES.GAME_OVER;
                        }
                    }
                }

                if (!destroyed && a.y < h + 40) {
                    activeAsteroids.push(a);
                }
            });
            this.asteroids = activeAsteroids;
            this.level = Math.floor(this.score / 100) + 1;
        }

        // Draw Player Ship
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#00f0ff";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 15;
        ctx.fill();

        if (this.player.shieldActive) {
            ctx.beginPath();
            ctx.arc(this.player.x, this.player.y, this.player.radius + 12, 0, Math.PI * 2);
            ctx.strokeStyle = "#00ff66";
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        ctx.restore();

        // Render Minimal Game HUD & Menus
        ctx.save();
        ctx.font = "bold 15px system-ui, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`SCORE: ${this.score}`, 20, 35);
        ctx.fillText(`LIVES: ${"❤️ ".repeat(Math.max(0, this.lives))}`, 20, 60);
        ctx.fillText(`LEVEL: ${this.level}`, 20, 85);

        if (this.state === GAME_STATES.READY) {
            ctx.font = "bold 20px system-ui, sans-serif";
            ctx.fillStyle = "#00f0ff";
            ctx.textAlign = "center";
            ctx.fillText("MOVE YOUR HAND TO PLAY", w / 2, h / 2);
        } else if (this.state === GAME_STATES.GAME_OVER) {
            ctx.fillStyle = "rgba(8, 12, 18, 0.88)";
            ctx.fillRect(0, 0, w, h);

            ctx.font = "bold 36px system-ui, sans-serif";
            ctx.fillStyle = "#ff2255";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", w / 2, h / 2 - 30);

            ctx.font = "20px system-ui, sans-serif";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(`FINAL SCORE: ${this.score}`, w / 2, h / 2 + 15);

            ctx.font = "14px system-ui, sans-serif";
            ctx.fillStyle = "#00f0ff";
            ctx.fillText("PINCH TO RESTART", w / 2, h / 2 + 55);

            if (currentGesture === "PINCH") {
                this.restartGame();
            }
        }
        ctx.restore();

        this.particleSystem.updateAndDraw(ctx, 0.016, this.perfMonitor.maxParticles);
        requestAnimationFrame(() => this.loop());
    }
}
