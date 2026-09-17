// ============================================================
// Particle & Shockwave Pool Manager (Clean Lifecycle & Zero Ghosts)
// ============================================================

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.shockwaves = [];
    }

    emit(x, y, color = "#00f0ff", count = 3, speedScale = 1.0) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 3 + 1) * speedScale;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 4 + 2,
                life: 1.0,
                maxLife: Math.random() * 0.4 + 0.4,
                color
            });
        }
    }

    addShockwave(x, y, color = "#ff7700", maxRadius = 80) {
        this.shockwaves.push({
            x,
            y,
            radius: 5,
            maxRadius,
            life: 1.0,
            color
        });
    }

    updateAndDraw(ctx, dt = 0.016, maxCap = 120) {
        // Enforce maximum cap to guarantee smooth 60 FPS
        if (this.particles.length > maxCap) {
            this.particles.splice(0, this.particles.length - maxCap);
        }

        ctx.save();

        // Render & update shockwave expansion rings
        const activeShockwaves = [];
        this.shockwaves.forEach(s => {
            s.radius += (s.maxRadius - s.radius) * 0.15;
            s.life -= dt * 2.5;

            if (s.life > 0 && s.radius < s.maxRadius - 1) {
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                ctx.strokeStyle = s.color;
                ctx.globalAlpha = Math.max(0, s.life);
                ctx.lineWidth = 3;
                ctx.stroke();
                activeShockwaves.push(s);
            }
        });
        this.shockwaves = activeShockwaves;

        // Render & update particles
        const activeParticles = [];
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt / p.maxLife;

            if (p.life > 0) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(1, p.radius * p.life), 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fill();
                activeParticles.push(p);
            }
        });
        this.particles = activeParticles;

        ctx.restore();
    }

    clear() {
        this.particles = [];
        this.shockwaves = [];
    }
}
