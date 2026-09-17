const camera = document.getElementById("camera");
const startCamera = document.getElementById("start-camera");
const cameraMessage = document.getElementById("camera-message");
const trackingStatus = document.getElementById("tracking-status");
const arCanvas = document.getElementById("ar-canvas");
const ctx = arCanvas.getContext("2d");

let handLandmarker = null;
let rotationAngle = 0;
let particles = [];

// Color Palette matching Python AR visual theme
const COLOR_CYAN = "#00f0ff";
const COLOR_MAGENTA = "#ff00a0";
const COLOR_NEON_GREEN = "#00ff66";
const COLOR_NEON_BLUE = "#0099ff";
const COLOR_ORANGE = "#ff8c00";
const COLOR_YELLOW = "#ffee00";
const COLOR_RED = "#ff2255";
const COLOR_WHITE = "#ffffff";

// Hand connections for skeleton rendering
const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],         // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],         // Index
    [5, 9], [9, 10], [10, 11], [11, 12],    // Middle
    [9, 13], [13, 14], [14, 15], [15, 16],  // Ring
    [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [0, 17]                                  // Palm base
];

// ============================================================
// MediaPipe Hand Tracking Initialization
// ============================================================

async function initializeHandTracking() {
    try {
        trackingStatus.textContent = "LOADING HAND TRACKING";

        const vision = await import(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm"
        );

        const { HandLandmarker, FilesetResolver } = vision;

        const filesetResolver = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
        );

        handLandmarker = await HandLandmarker.createFromOptions(
            filesetResolver,
            {
                baseOptions: {
                    modelAssetPath:
                        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "GPU"
                },
                numHands: 2,
                minHandDetectionConfidence: 0.65,
                minHandPresenceConfidence: 0.65,
                minTrackingConfidence: 0.65,
                runningMode: "VIDEO"
            }
        );

        trackingStatus.textContent = "HAND TRACKING READY";
        console.log("MediaPipe Hand Landmarker initialized.");

        detectHands();
    } catch (error) {
        console.error("MediaPipe initialization failed:", error);
        trackingStatus.textContent = "TRACKING ERROR";
    }
}

// ============================================================
// Math & Gesture Classifier
// ============================================================

function calculate3DDistance(p1, p2) {
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(
        (p1.x - p2.x) ** 2 +
        (p1.y - p2.y) ** 2 +
        dz ** 2
    );
}

function isFingerExtended(landmarks, tipIdx, pipIdx, mcpIdx, wristIdx = 0) {
    const tip = landmarks[tipIdx];
    const pip = landmarks[pipIdx];
    const mcp = landmarks[mcpIdx];
    const wrist = landmarks[wristIdx];

    const distTipWrist = calculate3DDistance(tip, wrist);
    const distPipWrist = calculate3DDistance(pip, wrist);

    const distTipMcp = calculate3DDistance(tip, mcp);
    const distPipMcp = calculate3DDistance(pip, mcp);

    return distTipWrist > distPipWrist && distTipMcp > distPipMcp;
}

function isThumbExtended(landmarks) {
    const thumbTip = landmarks[4];
    const pinkyMcp = landmarks[17];
    const indexMcp = landmarks[5];
    const wrist = landmarks[0];

    const distToPinky = calculate3DDistance(thumbTip, pinkyMcp);
    const distToIdx = calculate3DDistance(thumbTip, indexMcp);
    const distToWrist = calculate3DDistance(thumbTip, wrist);

    return (
        distToPinky > 0.23 ||
        (distToIdx > 0.14 && distToWrist > 0.20)
    );
}

function classifyHandGesture(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];

    const pinchDist = calculate3DDistance(thumbTip, indexTip);
    if (pinchDist < 0.065) {
        return { gesture: "PINCH", pinchDist };
    }

    const indexExt = isFingerExtended(landmarks, 8, 6, 5);
    const middleExt = isFingerExtended(landmarks, 12, 10, 9);
    const ringExt = isFingerExtended(landmarks, 16, 14, 13);
    const pinkyExt = isFingerExtended(landmarks, 20, 18, 17);
    const thumbExt = isThumbExtended(landmarks);

    const extCount = (indexExt ? 1 : 0) + (middleExt ? 1 : 0) + (ringExt ? 1 : 0) + (pinkyExt ? 1 : 0);

    if (extCount >= 4 || (extCount === 4 && thumbExt)) {
        return { gesture: "OPEN_PALM", pinchDist };
    }

    if (extCount === 0 && !thumbExt) {
        return { gesture: "FIST", pinchDist };
    }

    if (indexExt && !middleExt && !ringExt && !pinkyExt) {
        return { gesture: "POINT", pinchDist };
    }

    if (indexExt && middleExt && !ringExt && !pinkyExt) {
        return { gesture: "PEACE", pinchDist };
    }

    if (indexExt && pinkyExt && !middleExt && !ringExt) {
        return { gesture: "ROCK", pinchDist };
    }

    if (extCount === 0 && thumbExt) {
        const thumbMcp = landmarks[2];
        if (thumbTip.y < thumbMcp.y - 0.04) {
            return { gesture: "THUMBS_UP", pinchDist };
        } else if (thumbTip.y > thumbMcp.y + 0.04) {
            return { gesture: "THUMBS_DOWN", pinchDist };
        }
    }

    return { gesture: "IDLE", pinchDist };
}

function getLandmarkPx(lm, w, h) {
    return {
        x: (1 - lm.x) * w,
        y: lm.y * h
    };
}

function getPalmCenterPx(landmarks, w, h) {
    const wrist = landmarks[0];
    const idxMcp = landmarks[5];
    const pinkyMcp = landmarks[17];

    const cx = ((1 - wrist.x) + (1 - idxMcp.x) + (1 - pinkyMcp.x)) / 3.0 * w;
    const cy = (wrist.y + idxMcp.y + pinkyMcp.y) / 3.0 * h;

    return { x: cx, y: cy };
}

// ============================================================
// Particle System
// ============================================================

function emitParticles(px, py, color, count = 3) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: Math.random() * 0.5 + 0.5,
            color: color
        });
    }
}

function updateAndDrawParticles(ctx) {
    const nextParticles = [];
    particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;

        if (p.life > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(1, p.life * 5), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fill();
            ctx.restore();
            nextParticles.push(p);
        }
    });
    particles = nextParticles;
}

// ============================================================
// Hand Skeleton Renderer
// ============================================================

function drawHandSkeleton(ctx, landmarks, primaryColor, secondaryColor, w, h) {
    const pts = landmarks.map(lm => getLandmarkPx(lm, w, h));

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = primaryColor;
    HAND_CONNECTIONS.forEach(([p1Idx, p2Idx]) => {
        ctx.beginPath();
        ctx.moveTo(pts[p1Idx].x, pts[p1Idx].y);
        ctx.lineTo(pts[p2Idx].x, pts[p2Idx].y);
        ctx.stroke();
    });

    pts.forEach((pt, i) => {
        if ([4, 8, 12, 16, 20].includes(i)) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = secondaryColor;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 9, 0, Math.PI * 2);
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = "#282828";
            ctx.fill();
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });
    ctx.restore();
}

// ============================================================
// 3D Shape & Hologram Renderers (Ported from effects/geometric.py)
// ============================================================

function draw3DCube(ctx, cx, cy, scale, angle, color) {
    const rad = angle * Math.PI / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const cosB = Math.cos(rad * 0.7);
    const sinB = Math.sin(rad * 0.7);

    const s = scale;
    const baseVertices = [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s, s],  [s, -s, s],  [s, s, s],  [-s, s, s]
    ];

    const screenPts = baseVertices.map(([x, y, z]) => {
        const xzX = x * cosA + z * sinA;
        const xzZ = -x * sinA + z * cosA;
        const yzY = y * cosB - xzZ * sinB;
        return { x: cx + xzX, y: cy + yzY };
    });

    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    ctx.save();
    ctx.lineCap = "round";

    // Outer glowing lines
    ctx.lineWidth = 4;
    ctx.strokeStyle = COLOR_WHITE;
    edges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(screenPts[a].x, screenPts[a].y);
        ctx.lineTo(screenPts[b].x, screenPts[b].y);
        ctx.stroke();
    });

    // Color core lines
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    edges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(screenPts[a].x, screenPts[a].y);
        ctx.lineTo(screenPts[b].x, screenPts[b].y);
        ctx.stroke();
    });

    // Vertex dots
    screenPts.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = COLOR_WHITE;
        ctx.fill();
    });
    ctx.restore();
}

function drawCyberShield(ctx, cx, cy, radius, angle, color) {
    ctx.save();

    // Outer main circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Outer white accent ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Inner concentric ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 12 Radiating Ticks
    const numTicks = 12;
    for (let i = 0; i < numTicks; i++) {
        const a = (angle + i * (360 / numTicks)) * Math.PI / 180;
        const x1 = cx + (radius - 5) * Math.cos(a);
        const y1 = cy + (radius - 5) * Math.sin(a);
        const x2 = cx + (radius + 12) * Math.cos(a);
        const y2 = cy + (radius + 12) * Math.sin(a);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = i % 3 === 0 ? COLOR_WHITE : color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Central crosshair
    const l = 15;
    ctx.beginPath();
    ctx.moveTo(cx - l, cy);
    ctx.lineTo(cx + l, cy);
    ctx.moveTo(cx, cy - l);
    ctx.lineTo(cx, cy + l);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
}

function drawEnergyCore(ctx, cx, cy, scale, angle, color) {
    ctx.save();
    const rad = angle * Math.PI / 180;

    for (let ringIdx = 0; ringIdx < 3; ringIdx++) {
        const rAngle = rad + ringIdx * (Math.PI / 3);
        const rx = scale;
        const ry = Math.max(5, scale * Math.abs(Math.sin(rAngle)));

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rAngle);
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    // White core orb
    ctx.beginPath();
    ctx.arc(cx, cy, scale * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_WHITE;
    ctx.fill();

    // Core border
    ctx.beginPath();
    ctx.arc(cx, cy, scale * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    emitParticles(cx, cy, color, 2);
}

function drawPyramidAndLaser(ctx, tipPx, angle, color) {
    const cx = tipPx.x;
    const cy = tipPx.y;
    const rad = angle * Math.PI / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    const s = 35;
    const baseVertices = [
        [-s, s, -s],
        [s, s, -s],
        [s, s, s],
        [-s, s, s],
        [0, -s, 0]
    ];

    const screenPts = baseVertices.map(([x, y, z]) => {
        const rx = x * cosA + z * sinA;
        const ry = y;
        return { x: cx + rx, y: cy + ry };
    });

    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [0, 4], [1, 4], [2, 4], [3, 4]
    ];

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    edges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(screenPts[a].x, screenPts[a].y);
        ctx.lineTo(screenPts[b].x, screenPts[b].y);
        ctx.stroke();
    });

    const apex = screenPts[4];
    const laserEnd = { x: apex.x, y: apex.y - 120 };

    // Laser beam
    ctx.beginPath();
    ctx.moveTo(apex.x, apex.y);
    ctx.lineTo(laserEnd.x, laserEnd.y);
    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(apex.x, apex.y);
    ctx.lineTo(laserEnd.x, laserEnd.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Laser tip orb
    ctx.beginPath();
    ctx.arc(laserEnd.x, laserEnd.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_WHITE;
    ctx.fill();

    ctx.restore();
}

function draw3DStar(ctx, cx, cy, scale, angle, color) {
    const rad = angle * Math.PI / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    const s = scale;
    const verts = [
        [0, -s, 0],
        [0, s, 0],
        [-s, 0, 0],
        [s, 0, 0],
        [0, 0, -s],
        [0, 0, s]
    ];

    const screenPts = verts.map(([x, y, z]) => {
        const rx = x * cosA + z * sinA;
        const ry = y;
        return { x: cx + rx, y: cy + ry };
    });

    const edges = [
        [0, 2], [0, 3], [0, 4], [0, 5],
        [1, 2], [1, 3], [1, 4], [1, 5],
        [2, 4], [4, 3], [3, 5], [5, 2]
    ];

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    edges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(screenPts[a].x, screenPts[a].y);
        ctx.lineTo(screenPts[b].x, screenPts[b].y);
        ctx.stroke();
    });

    screenPts.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = COLOR_WHITE;
        ctx.fill();
    });

    ctx.restore();
}

function drawElectricArcs(ctx, pt1, pt2, color) {
    const dist = Math.hypot(pt1.x - pt2.x, pt1.y - pt2.y);
    const steps = Math.max(5, Math.floor(dist / 15));

    const pts = [pt1];
    for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const lx = pt1.x * (1 - t) + pt2.x * t + (Math.random() * 24 - 12);
        const ly = pt1.y * (1 - t) + pt2.y * t + (Math.random() * 24 - 12);
        pts.push({ x: lx, y: ly });
    }
    pts.push(pt2);

    ctx.save();
    for (let i = 0; i < pts.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
        ctx.strokeStyle = COLOR_WHITE;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    ctx.restore();
}

function drawStatusBadge(ctx, cx, cy, isUp, color) {
    const wBox = 140;
    const hBox = 50;
    const x1 = cx - wBox / 2;
    const y1 = cy - hBox / 2;

    ctx.save();
    // Glass overlay
    ctx.fillStyle = "rgba(10, 15, 22, 0.85)";
    ctx.fillRect(x1, y1, wBox, hBox);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x1, y1, wBox, hBox);

    const label = isUp ? "LIKE [APPROVED]" : "DISLIKE [REJECTED]";
    const arrow = isUp ? "▲" : "▼";

    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.fillStyle = color;
    ctx.fillText(label, x1 + 8, cy + 28);

    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillStyle = COLOR_WHITE;
    ctx.fillText(arrow, x1 + wBox - 20, cy + 29);

    ctx.restore();
}

function drawDualPinchCage(ctx, ptLeft, ptRight, angle, color) {
    const cx = (ptLeft.x + ptRight.x) / 2;
    const cy = (ptLeft.y + ptRight.y) / 2;
    const dist = Math.hypot(ptLeft.x - ptRight.x, ptLeft.y - ptRight.y);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ptLeft.x, ptLeft.y);
    ctx.lineTo(ptRight.x, ptRight.y);
    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ptLeft.x, ptLeft.y);
    ctx.lineTo(ptRight.x, ptRight.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    draw3DCube(ctx, cx, cy, Math.max(25, dist * 0.35), angle, color);

    [ptLeft, ptRight].forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = COLOR_WHITE;
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    ctx.restore();
}

function drawPlasmaTether(ctx, palmLeft, palmRight, angle, color) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(palmLeft.x, palmLeft.y);
    ctx.lineTo(palmRight.x, palmRight.y);
    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(palmLeft.x, palmLeft.y);
    ctx.lineTo(palmRight.x, palmRight.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    const numNodes = 5;
    for (let i = 0; i < numNodes; i++) {
        const t = (i / (numNodes - 1) + angle * 0.01) % 1.0;
        const nx = palmLeft.x * (1 - t) + palmRight.x * t;
        const ny = palmLeft.y * (1 - t) + palmRight.y * t;

        ctx.beginPath();
        ctx.arc(nx, ny, 6, 0, Math.PI * 2);
        ctx.fillStyle = COLOR_WHITE;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(nx, ny, 10, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    drawCyberShield(ctx, palmLeft.x, palmLeft.y, 35, angle, COLOR_CYAN);
    drawCyberShield(ctx, palmRight.x, palmRight.y, 35, -angle, COLOR_MAGENTA);

    ctx.restore();
}

function drawDualReactorCore(ctx, palmLeft, palmRight, angle) {
    const cx = (palmLeft.x + palmRight.x) / 2;
    const cy = (palmLeft.y + palmRight.y) / 2;
    const dist = Math.hypot(palmLeft.x - palmRight.x, palmLeft.y - palmRight.y);
    const scale = Math.max(30, dist * 0.4);

    drawEnergyCore(ctx, cx, cy, scale, angle, COLOR_ORANGE);

    ctx.save();
    ctx.strokeStyle = COLOR_YELLOW;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(palmLeft.x, palmLeft.y);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(palmRight.x, palmRight.y);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    ctx.restore();
}

// ============================================================
// Continuous Hand Detection Loop
// ============================================================

function detectHands() {
    if (!handLandmarker || camera.readyState < 2) {
        requestAnimationFrame(detectHands);
        return;
    }

    if (arCanvas.width !== camera.videoWidth || arCanvas.height !== camera.videoHeight) {
        arCanvas.width = camera.videoWidth;
        arCanvas.height = camera.videoHeight;
    }

    const results = handLandmarker.detectForVideo(camera, performance.now());
    ctx.clearRect(0, 0, arCanvas.width, arCanvas.height);

    rotationAngle = (rotationAngle + 3) % 360;

    const handDataList = [];
    let dualModeStr = "";

    if (results.landmarks && results.landmarks.length > 0) {
        const numDetected = results.landmarks.length;

        for (let i = 0; i < numDetected; i++) {
            const landmarks = results.landmarks[i];
            const handednessCat = results.handedness && results.handedness[i] ? results.handedness[i][0] : null;
            const rawLabel = handednessCat ? handednessCat.category_name : (i === 0 ? "Right" : "Left");
            const label = rawLabel === "Left" ? "Right" : "Left";

            const primaryColor = label === "Left" ? COLOR_CYAN : COLOR_MAGENTA;
            const secondaryColor = label === "Left" ? COLOR_NEON_GREEN : COLOR_YELLOW;

            // Draw Skeleton
            drawHandSkeleton(ctx, landmarks, primaryColor, secondaryColor, arCanvas.width, arCanvas.height);

            // Gesture Classification
            const { gesture, pinchDist } = classifyHandGesture(landmarks);

            const palmPx = getPalmCenterPx(landmarks, arCanvas.width, arCanvas.height);
            const indexTipPx = getLandmarkPx(landmarks[8], arCanvas.width, arCanvas.height);
            const middleTipPx = getLandmarkPx(landmarks[12], arCanvas.width, arCanvas.height);
            const thumbTipPx = getLandmarkPx(landmarks[4], arCanvas.width, arCanvas.height);
            const pinkyTipPx = getLandmarkPx(landmarks[20], arCanvas.width, arCanvas.height);

            emitParticles(indexTipPx.x, indexTipPx.y, secondaryColor, 1);

            handDataList.push({
                index: i,
                label: label,
                gesture: gesture,
                landmarks: landmarks,
                palmPx: palmPx,
                indexTipPx: indexTipPx,
                middleTipPx: middleTipPx,
                thumbTipPx: thumbTipPx,
                pinkyTipPx: pinkyTipPx,
                pinchDist: pinchDist,
                color: primaryColor
            });
        }

        // Dual-Hand Interactivity
        if (handDataList.length === 2) {
            const h1 = handDataList[0];
            const h2 = handDataList[1];
            const g1 = h1.gesture;
            const g2 = h2.gesture;

            if (g1 === "PINCH" && g2 === "PINCH") {
                dualModeStr = "DUAL PINCH CAGE";
                const midPinch1 = {
                    x: (h1.indexTipPx.x + h1.thumbTipPx.x) / 2,
                    y: (h1.indexTipPx.y + h1.thumbTipPx.y) / 2
                };
                const midPinch2 = {
                    x: (h2.indexTipPx.x + h2.thumbTipPx.x) / 2,
                    y: (h2.indexTipPx.y + h2.thumbTipPx.y) / 2
                };
                drawDualPinchCage(ctx, midPinch1, midPinch2, rotationAngle, COLOR_NEON_GREEN);
            } else if (g1 === "OPEN_PALM" && g2 === "OPEN_PALM") {
                dualModeStr = "PLASMA TETHER";
                drawPlasmaTether(ctx, h1.palmPx, h2.palmPx, rotationAngle, COLOR_NEON_BLUE);
            } else if (g1 === "FIST" && g2 === "FIST") {
                dualModeStr = "REACTOR CORE";
                drawDualReactorCore(ctx, h1.palmPx, h2.palmPx, rotationAngle);
            }
        }

        // Single-Hand AR Rendering (skipped if dual mode active)
        if (!dualModeStr) {
            handDataList.forEach(hand => {
                const gesture = hand.gesture;
                const color = hand.color;

                if (gesture === "PINCH") {
                    const midX = (hand.indexTipPx.x + hand.thumbTipPx.x) / 2;
                    const midY = (hand.indexTipPx.y + hand.thumbTipPx.y) / 2;
                    const scale = Math.floor(35 + (0.065 - hand.pinchDist) * 1000);
                    draw3DCube(ctx, midX, midY, scale, rotationAngle, color);
                } else if (gesture === "OPEN_PALM") {
                    drawCyberShield(ctx, hand.palmPx.x, hand.palmPx.y, 65, rotationAngle, color);
                } else if (gesture === "FIST") {
                    drawEnergyCore(ctx, hand.palmPx.x, hand.palmPx.y, 45, rotationAngle, COLOR_ORANGE);
                } else if (gesture === "POINT") {
                    drawPyramidAndLaser(ctx, hand.indexTipPx, rotationAngle, COLOR_YELLOW);
                } else if (gesture === "PEACE") {
                    draw3DStar(ctx, hand.indexTipPx.x, hand.indexTipPx.y - 50, 35, rotationAngle, COLOR_NEON_GREEN);
                } else if (gesture === "ROCK") {
                    drawElectricArcs(ctx, hand.indexTipPx, hand.pinkyTipPx, COLOR_MAGENTA);
                    emitParticles(hand.indexTipPx.x, hand.indexTipPx.y, COLOR_MAGENTA, 3);
                } else if (gesture === "THUMBS_UP" || gesture === "THUMBS_DOWN") {
                    const isUp = gesture === "THUMBS_UP";
                    const bColor = isUp ? COLOR_NEON_GREEN : COLOR_RED;
                    drawStatusBadge(ctx, hand.thumbTipPx.x, hand.thumbTipPx.y - 40, isUp, bColor);
                }
            });
        }

        // Status HUD text
        if (dualModeStr) {
            trackingStatus.textContent = dualModeStr;
        } else if (handDataList.length > 0) {
            const activeGestures = handDataList.map(h => h.gesture).filter(g => g !== "IDLE");
            if (activeGestures.length > 0) {
                trackingStatus.textContent = activeGestures.join(" + ");
            } else {
                trackingStatus.textContent = `${handDataList.length} HAND${handDataList.length > 1 ? "S" : ""} TRACKED`;
            }
        }
    } else {
        trackingStatus.textContent = "NO HAND DETECTED";
    }

    updateAndDrawParticles(ctx);
    requestAnimationFrame(detectHands);
}

// ============================================================
// Webcam Initialization
// ============================================================

async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 960,
                height: 540,
                facingMode: "user"
            },
            audio: false
        });

        camera.srcObject = stream;
        cameraMessage.style.display = "none";
        trackingStatus.textContent = "CAMERA READY";

        if (camera.readyState < 2) {
            await new Promise((resolve) => {
                camera.addEventListener("loadeddata", resolve, { once: true });
            });
        }

        await initializeHandTracking();
    } catch (error) {
        console.error("Camera error:", error);
        trackingStatus.textContent = "CAMERA ERROR";
        cameraMessage.style.display = "flex";
        cameraMessage.querySelector("h2").textContent = "Camera Access Failed";
        cameraMessage.querySelector("p").textContent = "Please allow camera access and try again.";
    }
}

// ============================================================
// Event Listeners
// ============================================================

startCamera.addEventListener("click", startWebcam);