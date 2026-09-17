// ============================================================
// Fireball System (Ported from effects/fireball.py)
// ============================================================

export class FireballSystem {
    constructor() {
        this.charge = 0.0;
        this.status = "IDLE";
        this.projectiles = [];
        this.lastLaunchTime = 0;
    }

    updateCharge(isHoldingPose, dt = 0.016) {
        if (isHoldingPose) {
            this.charge = Math.min(1.0, this.charge + dt * 1.2);
            this.status = this.charge >= 1.0 ? "READY" : "CHARGING";
        } else {
            if (this.status === "READY" && this.charge >= 0.8) {
                // Request launch trigger!
                this.status = "LAUNCH_REQUESTED";
            } else {
                this.charge = Math.max(0.0, this.charge - dt * 2.0);
                if (this.charge === 0) this.status = "IDLE";
            }
        }
        return { charge: this.charge, status: this.status };
    }

    launch(originX, originY, targetX, targetY, particleSystem, audioManager) {
        const dx = targetX - originX;
        const dy = targetY - originY;
        const dist = Math.hypot(dx, dy) || 1;
        const speed = 22.0;

        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;

        this.projectiles.push({
            x: originX,
            y: originY,
            vx: vx,
            vy: vy,
            life: 30,
            maxLife: 30,
            size: 28
        });

        if (particleSystem) {
            particleSystem.addShockwave(originX, originY, "#ff6600", 110);
            particleSystem.emit(originX, originY, "#ffcc00", 18, 2.5);
        }

        if (audioManager) {
            audioManager.playExplosionSFX();
        }

        this.charge = 0;
        this.status = "IDLE";
    }

    updateAndDraw(ctx, particleSystem, dt = 0.016) {
        const activeProjectiles = [];

        ctx.save();
        this.projectiles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            if (p.life > 0) {
                // Flying fireball core
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = "#ff5500";
                ctx.shadowColor = "#ffcc00";
                ctx.shadowBlur = 20;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = "#ffffff";
                ctx.fill();

                if (particleSystem) {
                    particleSystem.emit(p.x, p.y, "#ff7700", 3, 0.8);
                }

                activeProjectiles.push(p);
            } else {
                // Final explosion burst at end of life
                if (particleSystem) {
                    particleSystem.addShockwave(p.x, p.y, "#ff3300", 90);
                    particleSystem.emit(p.x, p.y, "#ffee00", 25, 3.0);
                }
            }
        });
        ctx.restore();

        this.projectiles = activeProjectiles;
    }
}

export function drawChargingFireball(ctx, cx, cy, charge, isReady, angle) {
    ctx.save();
    const radius = 12 + charge * 30;

    // Outer flame glow
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
    ctx.fillStyle = isReady ? "rgba(255, 200, 0, 0.4)" : "rgba(255, 80, 0, 0.3)";
    ctx.fill();

    // Turbulent flame poly
    const numVerts = 14;
    ctx.beginPath();
    for (let i = 0; i < numVerts; i++) {
        const a = (Math.PI * 2 * i) / numVerts + angle * 0.05;
        const turb = 0.2 * (Math.sin(a * 4 + angle * 0.1) * 0.5 + Math.cos(a * 7 - angle * 0.15) * 0.5);
        const r = Math.max(4, radius * (1.0 + turb));
        const px = cx + r * Math.cos(a);
        const py = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = isReady ? "#ffaa00" : "#ff3300";
    ctx.fill();

    // White hot core
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(3, radius * 0.45), 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Status text
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.fillStyle = isReady ? "#00ff66" : "#ffee00";
    ctx.textAlign = "center";
    const statusText = isReady ? "READY! (RELEASE TO FIRE)" : `CHARGING ${Math.floor(charge * 100)}%`;
    ctx.fillText(statusText, cx, cy - radius - 15);

    ctx.restore();
}
