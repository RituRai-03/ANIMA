// ============================================================
// AR.UI — WORLD 03
// Cosmic Dodger — Gesture Controlled Game
// ============================================================

export class CosmicDodgerGame {

    constructor() {

        // --------------------------------------------------------
        // DOM
        // --------------------------------------------------------

        this.camera =
            document.getElementById("camera");

        this.canvas =
            document.getElementById("ar-canvas");

        this.ctx =
            this.canvas.getContext("2d");

        this.startButton =
            document.getElementById("start-camera");

        this.cameraMessage =
            document.getElementById("camera-message");

        this.trackingStatus =
            document.getElementById("tracking-status");

        this.fpsCounter =
            document.getElementById("fps-counter");


        // --------------------------------------------------------
        // MediaPipe
        // --------------------------------------------------------

        this.handLandmarker = null;

        this.cameraStream = null;

        this.lastVideoTime = -1;


        // --------------------------------------------------------
        // Animation
        // --------------------------------------------------------

        this.animationFrame = null;

        this.lastFrameTime = performance.now();

        this.fpsFrames = 0;
        this.fpsTimer = performance.now();


        // --------------------------------------------------------
        // Game State
        // --------------------------------------------------------

        this.running = false;

        this.gameStarted = false;

        this.gameOver = false;

        this.score = 0;

        this.lives = 3;

        this.level = 1;

        this.spawnTimer = 0;

        this.enemyTimer = 0;

        this.backgroundTime = 0;


        // --------------------------------------------------------
        // Hand State
        // --------------------------------------------------------

        this.handDetected = false;

        this.handX = 0.5;

        this.handY = 0.75;

        this.gesture = "NONE";

        this.previousGesture = "NONE";


        // --------------------------------------------------------
        // Gesture Cooldowns
        // --------------------------------------------------------

        this.lastShotTime = 0;

        this.lastEmpTime = 0;

        this.lastDamageTime = 0;

        this.shieldActive = false;

        this.shieldUntil = 0;


        // --------------------------------------------------------
        // Game Objects
        // --------------------------------------------------------

        this.ship = {

            x: 0,

            y: 0,

            width: 42,

            height: 56,

            targetX: 0,

            targetY: 0,

            speed: 0.12
        };


        this.lasers = [];

        this.enemies = [];

        this.particles = [];

        this.stars = [];


        // --------------------------------------------------------
        // Bind methods
        // --------------------------------------------------------

        this.loop =
            this.loop.bind(this);

        this.detectHands =
            this.detectHands.bind(this);

        this.startCamera =
            this.startCamera.bind(this);

        this.handleResize =
            this.handleResize.bind(this);


        // --------------------------------------------------------
        // Initial Setup
        // --------------------------------------------------------

        this.createStars();

        this.resizeCanvas();

        window.addEventListener(
            "resize",
            this.handleResize
        );


        if (this.startButton) {

            this.startButton.addEventListener(
                "click",
                this.startCamera
            );

        }

    }


    // ============================================================
    // START
    // ============================================================

    start() {

        this.resizeCanvas();

        this.resetGame();

        this.drawWaitingScreen();

    }


    // ============================================================
    // CAMERA
    // ============================================================

    async startCamera() {

        if (this.running) {
            return;
        }

        try {

            this.setStatus(
                "REQUESTING CAMERA"
            );


            // ----------------------------------------------------
            // Request webcam
            // ----------------------------------------------------

            this.cameraStream =
                await navigator.mediaDevices.getUserMedia({

                    video: {

                        width: {
                            ideal: 960
                        },

                        height: {
                            ideal: 540
                        },

                        facingMode: "user"

                    },

                    audio: false

                });


            this.camera.srcObject =
                this.cameraStream;


            // ----------------------------------------------------
            // Mirror ONLY camera
            // ----------------------------------------------------

            this.camera.style.transform =
                "scaleX(-1)";


            // Do NOT mirror the canvas.
            // The hand coordinates are mirrored manually.
            this.canvas.style.transform =
                "none";


            this.cameraMessage.style.display =
                "none";


            this.setStatus(
                "CAMERA READY"
            );


            // ----------------------------------------------------
            // Wait for video
            // ----------------------------------------------------

            await this.waitForVideo();


            // ----------------------------------------------------
            // Initialize MediaPipe
            // ----------------------------------------------------

            await this.initializeHandTracking();


            // ----------------------------------------------------
            // Start Game
            // ----------------------------------------------------

            this.resetGame();

            this.running = true;

            this.gameStarted = true;

            this.gameOver = false;

            this.lastFrameTime =
                performance.now();

            this.animationFrame =
                requestAnimationFrame(
                    this.loop
                );


        } catch (error) {

            console.error(
                "Game camera error:",
                error
            );

            this.setStatus(
                "CAMERA ERROR"
            );

            this.showCameraError();

        }

    }


    // ============================================================
    // WAIT FOR VIDEO
    // ============================================================

    waitForVideo() {

        return new Promise(
            (resolve) => {

                if (
                    this.camera.readyState >= 2 &&
                    this.camera.videoWidth > 0
                ) {

                    resolve();

                    return;

                }


                this.camera.addEventListener(
                    "loadeddata",
                    () => {

                        resolve();

                    },
                    {
                        once: true
                    }
                );

            }
        );

    }


    // ============================================================
    // MEDIAPIPE INITIALIZATION
    // ============================================================

    async initializeHandTracking() {

        try {

            this.setStatus(
                "LOADING HAND TRACKING"
            );


            const vision =
                await import(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm"
                );


            const {
                HandLandmarker,
                FilesetResolver
            } = vision;


            const filesetResolver =
                await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
                );


            this.handLandmarker =
                await HandLandmarker.createFromOptions(
                    filesetResolver,
                    {

                        baseOptions: {

                            modelAssetPath:
                                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",

                            delegate:
                                "GPU"

                        },


                        numHands: 1,


                        minHandDetectionConfidence:
                            0.65,

                        minHandPresenceConfidence:
                            0.60,

                        minTrackingConfidence:
                            0.60,


                        runningMode:
                            "VIDEO"

                    }
                );


            this.setStatus(
                "HAND CONTROLLER READY"
            );


            console.log(
                "Cosmic Dodger: MediaPipe ready."
            );


        } catch (error) {

            console.error(
                "MediaPipe initialization error:",
                error
            );

            this.setStatus(
                "TRACKING ERROR"
            );

            throw error;

        }

    }


    // ============================================================
    // MAIN LOOP
    // ============================================================

    loop(timestamp) {

        if (!this.running) {
            return;
        }


        const delta =
            Math.min(
                (timestamp - this.lastFrameTime) / 1000,
                0.05
            );


        this.lastFrameTime =
            timestamp;


        this.updateFPS(
            timestamp
        );


        // --------------------------------------------------------
        // Detect hands
        // --------------------------------------------------------

        this.detectHands();


        // --------------------------------------------------------
        // Update game
        // --------------------------------------------------------

        this.update(
            delta,
            timestamp
        );


        // --------------------------------------------------------
        // Render
        // --------------------------------------------------------

        this.render(
            timestamp
        );


        this.animationFrame =
            requestAnimationFrame(
                this.loop
            );

    }


    // ============================================================
    // HAND DETECTION
    // ============================================================

    detectHands() {

        if (
            !this.handLandmarker ||
            !this.camera ||
            this.camera.readyState < 2
        ) {

            return;

        }


        if (
            this.camera.currentTime ===
            this.lastVideoTime
        ) {

            return;

        }


        this.lastVideoTime =
            this.camera.currentTime;


        let results;


        try {

            results =
                this.handLandmarker.detectForVideo(
                    this.camera,
                    performance.now()
                );

        } catch (error) {

            console.warn(
                "Hand detection error:",
                error
            );

            return;

        }


        if (
            !results ||
            !results.landmarks ||
            results.landmarks.length === 0
        ) {

            this.handDetected =
                false;

            this.gesture =
                "NONE";

            this.shieldActive =
                false;

            this.setStatus(
                "NO HAND CONTROLLER"
            );

            return;

        }


        this.handDetected =
            true;


        const landmarks =
            results.landmarks[0];


        // --------------------------------------------------------
        // Palm center
        // --------------------------------------------------------

        const palm =
            this.getPalmCenter(
                landmarks
            );


        /*
         * MediaPipe coordinates are not mirrored.
         *
         * Camera is visually mirrored using CSS.
         *
         * Therefore we mirror the X coordinate manually
         * for the game controller.
         */

        const mirroredX =
            1 - palm.x;


        this.handX =
            this.smoothValue(
                this.handX,
                mirroredX,
                0.25
            );


        this.handY =
            this.smoothValue(
                this.handY,
                palm.y,
                0.25
            );


        // --------------------------------------------------------
        // Gesture
        // --------------------------------------------------------

        const gesture =
            this.classifyGesture(
                landmarks
            );


        this.previousGesture =
            this.gesture;


        this.gesture =
            gesture;


        // --------------------------------------------------------
        // Gesture actions
        // --------------------------------------------------------

        this.processGesture(
            gesture,
            landmarks
        );


        this.setStatus(
            `${gesture} • HAND CONTROLLER`
        );

    }


    // ============================================================
    // PALM CENTER
    // ============================================================

    getPalmCenter(landmarks) {

        const points = [

            landmarks[0],

            landmarks[5],

            landmarks[9],

            landmarks[13],

            landmarks[17]

        ];


        let x = 0;
        let y = 0;


        points.forEach(
            (point) => {

                x += point.x;
                y += point.y;

            }
        );


        return {

            x: x / points.length,

            y: y / points.length

        };

    }


    // ============================================================
    // GESTURE CLASSIFIER
    // ============================================================

    classifyGesture(landmarks) {

        const thumbTip =
            landmarks[4];

        const indexTip =
            landmarks[8];

        const middleTip =
            landmarks[12];

        const ringTip =
            landmarks[16];

        const pinkyTip =
            landmarks[20];


        const indexMcp =
            landmarks[5];

        const middleMcp =
            landmarks[9];

        const ringMcp =
            landmarks[13];

        const pinkyMcp =
            landmarks[17];


        // --------------------------------------------------------
        // Pinch
        // --------------------------------------------------------

        const pinchDistance =
            Math.hypot(

                thumbTip.x -
                indexTip.x,

                thumbTip.y -
                indexTip.y

            );


        if (
            pinchDistance < 0.075
        ) {

            return "PINCH";

        }


        // --------------------------------------------------------
        // Finger extension
        // --------------------------------------------------------

        const indexOpen =
            indexTip.y <
            indexMcp.y - 0.025;


        const middleOpen =
            middleTip.y <
            middleMcp.y - 0.025;


        const ringOpen =
            ringTip.y <
            ringMcp.y - 0.025;


        const pinkyOpen =
            pinkyTip.y <
            pinkyMcp.y - 0.025;


        // --------------------------------------------------------
        // Open Palm
        // --------------------------------------------------------

        if (
            indexOpen &&
            middleOpen &&
            ringOpen &&
            pinkyOpen
        ) {

            return "OPEN PALM";

        }


        // --------------------------------------------------------
        // Fist
        // --------------------------------------------------------

        if (
            !indexOpen &&
            !middleOpen &&
            !ringOpen &&
            !pinkyOpen
        ) {

            return "FIST";

        }


        // --------------------------------------------------------
        // Point
        // --------------------------------------------------------

        if (
            indexOpen &&
            !middleOpen &&
            !ringOpen &&
            !pinkyOpen
        ) {

            return "POINT";

        }


        return "MOVE";

    }


    // ============================================================
    // GESTURE ACTIONS
    // ============================================================

    processGesture(
        gesture,
        landmarks
    ) {

        const now =
            performance.now();


        // --------------------------------------------------------
        // PINCH = LASER
        // --------------------------------------------------------

        if (
            gesture === "PINCH"
        ) {

            if (
                now - this.lastShotTime >
                280
            ) {

                this.fireLaser();

                this.lastShotTime =
                    now;

            }

        }


        // --------------------------------------------------------
        // OPEN PALM = SHIELD
        // --------------------------------------------------------

        if (
            gesture === "OPEN PALM"
        ) {

            this.shieldActive =
                true;

            this.shieldUntil =
                now + 120;

        } else {

            if (
                now >
                this.shieldUntil
            ) {

                this.shieldActive =
                    false;

            }

        }


        // --------------------------------------------------------
        // FIST = EMP
        // --------------------------------------------------------

        if (
            gesture === "FIST"
        ) {

            if (
                now - this.lastEmpTime >
                1200
            ) {

                this.triggerEMP();

                this.lastEmpTime =
                    now;

            }

        }

    }


    // ============================================================
    // GAME UPDATE
    // ============================================================

    update(delta, timestamp) {

        if (
            !this.gameStarted ||
            this.gameOver
        ) {

            this.updateParticles(
                delta
            );

            return;

        }


        this.backgroundTime +=
            delta;


        // --------------------------------------------------------
        // Ship target
        // --------------------------------------------------------

        this.ship.targetX =
            this.handX *
            this.canvas.width;


        this.ship.targetY =
            Math.min(

                this.canvas.height - 90,

                Math.max(

                    this.canvas.height * 0.55,

                    this.handY *
                    this.canvas.height

                )

            );


        // --------------------------------------------------------
        // Smooth ship movement
        // --------------------------------------------------------

        this.ship.x +=
            (
                this.ship.targetX -
                this.ship.x
            ) *
            Math.min(
                1,
                this.ship.speed *
                60 *
                delta
            );


        this.ship.y +=
            (
                this.ship.targetY -
                this.ship.y
            ) *
            Math.min(
                1,
                this.ship.speed *
                60 *
                delta
            );


        // --------------------------------------------------------
        // Spawn enemies
        // --------------------------------------------------------

        this.spawnTimer +=
            delta;


        const spawnInterval =
            Math.max(
                0.38,
                1.0 -
                this.level * 0.045
            );


        if (
            this.spawnTimer >
            spawnInterval
        ) {

            this.spawnEnemy();

            this.spawnTimer =
                0;

        }


        // --------------------------------------------------------
        // Update lasers
        // --------------------------------------------------------

        this.updateLasers(
            delta
        );


        // --------------------------------------------------------
        // Update enemies
        // --------------------------------------------------------

        this.updateEnemies(
            delta
        );


        // --------------------------------------------------------
        // Particles
        // --------------------------------------------------------

        this.updateParticles(
            delta
        );


        // --------------------------------------------------------
        // Level
        // --------------------------------------------------------

        this.level =
            1 +
            Math.floor(
                this.score / 1000
            );

    }


    // ============================================================
    // LASER
    // ============================================================

    fireLaser() {

        const startX =
            this.ship.x;

        const startY =
            this.ship.y -
            this.ship.height * 0.45;


        this.lasers.push({

            x: startX,

            y: startY,

            speed: 620,

            width: 4,

            height: 18

        });


        this.createBurst(
            startX,
            startY,
            5,
            "laser"
        );

    }


    // ============================================================
    // LASER UPDATE
    // ============================================================

    updateLasers(delta) {

        for (
            let i = this.lasers.length - 1;
            i >= 0;
            i--
        ) {

            const laser =
                this.lasers[i];


            laser.y -=
                laser.speed *
                delta;


            if (
                laser.y < -40
            ) {

                this.lasers.splice(
                    i,
                    1
                );

                continue;

            }


            // ----------------------------------------------------
            // Collision
            // ----------------------------------------------------

            for (
                let j = this.enemies.length - 1;
                j >= 0;
                j--
            ) {

                const enemy =
                    this.enemies[j];


                if (
                    this.rectCollision(
                        laser,
                        enemy
                    )
                ) {

                    this.destroyEnemy(
                        j
                    );


                    this.lasers.splice(
                        i,
                        1
                    );


                    break;

                }

            }

        }

    }


    // ============================================================
    // ENEMY
    // ============================================================

    spawnEnemy() {

        const size =
            24 +
            Math.random() * 28;


        this.enemies.push({

            x:
                size +
                Math.random() *
                (
                    this.canvas.width -
                    size * 2
                ),

            y:
                -size - 20,

            width:
                size,

            height:
                size,

            speed:
                90 +
                Math.random() *
                70 +
                this.level *
                8,

            rotation:
                Math.random() *
                Math.PI * 2,

            rotationSpeed:
                (
                    Math.random() -
                    0.5
                ) *
                2.5

        });

    }


    // ============================================================
    // ENEMY UPDATE
    // ============================================================

    updateEnemies(delta) {

        for (
            let i = this.enemies.length - 1;
            i >= 0;
            i--
        ) {

            const enemy =
                this.enemies[i];


            enemy.y +=
                enemy.speed *
                delta;


            enemy.rotation +=
                enemy.rotationSpeed *
                delta;


            // ----------------------------------------------------
            // Hit ship
            // ----------------------------------------------------

            if (
                this.rectCollision(
                    this.ship,
                    enemy
                )
            ) {

                if (
                    !this.shieldActive
                ) {

                    this.damagePlayer();

                } else {

                    this.createBurst(
                        enemy.x,
                        enemy.y,
                        12,
                        "shield"
                    );

                }


                this.enemies.splice(
                    i,
                    1
                );


                continue;

            }


            // ----------------------------------------------------
            // Enemy passed bottom
            // ----------------------------------------------------

            if (
                enemy.y >
                this.canvas.height + 60
            ) {

                this.enemies.splice(
                    i,
                    1
                );


                this.damagePlayer();

            }

        }

    }


    // ============================================================
    // DESTROY ENEMY
    // ============================================================

    destroyEnemy(index) {

        const enemy =
            this.enemies[index];


        if (!enemy) {
            return;
        }


        this.score +=
            100;


        this.createBurst(
            enemy.x,
            enemy.y,
            18,
            "explosion"
        );


        this.enemies.splice(
            index,
            1
        );

    }


    // ============================================================
    // DAMAGE PLAYER
    // ============================================================

    damagePlayer() {

        const now =
            performance.now();


        if (
            now - this.lastDamageTime <
            700
        ) {

            return;

        }


        this.lastDamageTime =
            now;


        this.lives--;


        this.createBurst(
            this.ship.x,
            this.ship.y,
            20,
            "damage"
        );


        if (
            this.lives <= 0
        ) {

            this.endGame();

        }

    }


    // ============================================================
    // EMP
    // ============================================================

    triggerEMP() {

        const radius =
            Math.min(
                this.canvas.width,
                this.canvas.height
            ) *
            0.38;


        this.createBurst(
            this.ship.x,
            this.ship.y,
            45,
            "emp"
        );


        for (
            let i = this.enemies.length - 1;
            i >= 0;
            i--
        ) {

            const enemy =
                this.enemies[i];


            const distance =
                Math.hypot(

                    enemy.x -
                    this.ship.x,

                    enemy.y -
                    this.ship.y

                );


            if (
                distance < radius
            ) {

                this.score +=
                    150;


                this.createBurst(
                    enemy.x,
                    enemy.y,
                    14,
                    "explosion"
                );


                this.enemies.splice(
                    i,
                    1
                );

            }

        }

    }


    // ============================================================
    // PARTICLES
    // ============================================================

    createBurst(
        x,
        y,
        count,
        type
    ) {

        for (
            let i = 0;
            i < count;
            i++
        ) {

            const angle =
                Math.random() *
                Math.PI *
                2;


            const speed =
                30 +
                Math.random() *
                150;


            this.particles.push({

                x,

                y,

                vx:
                    Math.cos(angle) *
                    speed,

                vy:
                    Math.sin(angle) *
                    speed,

                size:
                    1.5 +
                    Math.random() *
                    3,

                life:
                    0.4 +
                    Math.random() *
                    0.6,

                maxLife:
                    1,

                type

            });

        }

    }


    // ============================================================
    // PARTICLE UPDATE
    // ============================================================

    updateParticles(delta) {

        for (
            let i =
                this.particles.length - 1;
            i >= 0;
            i--
        ) {

            const particle =
                this.particles[i];


            particle.x +=
                particle.vx *
                delta;


            particle.y +=
                particle.vy *
                delta;


            particle.vx *=
                Math.pow(
                    0.03,
                    delta
                );


            particle.vy *=
                Math.pow(
                    0.03,
                    delta
                );


            particle.life -=
                delta;


            if (
                particle.life <= 0
            ) {

                this.particles.splice(
                    i,
                    1
                );

            }

        }

    }


    // ============================================================
    // RENDER
    // ============================================================

    render(timestamp) {

        const ctx =
            this.ctx;


        const width =
            this.canvas.width;


        const height =
            this.canvas.height;


        // --------------------------------------------------------
        // IMPORTANT:
        // Clear the ENTIRE canvas every frame.
        // This prevents old graphics/artifacts.
        // --------------------------------------------------------

        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        // --------------------------------------------------------
        // Background
        // --------------------------------------------------------

        this.drawSpaceBackground(
            ctx,
            width,
            height,
            timestamp
        );


        // --------------------------------------------------------
        // Stars
        // --------------------------------------------------------

        this.drawStars(
            ctx,
            width,
            height
        );


        // --------------------------------------------------------
        // Enemies
        // --------------------------------------------------------

        this.enemies.forEach(
            (enemy) => {

                this.drawEnemy(
                    ctx,
                    enemy
                );

            }
        );


        // --------------------------------------------------------
        // Lasers
        // --------------------------------------------------------

        this.lasers.forEach(
            (laser) => {

                this.drawLaser(
                    ctx,
                    laser
                );

            }
        );


        // --------------------------------------------------------
        // Shield
        // --------------------------------------------------------

        if (
            this.shieldActive
        ) {

            this.drawShield(
                ctx
            );

        }


        // --------------------------------------------------------
        // Ship
        // --------------------------------------------------------

        if (
            this.gameStarted
        ) {

            this.drawShip(
                ctx
            );

        }


        // --------------------------------------------------------
        // Particles
        // --------------------------------------------------------

        this.drawParticles(
            ctx
        );


        // --------------------------------------------------------
        // Game HUD
        // --------------------------------------------------------

        this.drawGameHUD(
            ctx,
            width
        );


        // --------------------------------------------------------
        // Game Over
        // --------------------------------------------------------

        if (
            this.gameOver
        ) {

            this.drawGameOver(
                ctx,
                width,
                height
            );

        }

    }


    // ============================================================
    // SPACE BACKGROUND
    // ============================================================

    drawSpaceBackground(
        ctx,
        width,
        height,
        timestamp
    ) {

        const gradient =
            ctx.createLinearGradient(
                0,
                0,
                0,
                height
            );


        gradient.addColorStop(
            0,
            "rgba(5, 12, 25, 0.15)"
        );


        gradient.addColorStop(
            1,
            "rgba(5, 12, 25, 0.32)"
        );


        ctx.fillStyle =
            gradient;


        ctx.fillRect(
            0,
            0,
            width,
            height
        );

    }


    // ============================================================
    // STARS
    // ============================================================

    createStars() {

        this.stars =
            [];


        for (
            let i = 0;
            i < 110;
            i++
        ) {

            this.stars.push({

                x:
                    Math.random(),

                y:
                    Math.random(),

                size:
                    0.7 +
                    Math.random() *
                    2,

                speed:
                    0.01 +
                    Math.random() *
                    0.04,

                phase:
                    Math.random() *
                    Math.PI *
                    2

            });

        }

    }


    drawStars(
        ctx,
        width,
        height
    ) {

        const time =
            this.backgroundTime;


        this.stars.forEach(
            (star) => {

                let y =
                    (
                        star.y +
                        time *
                        star.speed
                    ) % 1;


                const x =
                    star.x *
                    width;


                const py =
                    y *
                    height;


                const alpha =
                    0.35 +
                    (
                        Math.sin(
                            time * 2 +
                            star.phase
                        ) +
                        1
                    ) *
                    0.2;


                ctx.beginPath();


                ctx.arc(
                    x,
                    py,
                    star.size,
                    0,
                    Math.PI * 2
                );


                ctx.fillStyle =
                    `rgba(210, 225, 240, ${alpha})`;


                ctx.fill();

            }
        );

    }


    // ============================================================
    // SHIP
    // ============================================================

    drawShip(ctx) {

        const x =
            this.ship.x;


        const y =
            this.ship.y;


        ctx.save();


        ctx.translate(
            x,
            y
        );


        // --------------------------------------------------------
        // Engine
        // --------------------------------------------------------

        const flame =
            10 +
            Math.sin(
                this.backgroundTime * 20
            ) *
            4;


        ctx.beginPath();


        ctx.moveTo(
            -7,
            20
        );


        ctx.lineTo(
            0,
            20 + flame
        );


        ctx.lineTo(
            7,
            20
        );


        ctx.closePath();


        ctx.fillStyle =
            "rgba(120, 169, 214, 0.8)";


        ctx.fill();


        // --------------------------------------------------------
        // Ship body
        // --------------------------------------------------------

        ctx.beginPath();


        ctx.moveTo(
            0,
            -28
        );


        ctx.lineTo(
            17,
            17
        );


        ctx.lineTo(
            8,
            13
        );


        ctx.lineTo(
            0,
            20
        );


        ctx.lineTo(
            -8,
            13
        );


        ctx.lineTo(
            -17,
            17
        );


        ctx.closePath();


        ctx.fillStyle =
            "rgba(210, 220, 230, 0.9)";


        ctx.fill();


        ctx.strokeStyle =
            "#78A9D6";


        ctx.lineWidth =
            2;


        ctx.stroke();


        // --------------------------------------------------------
        // Cockpit
        // --------------------------------------------------------

        ctx.beginPath();


        ctx.moveTo(
            0,
            -17
        );


        ctx.lineTo(
            7,
            5
        );


        ctx.lineTo(
            0,
            9
        );


        ctx.lineTo(
            -7,
            5
        );


        ctx.closePath();


        ctx.fillStyle =
            "rgba(70, 120, 160, 0.75)";


        ctx.fill();


        ctx.strokeStyle =
            "#B7D3EA";


        ctx.stroke();


        ctx.restore();

    }


    // ============================================================
    // ENEMY
    // ============================================================

    drawEnemy(
        ctx,
        enemy
    ) {

        ctx.save();


        ctx.translate(
            enemy.x,
            enemy.y
        );


        ctx.rotate(
            enemy.rotation
        );


        const half =
            enemy.width / 2;


        ctx.beginPath();


        ctx.moveTo(
            0,
            -half
        );


        ctx.lineTo(
            half,
            0
        );


        ctx.lineTo(
            0,
            half
        );


        ctx.lineTo(
            -half,
            0
        );


        ctx.closePath();


        ctx.fillStyle =
            "rgba(85, 100, 115, 0.9)";


        ctx.fill();


        ctx.strokeStyle =
            "#9FB0BF";


        ctx.lineWidth =
            1.5;


        ctx.stroke();


        // Core

        ctx.beginPath();


        ctx.arc(
            0,
            0,
            half * 0.25,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#D6DEE6";


        ctx.fill();


        ctx.restore();

    }


    // ============================================================
    // LASER DRAW
    // ============================================================

    drawLaser(
        ctx,
        laser
    ) {

        ctx.save();


        ctx.fillStyle =
            "rgba(170, 210, 235, 0.9)";


        ctx.fillRect(

            laser.x -
            laser.width / 2,

            laser.y,

            laser.width,

            laser.height

        );


        ctx.restore();

    }


    // ============================================================
    // SHIELD
    // ============================================================

    drawShield(ctx) {

        const radius =
            43 +
            Math.sin(
                this.backgroundTime * 8
            ) *
            3;


        ctx.save();


        ctx.beginPath();


        ctx.arc(
            this.ship.x,
            this.ship.y,
            radius,
            0,
            Math.PI * 2
        );


        ctx.strokeStyle =
            "rgba(150, 190, 220, 0.75)";


        ctx.lineWidth =
            2;


        ctx.stroke();


        ctx.beginPath();


        ctx.arc(
            this.ship.x,
            this.ship.y,
            radius - 6,
            0,
            Math.PI * 2
        );


        ctx.strokeStyle =
            "rgba(210, 225, 240, 0.25)";


        ctx.lineWidth =
            1;


        ctx.stroke();


        ctx.restore();

    }


    // ============================================================
    // PARTICLE DRAW
    // ============================================================

    drawParticles(ctx) {

        this.particles.forEach(
            (particle) => {

                const alpha =
                    Math.max(
                        0,
                        Math.min(
                            1,
                            particle.life
                        )
                    );


                ctx.beginPath();


                ctx.arc(
                    particle.x,
                    particle.y,
                    particle.size,
                    0,
                    Math.PI * 2
                );


                let color =
                    `rgba(190, 210, 225, ${alpha})`;


                if (
                    particle.type ===
                    "laser"
                ) {

                    color =
                        `rgba(170, 210, 235, ${alpha})`;

                }


                if (
                    particle.type ===
                    "shield"
                ) {

                    color =
                        `rgba(160, 190, 220, ${alpha})`;

                }


                if (
                    particle.type ===
                    "emp"
                ) {

                    color =
                        `rgba(205, 215, 225, ${alpha})`;

                }


                ctx.fillStyle =
                    color;


                ctx.fill();

            }
        );

    }


    // ============================================================
    // HUD
    // ============================================================

    drawGameHUD(
        ctx,
        width
    ) {

        if (
            !this.gameStarted
        ) {

            return;

        }


        ctx.save();


        // --------------------------------------------------------
        // Score
        // --------------------------------------------------------

        ctx.font =
            "600 16px Arial";


        ctx.fillStyle =
            "rgba(230, 235, 240, 0.9)";


        ctx.textAlign =
            "left";


        ctx.fillText(
            `SCORE  ${this.score}`,
            20,
            30
        );


        // --------------------------------------------------------
        // Lives
        // --------------------------------------------------------

        ctx.textAlign =
            "right";


        ctx.fillText(
            `LIVES  ${this.lives}`,
            width - 20,
            30
        );


        // --------------------------------------------------------
        // Level
        // --------------------------------------------------------

        ctx.textAlign =
            "center";


        ctx.font =
            "500 12px Arial";


        ctx.fillStyle =
            "rgba(190, 205, 220, 0.8)";


        ctx.fillText(
            `LEVEL ${this.level}`,
            width / 2,
            30
        );


        ctx.restore();

    }


    // ============================================================
    // GAME OVER
    // ============================================================

    drawGameOver(
        ctx,
        width,
        height
    ) {

        ctx.save();


        ctx.fillStyle =
            "rgba(3, 8, 16, 0.72)";


        ctx.fillRect(
            0,
            0,
            width,
            height
        );


        ctx.textAlign =
            "center";


        ctx.fillStyle =
            "#E6EBF0";


        ctx.font =
            "600 32px Arial";


        ctx.fillText(
            "MISSION ENDED",
            width / 2,
            height / 2 - 25
        );


        ctx.font =
            "400 16px Arial";


        ctx.fillStyle =
            "rgba(210, 220, 230, 0.8)";


        ctx.fillText(
            `Score: ${this.score}`,
            width / 2,
            height / 2 + 10
        );


        ctx.font =
            "400 13px Arial";


        ctx.fillStyle =
            "rgba(170, 185, 200, 0.8)";


        ctx.fillText(
            "Click Start Game to play again",
            width / 2,
            height / 2 + 38
        );


        ctx.restore();

    }


    // ============================================================
    // WAITING SCREEN
    // ============================================================

    drawWaitingScreen() {

        const ctx =
            this.ctx;


        const width =
            this.canvas.width;


        const height =
            this.canvas.height;


        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        ctx.fillStyle =
            "rgba(5, 12, 25, 0.28)";


        ctx.fillRect(
            0,
            0,
            width,
            height
        );


        ctx.textAlign =
            "center";


        ctx.fillStyle =
            "rgba(225, 232, 238, 0.9)";


        ctx.font =
            "600 24px Arial";


        ctx.fillText(
            "COSMIC DODGER",
            width / 2,
            height / 2 - 15
        );


        ctx.font =
            "400 14px Arial";


        ctx.fillStyle =
            "rgba(190, 205, 220, 0.8)";


        ctx.fillText(
            "Enable the camera to begin",
            width / 2,
            height / 2 + 18
        );

    }


    // ============================================================
    // GAME RESET
    // ============================================================

    resetGame() {

        this.score =
            0;

        this.lives =
            3;

        this.level =
            1;

        this.spawnTimer =
            0;

        this.lastShotTime =
            0;

        this.lastEmpTime =
            0;

        this.lastDamageTime =
            0;


        this.lasers =
            [];

        this.enemies =
            [];

        this.particles =
            [];


        this.gameOver =
            false;


        this.gameStarted =
            true;


        this.ship.x =
            this.canvas.width / 2;


        this.ship.y =
            this.canvas.height * 0.78;


        this.ship.targetX =
            this.ship.x;


        this.ship.targetY =
            this.ship.y;

    }


    // ============================================================
    // GAME OVER
    // ============================================================

    endGame() {

        this.gameOver =
            true;

        this.gameStarted =
            false;


        this.setStatus(
            "GAME OVER"
        );

    }


    // ============================================================
    // RECTANGLE COLLISION
    // ============================================================

    rectCollision(
        a,
        b
    ) {

        const ax =
            a.x -
            (a.width || 0) / 2;


        const ay =
            a.y -
            (a.height || 0) / 2;


        const aw =
            a.width || 0;


        const ah =
            a.height || 0;


        const bx =
            b.x -
            (b.width || 0) / 2;


        const by =
            b.y -
            (b.height || 0) / 2;


        const bw =
            b.width || 0;


        const bh =
            b.height || 0;


        return (

            ax < bx + bw &&

            ax + aw > bx &&

            ay < by + bh &&

            ay + ah > by

        );

    }


    // ============================================================
    // SMOOTH VALUE
    // ============================================================

    smoothValue(
        current,
        target,
        amount
    ) {

        return (
            current +
            (
                target -
                current
            ) *
            amount
        );

    }


    // ============================================================
    // FPS
    // ============================================================

    updateFPS(timestamp) {

        this.fpsFrames++;


        const elapsed =
            timestamp -
            this.fpsTimer;


        if (
            elapsed >= 1000
        ) {

            const fps =
                Math.round(
                    this.fpsFrames *
                    1000 /
                    elapsed
                );


            if (
                this.fpsCounter
            ) {

                this.fpsCounter.textContent =
                    `${fps} FPS`;

            }


            this.fpsFrames =
                0;

            this.fpsTimer =
                timestamp;

        }

    }


    // ============================================================
    // STATUS
    // ============================================================

    setStatus(message) {

        if (
            this.trackingStatus
        ) {

            this.trackingStatus.textContent =
                message;

        }

    }


    // ============================================================
    // CAMERA ERROR
    // ============================================================

    showCameraError() {

        if (
            !this.cameraMessage
        ) {

            return;

        }


        this.cameraMessage.style.display =
            "flex";


        const heading =
            this.cameraMessage.querySelector(
                "h2"
            );


        const paragraph =
            this.cameraMessage.querySelector(
                "p"
            );


        if (heading) {

            heading.textContent =
                "Camera Access Failed";

        }


        if (paragraph) {

            paragraph.textContent =
                "Allow camera access and try again.";

        }

    }


    // ============================================================
    // RESIZE
    // ============================================================

    resizeCanvas() {

        if (
            !this.canvas
        ) {

            return;

        }


        if (
            this.camera &&
            this.camera.videoWidth > 0 &&
            this.camera.videoHeight > 0
        ) {

            this.canvas.width =
                this.camera.videoWidth;

            this.canvas.height =
                this.camera.videoHeight;

        } else {

            const rect =
                this.canvas.getBoundingClientRect();


            this.canvas.width =
                Math.max(
                    640,
                    Math.floor(
                        rect.width || 960
                    )
                );


            this.canvas.height =
                Math.max(
                    360,
                    Math.floor(
                        rect.height || 540
                    )
                );

        }


        if (
            this.ship
        ) {

            if (
                !this.gameStarted
            ) {

                this.ship.x =
                    this.canvas.width / 2;

                this.ship.y =
                    this.canvas.height * 0.78;

            }

        }

    }


    handleResize() {

        this.resizeCanvas();

    }


    // ============================================================
    // STOP
    // ============================================================

    stop() {

        this.running =
            false;


        if (
            this.animationFrame
        ) {

            cancelAnimationFrame(
                this.animationFrame
            );

            this.animationFrame =
                null;

        }


        if (
            this.cameraStream
        ) {

            this.cameraStream
                .getTracks()
                .forEach(
                    (track) => {

                        track.stop();

                    }
                );


            this.cameraStream =
                null;

        }


        if (
            this.camera
        ) {

            this.camera.srcObject =
                null;

        }

    }

}