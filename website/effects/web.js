// ============================================================
// Mystic Web System (Ported from effects/mystic_web.py)
// ============================================================

export function drawWebShooterFlash(ctx, originX, originY, holdTime = 0.0) {
    if (holdTime > 0.3) return;

    const fade = Math.max(0.0, 1.0 - holdTime / 0.3);
    ctx.save();

    // Spikes
    const spikes = 10;
    const spikeLen = 38 * fade;
    for (let i = 0; i < spikes; i++) {
        const a = (Math.PI * 2 * i) / spikes + holdTime * 4.0;
        const ex = originX + Math.cos(a) * spikeLen;
        const ey = originY + Math.sin(a) * spikeLen;

        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = "rgba(0, 240, 255, 0.8)";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Concentric flash rings
    ctx.beginPath();
    ctx.arc(originX, originY, 20 * fade, 0, Math.PI * 2);
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

export function drawWebNetworkMatrix(ctx, centerPt, radius = 120, palmPt = null) {
    const cx = centerPt.x;
    const cy = centerPt.y;

    ctx.save();
    // Elastic web line connecting palm shooter to web center
    if (palmPt) {
        ctx.beginPath();
        ctx.moveTo(palmPt.x, palmPt.y);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = "rgba(220, 235, 255, 0.9)";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(palmPt.x, palmPt.y);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Radial web spokes
    const numSpokes = 8;
    const spokePts = [];
    for (let i = 0; i < numSpokes; i++) {
        const a = (Math.PI * 2 * i) / numSpokes;
        const ex = cx + radius * Math.cos(a);
        const ey = cy + radius * Math.sin(a);
        spokePts.push({ x: ex, y: ey, angle: a });

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = "rgba(200, 220, 255, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Concentric web spiral rings
    const rings = 4;
    for (let r = 1; r <= rings; r++) {
        const rRad = (radius / rings) * r;
        ctx.beginPath();
        for (let i = 0; i <= numSpokes; i++) {
            const idx = i % numSpokes;
            const a = spokePts[idx].angle;
            // Add sagging catenary curve to web strands
            const sag = rRad * 0.9;
            const wx = cx + sag * Math.cos(a);
            const wy = cy + sag * Math.sin(a);
            if (i === 0) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
        }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }

    // Web node dots
    for (let r = 1; r <= rings; r++) {
        const rRad = (radius / rings) * r;
        for (let i = 0; i < numSpokes; i++) {
            const a = spokePts[i].angle;
            const nx = cx + rRad * 0.9 * Math.cos(a);
            const ny = cy + rRad * 0.9 * Math.sin(a);
            ctx.beginPath();
            ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
        }
    }

    ctx.restore();
}
