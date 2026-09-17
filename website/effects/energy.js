// ============================================================
// Energy Effects (Plasma Beam & Mystic Portal Rings)
// ============================================================

import { drawCyberShield } from "./geometric.js";

export function drawPlasmaBeam(ctx, palmLeft, palmRight, angle, color = "#0099ff") {
    ctx.save();

    // Main energy beam
    ctx.beginPath();
    ctx.moveTo(palmLeft.x, palmLeft.y);
    ctx.lineTo(palmRight.x, palmRight.y);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(palmLeft.x, palmLeft.y);
    ctx.lineTo(palmRight.x, palmRight.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Traveling energy nodes
    const numNodes = 6;
    for (let i = 0; i < numNodes; i++) {
        const t = (i / (numNodes - 1) + angle * 0.015) % 1.0;
        const nx = palmLeft.x * (1 - t) + palmRight.x * t;
        const ny = palmLeft.y * (1 - t) + palmRight.y * t;

        ctx.beginPath();
        ctx.arc(nx, ny, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(nx, ny, 11, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    ctx.restore();
}

export function drawMysticPortal(ctx, centerPt, radius = 90, angle = 0) {
    const cx = centerPt.x;
    const cy = centerPt.y;

    ctx.save();
    ctx.translate(cx, cy);

    // Rotating outer portal ring
    const numSparks = 20;
    for (let i = 0; i < numSparks; i++) {
        const a = (Math.PI * 2 * i) / numSparks + (angle * Math.PI) / 180;
        const px = (radius + Math.sin(a * 5) * 6) * Math.cos(a);
        const py = (radius + Math.sin(a * 5) * 6) * Math.sin(a);

        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? "#ff6600" : "#ffee00";
        ctx.shadowColor = "#ffaa00";
        ctx.shadowBlur = 10;
        ctx.fill();
    }

    // Portal inner vortex gradient
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, radius);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    grad.addColorStop(0.3, "rgba(255, 140, 0, 0.6)");
    grad.addColorStop(0.8, "rgba(200, 40, 0, 0.3)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Outer spinning dashed ring
    ctx.rotate((angle * Math.PI) / 180);
    ctx.beginPath();
    ctx.arc(0, 0, radius + 12, 0, Math.PI * 2);
    ctx.strokeStyle = "#ff9900";
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.stroke();

    ctx.restore();
}
