// ============================================================
// Geometric World Renderers (Ported from effects/geometric.py)
// ============================================================

import { getLandmarkPx } from "../tracking/gestureDetector.js";

const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],         // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],         // Index
    [5, 9], [9, 10], [10, 11], [11, 12],    // Middle
    [9, 13], [13, 14], [14, 15], [15, 16],  // Ring
    [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [0, 17]                                  // Palm base
];

export function drawHandSkeleton(ctx, landmarks, primaryColor, secondaryColor, w, h) {
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

export function draw3DCube(ctx, cx, cy, scale, angle, color = "#00f0ff") {
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

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffffff";
    edges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(screenPts[a].x, screenPts[a].y);
        ctx.lineTo(screenPts[b].x, screenPts[b].y);
        ctx.stroke();
    });

    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    edges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(screenPts[a].x, screenPts[a].y);
        ctx.lineTo(screenPts[b].x, screenPts[b].y);
        ctx.stroke();
    });

    screenPts.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    });
    ctx.restore();
}

export function drawCyberShield(ctx, cx, cy, radius, angle, color = "#00f0ff") {
    ctx.save();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

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
        ctx.strokeStyle = i % 3 === 0 ? "#ffffff" : color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

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

export function drawEnergyCore(ctx, cx, cy, scale, angle, color = "#ff8c00", particleSystem = null) {
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

    ctx.beginPath();
    ctx.arc(cx, cy, scale * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, scale * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    if (particleSystem) {
        particleSystem.emit(cx, cy, color, 2);
    }
}

export function drawPyramidAndLaser(ctx, tipPx, angle, color = "#ffee00") {
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

    ctx.beginPath();
    ctx.moveTo(apex.x, apex.y);
    ctx.lineTo(laserEnd.x, laserEnd.y);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(apex.x, apex.y);
    ctx.lineTo(laserEnd.x, laserEnd.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(laserEnd.x, laserEnd.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.restore();
}

export function draw3DStar(ctx, cx, cy, scale, angle, color = "#00ff66") {
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
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    });

    ctx.restore();
}

export function drawElectricArcs(ctx, pt1, pt2, color = "#ff00a0") {
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
        ctx.strokeStyle = "#ffffff";
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

export function drawStatusBadge(ctx, cx, cy, isUp, color = "#00ff66") {
    const wBox = 140;
    const hBox = 50;
    const x1 = cx - wBox / 2;
    const y1 = cy - hBox / 2;

    ctx.save();
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
    ctx.fillStyle = "#ffffff";
    ctx.fillText(arrow, x1 + wBox - 20, cy + 29);

    ctx.restore();
}

export function drawDualPinchCage(ctx, ptLeft, ptRight, angle, color = "#00ff66") {
    const cx = (ptLeft.x + ptRight.x) / 2;
    const cy = (ptLeft.y + ptRight.y) / 2;
    const dist = Math.hypot(ptLeft.x - ptRight.x, ptLeft.y - ptRight.y);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ptLeft.x, ptLeft.y);
    ctx.lineTo(ptRight.x, ptRight.y);
    ctx.strokeStyle = "#ffffff";
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
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    ctx.restore();
}
