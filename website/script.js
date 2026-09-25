// ============================================================
// AR.UI — Procedural Pastel Cosmic Background & Card Previews
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ------------------------------------------------------------
    // 1. Procedural Pastel Cosmic Background (bg-canvas)
    // ------------------------------------------------------------
    const bgCanvas = document.getElementById("bg-canvas");
    if (bgCanvas) {
        const ctx = bgCanvas.getContext("2d");
        let width = bgCanvas.width = window.innerWidth;
        let height = bgCanvas.height = window.innerHeight;

        let mouseX = width / 2;
        let mouseY = height / 2;

        window.addEventListener("mousemove", (e) => {
            if (!prefersReducedMotion) {
                mouseX = e.clientX;
                mouseY = e.clientY;
            }
        });

        function resize() {
            width = bgCanvas.width = window.innerWidth;
            height = bgCanvas.height = window.innerHeight;
            initBackgroundElements();
        }
        window.addEventListener("resize", resize);

        // Background Star/Particle System
        let stars = [];
        let planets = [];
        let bubbles = [];
        let comets = [];

        const pastelStarColors = [
            "rgba(167, 139, 250, ",  // Lavender
            "rgba(244, 114, 182, ",  // Pink
            "rgba(56, 189, 248, ",   // Sky Blue
            "rgba(52, 211, 153, ",   // Mint
            "rgba(251, 146, 60, "    // Peach
        ];

        function initBackgroundElements() {
            // Stars
            stars = [];
            const numStars = Math.floor((width * height) / 9000);
            for (let i = 0; i < numStars; i++) {
                stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: Math.random() * 2 + 0.8,
                    color: pastelStarColors[Math.floor(Math.random() * pastelStarColors.length)],
                    alpha: Math.random() * 0.7 + 0.3,
                    twinkleSpeed: Math.random() * 0.03 + 0.005,
                    driftSpeed: Math.random() * 0.15 + 0.05,
                    isSparkle: Math.random() < 0.25
                });
            }

            // Planets
            planets = [
                {
                    x: width * 0.12,
                    y: height * 0.22,
                    radius: 36,
                    color1: "#E8DFF5",
                    color2: "#C4B5FD",
                    ring: true,
                    ringColor: "rgba(167, 139, 250, 0.4)",
                    floatOffset: 0,
                    floatSpeed: 0.012,
                    moon: { r: 6, dist: 58, speed: 0.015, angle: 0 }
                },
                {
                    x: width * 0.88,
                    y: height * 0.35,
                    radius: 48,
                    color1: "#FDE2E4",
                    color2: "#F472B6",
                    ring: true,
                    ringColor: "rgba(244, 114, 182, 0.35)",
                    floatOffset: Math.PI,
                    floatSpeed: 0.009,
                    moon: { r: 8, dist: 72, speed: -0.01, angle: Math.PI / 2 }
                },
                {
                    x: width * 0.78,
                    y: height * 0.82,
                    radius: 28,
                    color1: "#E8F5E9",
                    color2: "#34D399",
                    ring: false,
                    floatOffset: Math.PI / 2,
                    floatSpeed: 0.015,
                    moon: null
                }
            ];

            // Bubbles
            bubbles = [];
            for (let i = 0; i < 15; i++) {
                bubbles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: Math.random() * 12 + 6,
                    vy: Math.random() * 0.4 + 0.2,
                    alpha: Math.random() * 0.3 + 0.15,
                    color: pastelStarColors[Math.floor(Math.random() * pastelStarColors.length)]
                });
            }

            // Comets
            comets = [];
            for (let i = 0; i < 2; i++) {
                resetComet(i);
            }
        }

        function resetComet(index) {
            comets[index] = {
                x: Math.random() * width * 0.8,
                y: -50,
                length: Math.random() * 80 + 40,
                speed: Math.random() * 3 + 2,
                color: pastelStarColors[Math.floor(Math.random() * pastelStarColors.length)],
                alpha: Math.random() * 0.6 + 0.3,
                delay: Math.random() * 300
            };
        }

        function drawSparkle(x, y, radius, opacity, colorPrefix) {
            ctx.save();
            ctx.translate(x, y);
            ctx.fillStyle = colorPrefix + opacity + ")";

            // 4-Point Star Burst
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                ctx.rotate(Math.PI / 2);
                ctx.lineTo(0, -radius * 2.5);
                ctx.lineTo(radius * 0.5, -radius * 0.5);
            }
            ctx.fill();
            ctx.restore();
        }

        function renderBackground() {
            ctx.clearRect(0, 0, width, height);

            // Parallax Shift
            const px = (mouseX - width / 2) * 0.015;
            const py = (mouseY - height / 2) * 0.015;

            // 1. Draw Stars
            stars.forEach((s) => {
                if (!prefersReducedMotion) {
                    s.y -= s.driftSpeed;
                    if (s.y < 0) s.y = height;
                    s.alpha += Math.sin(Date.now() * s.twinkleSpeed) * 0.01;
                    s.alpha = Math.max(0.15, Math.min(0.85, s.alpha));
                }

                const sx = s.x + px;
                const sy = s.y + py;

                if (s.isSparkle) {
                    drawSparkle(sx, sy, s.size, s.alpha, s.color);
                } else {
                    ctx.beginPath();
                    ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
                    ctx.fillStyle = s.color + s.alpha + ")";
                    ctx.fill();
                }
            });

            // 2. Draw Bubbles
            bubbles.forEach((b) => {
                if (!prefersReducedMotion) {
                    b.y -= b.vy;
                    if (b.y < -30) b.y = height + 30;
                }
                const bx = b.x + px * 0.5;
                const by = b.y + py * 0.5;

                ctx.save();
                ctx.beginPath();
                ctx.arc(bx, by, b.radius, 0, Math.PI * 2);
                ctx.strokeStyle = b.color + b.alpha + ")";
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.fillStyle = b.color + (b.alpha * 0.3) + ")";
                ctx.fill();
                ctx.restore();
            });

            // 3. Draw Planets & Moons
            planets.forEach((p) => {
                if (!prefersReducedMotion) {
                    p.floatOffset += p.floatSpeed;
                }
                const floatY = Math.sin(p.floatOffset) * 12;
                const planetX = p.x + px * 0.8;
                const planetY = p.y + floatY + py * 0.8;

                // Planet Body
                ctx.save();
                const grad = ctx.createRadialGradient(
                    planetX - p.radius * 0.3,
                    planetY - p.radius * 0.3,
                    p.radius * 0.1,
                    planetX,
                    planetY,
                    p.radius
                );
                grad.addColorStop(0, p.color1);
                grad.addColorStop(1, p.color2);

                ctx.beginPath();
                ctx.arc(planetX, planetY, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.shadowColor = p.color2;
                ctx.shadowBlur = 15;
                ctx.fill();

                // Planet Ring
                if (p.ring) {
                    ctx.beginPath();
                    ctx.ellipse(planetX, planetY, p.radius * 1.7, p.radius * 0.45, -Math.PI / 8, 0, Math.PI * 2);
                    ctx.strokeStyle = p.ringColor;
                    ctx.lineWidth = 4;
                    ctx.stroke();
                }
                ctx.restore();

                // Moon
                if (p.moon) {
                    if (!prefersReducedMotion) {
                        p.moon.angle += p.moon.speed;
                    }
                    const moonX = planetX + Math.cos(p.moon.angle) * p.moon.dist;
                    const moonY = planetY + Math.sin(p.moon.angle) * (p.moon.dist * 0.4);

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(moonX, moonY, p.moon.r, 0, Math.PI * 2);
                    ctx.fillStyle = "#FFFDF7";
                    ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
                    ctx.shadowBlur = 8;
                    ctx.fill();
                    ctx.restore();
                }
            });

            // 4. Draw Comets
            comets.forEach((c, i) => {
                if (c.delay > 0) {
                    c.delay--;
                    return;
                }
                if (!prefersReducedMotion) {
                    c.x += c.speed;
                    c.y += c.speed * 0.7;
                    if (c.x > width || c.y > height) {
                        resetComet(i);
                    }
                }

                ctx.save();
                const grad = ctx.createLinearGradient(c.x, c.y, c.x - c.length, c.y - c.length * 0.7);
                grad.addColorStop(0, c.color + c.alpha + ")");
                grad.addColorStop(1, c.color + "0)");

                ctx.beginPath();
                ctx.moveTo(c.x, c.y);
                ctx.lineTo(c.x - c.length, c.y - c.length * 0.7);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 2.5;
                ctx.lineCap = "round";
                ctx.stroke();
                ctx.restore();
            });

            requestAnimationFrame(renderBackground);
        }

        initBackgroundElements();
        renderBackground();
    }

    // ------------------------------------------------------------
    // 2. Procedural Live Card Previews in Pastel Theme
    // ------------------------------------------------------------
    let angle = 0;

    function renderPreviews() {
        if (!prefersReducedMotion) {
            angle += 0.02;
        }

        // Card 01: Geometric (Pastel 3D Wireframe Cube)
        const geoC = document.getElementById("preview-geo");
        if (geoC) {
            const ctx = geoC.getContext("2d");
            ctx.clearRect(0, 0, geoC.width, geoC.height);
            const cx = geoC.width / 2;
            const cy = geoC.height / 2;

            ctx.save();
            ctx.strokeStyle = "#8B5CF6";
            ctx.lineWidth = 2;

            const s = 36;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);

            const verts = [
                [-s,-s,-s],[s,-s,-s],[s,s,-s],[-s,s,-s],
                [-s,-s,s],[s,-s,s],[s,s,s],[-s,s,s]
            ].map(([x,y,z]) => ({
                x: cx + (x * cosA + z * sinA),
                y: cy + y
            }));

            const edges = [
                [0,1],[1,2],[2,3],[3,0],
                [4,5],[5,6],[6,7],[7,4],
                [0,4],[1,5],[2,6],[3,7]
            ];

            edges.forEach(([a,b]) => {
                ctx.beginPath();
                ctx.moveTo(verts[a].x, verts[a].y);
                ctx.lineTo(verts[b].x, verts[b].y);
                ctx.stroke();
            });

            // Cute center pastel core
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#EC4899";
            ctx.fill();
            ctx.restore();
        }

        // Card 02: Superpowers (Soft Pink & Mint Energy Orb)
        const powC = document.getElementById("preview-powers");
        if (powC) {
            const ctx = powC.getContext("2d");
            ctx.clearRect(0, 0, powC.width, powC.height);
            const cx = powC.width / 2;
            const cy = powC.height / 2;

            ctx.save();
            const r = 30 + Math.sin(angle * 2.5) * 6;

            // Outer Aura
            ctx.beginPath();
            ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(244, 114, 182, 0.25)";
            ctx.fill();

            // Core Orb
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = "#EC4899";
            ctx.fill();

            // Inner Sparkle Core
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFDF7";
            ctx.fill();

            // Orbiting Magic Particles
            for (let i = 0; i < 5; i++) {
                const a = angle * 2 + (i * Math.PI * 2) / 5;
                const px = cx + (r + 16) * Math.cos(a);
                const py = cy + (r + 16) * Math.sin(a);
                ctx.beginPath();
                ctx.arc(px, py, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = "#34D399";
                ctx.fill();
            }
            ctx.restore();
        }

        // Card 03: Games (Cute Pastel Dodge Ship)
        const gameC = document.getElementById("preview-games");
        if (gameC) {
            const ctx = gameC.getContext("2d");
            ctx.clearRect(0, 0, gameC.width, gameC.height);
            const cx = gameC.width / 2 + Math.sin(angle * 1.5) * 35;
            const cy = gameC.height - 35;

            ctx.save();
            // Player Ship (Pastel Triangle)
            ctx.beginPath();
            ctx.moveTo(cx, cy - 15);
            ctx.lineTo(cx - 14, cy + 12);
            ctx.lineTo(cx + 14, cy + 12);
            ctx.closePath();
            ctx.fillStyle = "#38BDF8";
            ctx.fill();

            // Laser Beam
            const laserY = cy - 25 - ((angle * 45) % 65);
            ctx.beginPath();
            ctx.arc(cx, laserY, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = "#34D399";
            ctx.fill();

            // Coral Asteroid
            const ax = gameC.width / 2 + Math.cos(angle * 0.9) * 45;
            const ay = 35 + ((angle * 22) % 75);
            ctx.beginPath();
            ctx.arc(ax, ay, 11, 0, Math.PI * 2);
            ctx.fillStyle = "#FB923C";
            ctx.fill();
            ctx.restore();
        }

        // Card 04: Music (Pastel Synth Waveform)
        const musC = document.getElementById("preview-music");
        if (musC) {
            const ctx = musC.getContext("2d");
            ctx.clearRect(0, 0, musC.width, musC.height);

            ctx.save();
            ctx.beginPath();
            for (let x = 0; x < musC.width; x += 4) {
                const y = musC.height / 2 + Math.sin(x * 0.045 + angle * 3.5) * 22 * Math.cos(x * 0.02);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = "#A78BFA";
            ctx.lineWidth = 3;
            ctx.stroke();

            // Bouncing Note Points
            for (let i = 1; i <= 3; i++) {
                const nx = (musC.width / 4) * i;
                const ny = musC.height / 2 + Math.sin(nx * 0.045 + angle * 3.5) * 22 * Math.cos(nx * 0.02);
                ctx.beginPath();
                ctx.arc(nx, ny, 5, 0, Math.PI * 2);
                ctx.fillStyle = "#EC4899";
                ctx.fill();
            }
            ctx.restore();
        }

        requestAnimationFrame(renderPreviews);
    }

    renderPreviews();
});

// ------------------------------------------------------------
// WORLD ENTRY TRANSITION
// ------------------------------------------------------------

document.querySelectorAll('a[href*=".html"]').forEach((link) => {
    const href = link.getAttribute("href");

    // Only apply to world-entry links
    if (
        !href ||
        (!href.includes("geometric.html") &&
         !href.includes("superpowers.html") &&
         !href.includes("games.html") &&
         !href.includes("music.html"))
    ) {
        return;
    }

    link.addEventListener("click", (event) => {
        event.preventDefault();

        const destination = href;

        link.classList.add("world-enter-active");

        document.body.classList.add("world-transitioning");

        setTimeout(() => {
            window.location.href = destination;
        }, 500);
    });
});

// =========================================================
// MAIN "EXPLORE WORLDS" TRANSITION
// =========================================================

const exploreWorldsButton =
    document.querySelector("#explore-worlds");

const worldsSection =
    document.querySelector("#modes");

const worldCards =
    document.querySelectorAll(".world-card");

if (exploreWorldsButton && worldsSection) {

    exploreWorldsButton.addEventListener("click", (event) => {

        event.preventDefault();

        // Smoothly move to the worlds section
        worldsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        // Reveal cards after scrolling starts
        setTimeout(() => {

            worldCards.forEach((card) => {
                card.classList.add("world-card-visible");
            });

        }, 300);
    });
}

