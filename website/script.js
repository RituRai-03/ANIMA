// ============================================================
// Procedural Homepage Canvas & Navigation Controller
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------------------------------
    // Background Procedural Starfield & Particle Canvas
    // ------------------------------------------------------------
    const bgCanvas = document.getElementById("bg-canvas");
    if (bgCanvas) {
        const bgCtx = bgCanvas.getContext("2d");
        let stars = [];

        function resizeBg() {
            bgCanvas.width = window.innerWidth;
            bgCanvas.height = window.innerHeight;
            initStars();
        }

        function initStars() {
            stars = [];
            const numStars = Math.floor((window.innerWidth * window.innerHeight) / 12000);
            for (let i = 0; i < numStars; i++) {
                stars.push({
                    x: Math.random() * bgCanvas.width,
                    y: Math.random() * bgCanvas.height,
                    radius: Math.random() * 1.5 + 0.5,
                    alpha: Math.random() * 0.7 + 0.2,
                    speed: Math.random() * 0.15 + 0.05
                });
            }
        }

        function renderBg() {
            bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            stars.forEach(s => {
                s.y -= s.speed;
                if (s.y < 0) s.y = bgCanvas.height;

                bgCtx.beginPath();
                bgCtx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                bgCtx.fillStyle = `rgba(120, 169, 214, ${s.alpha})`;
                bgCtx.fill();
            });
            requestAnimationFrame(renderBg);
        }

        window.addEventListener("resize", resizeBg);
        resizeBg();
        renderBg();
    }

    // ------------------------------------------------------------
    // Procedural Live Card Canvas Previews
    // ------------------------------------------------------------
    let angle = 0;

    function renderPreviews() {
        angle += 0.02;

        // Card 01: Geometric (Rotating 3D Cube Preview)
        const geoC = document.getElementById("preview-geo");
        if (geoC) {
            const ctx = geoC.getContext("2d");
            ctx.clearRect(0, 0, geoC.width, geoC.height);
            const cx = geoC.width / 2;
            const cy = geoC.height / 2;

            ctx.save();
            ctx.strokeStyle = "#78A9D6";
            ctx.lineWidth = 1.8;

            const s = 38;
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
            ctx.restore();
        }

        // Card 02: Superpowers (Pulsing Energy Orb Preview)
        const powC = document.getElementById("preview-powers");
        if (powC) {
            const ctx = powC.getContext("2d");
            ctx.clearRect(0, 0, powC.width, powC.height);
            const cx = powC.width / 2;
            const cy = powC.height / 2;

            ctx.save();
            const r = 32 + Math.sin(angle * 2) * 5;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = "#3B82C4";
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = "#E6EBF0";
            ctx.fill();

            // Particles
            for (let i = 0; i < 4; i++) {
                const a = angle * 2 + (i * Math.PI) / 2;
                const px = cx + (r + 14) * Math.cos(a);
                const py = cy + (r + 14) * Math.sin(a);
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fillStyle = "#78A9D6";
                ctx.fill();
            }
            ctx.restore();
        }

        // Card 03: Games (Mini Arena Dodger Preview)
        const gameC = document.getElementById("preview-games");
        if (gameC) {
            const ctx = gameC.getContext("2d");
            ctx.clearRect(0, 0, gameC.width, gameC.height);
            const cx = gameC.width / 2 + Math.sin(angle) * 30;
            const cy = gameC.height - 35;

            ctx.save();
            // Player ship
            ctx.beginPath();
            ctx.arc(cx, cy, 12, 0, Math.PI * 2);
            ctx.fillStyle = "#78A9D6";
            ctx.fill();

            // Laser shot
            ctx.beginPath();
            ctx.arc(cx, cy - 25 - (angle * 40) % 60, 3, 0, Math.PI * 2);
            ctx.fillStyle = "#00ff66";
            ctx.fill();

            // Obstacle asteroid
            const ax = gameC.width / 2 + Math.cos(angle * 0.8) * 40;
            const ay = 40 + (angle * 20) % 70;
            ctx.beginPath();
            ctx.arc(ax, ay, 10, 0, Math.PI * 2);
            ctx.fillStyle = "#ff4444";
            ctx.fill();
            ctx.restore();
        }

        // Card 04: Music (Reactive Frequency Wave Preview)
        const musC = document.getElementById("preview-music");
        if (musC) {
            const ctx = musC.getContext("2d");
            ctx.clearRect(0, 0, musC.width, musC.height);

            ctx.save();
            ctx.beginPath();
            for (let x = 0; x < musC.width; x += 4) {
                const y = musC.height / 2 + Math.sin(x * 0.04 + angle * 3) * 20 * Math.cos(x * 0.02);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = "#3B82C4";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }

        requestAnimationFrame(renderPreviews);
    }

    renderPreviews();
});