/* =========================================================
   HAND-TRACKING AR UI
   COSMIC GAME WEBSITE
   Ritu Rai
========================================================= */

"use strict";


/* =========================================================
   1. COSMIC CURSOR GLOW
========================================================= */

const cursorGlow = document.createElement("div");

cursorGlow.className = "cursor-glow";

document.body.appendChild(cursorGlow);

let mouseX = 0;
let mouseY = 0;
let glowX = 0;
let glowY = 0;

document.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

function animateCursorGlow() {
    glowX += (mouseX - glowX) * 0.12;
    glowY += (mouseY - glowY) * 0.12;

    cursorGlow.style.transform =
        `translate3d(${glowX}px, ${glowY}px, 0)`;

    requestAnimationFrame(animateCursorGlow);
}

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    animateCursorGlow();
}


/* =========================================================
   2. HERO PARALLAX
========================================================= */

const hero = document.querySelector(".hero");
const heroContent = document.querySelector(".hero-content");
const heroVisual = document.querySelector(".hero-visual");

document.addEventListener("mousemove", (event) => {

    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    const x = (event.clientX / window.innerWidth - 0.5);
    const y = (event.clientY / window.innerHeight - 0.5);

    if (heroContent) {
        heroContent.style.transform =
            `translate3d(${x * -8}px, ${y * -5}px, 0)`;
    }

    if (heroVisual) {
        heroVisual.style.transform =
            `translate3d(${x * 10}px, ${y * 7}px, 0)`;
    }
});


/* =========================================================
   3. SCROLL REVEAL
========================================================= */

const revealElements = document.querySelectorAll(
    ".section, .gesture-card, .effect-card, " +
    ".technology-card, .architecture-node, .stat-card"
);

const revealObserver = new IntersectionObserver(
    (entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("cosmic-visible");
                entry.target.classList.remove("cosmic-hidden");

                revealObserver.unobserve(entry.target);
            }

        });

    },
    {
        threshold: 0.12
    }
);


revealElements.forEach((element) => {

    element.classList.add("cosmic-hidden");

    revealObserver.observe(element);

});


/* =========================================================
   4. GESTURE CARD INTERACTION
========================================================= */

const gestureCards = document.querySelectorAll(".gesture-card");

gestureCards.forEach((card) => {

    card.addEventListener("click", () => {

        gestureCards.forEach((item) => {
            item.classList.remove("gesture-selected");
        });

        card.classList.add("gesture-selected");

        const title = card.querySelector("h3");

        if (title) {
            console.log(
                "Selected Gesture:",
                title.textContent.trim()
            );
        }

    });

});


/* =========================================================
   5. SMOOTH NAVIGATION
========================================================= */

const navigationLinks = document.querySelectorAll(
    'a[href^="#"]'
);

navigationLinks.forEach((link) => {

    link.addEventListener("click", (event) => {

        const targetId = link.getAttribute("href");

        if (!targetId || targetId === "#") {
            return;
        }

        const target = document.querySelector(targetId);

        if (!target) {
            return;
        }

        event.preventDefault();

        target.scrollIntoView({
            behavior: window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
                ? "auto"
                : "smooth",
            block: "start"
        });

    });

});


/* =========================================================
   6. SYSTEM STATUS
========================================================= */

const statusDot = document.querySelector(".status-dot");

if (statusDot) {

    setInterval(() => {

        statusDot.classList.toggle("status-pulse");

    }, 1200);

}


/* =========================================================
   7. ACTIVE NAVIGATION
========================================================= */

const sections = document.querySelectorAll(
    "main section[id]"
);

const navSectionLinks = document.querySelectorAll(
    '.nav-links a[href^="#"]'
);

const activeSectionObserver = new IntersectionObserver(
    (entries) => {

        entries.forEach((entry) => {

            if (!entry.isIntersecting) {
                return;
            }

            const id = entry.target.getAttribute("id");

            navSectionLinks.forEach((link) => {

                link.classList.remove("nav-active");

                if (link.getAttribute("href") === `#${id}`) {
                    link.classList.add("nav-active");
                }

            });

        });

    },
    {
        threshold: 0.35
    }
);


sections.forEach((section) => {
    activeSectionObserver.observe(section);
});


/* =========================================================
   8. COSMIC PARTICLE MOVEMENT
========================================================= */

const cosmicParticles = document.querySelectorAll(
    ".cosmic-particles span"
);

document.addEventListener("mousemove", (event) => {

    if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
        return;
    }

    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;

    cosmicParticles.forEach((particle, index) => {

        const strength = 5 + (index % 4) * 3;

        particle.style.marginLeft =
            `${x * strength}px`;

        particle.style.marginTop =
            `${y * strength}px`;

    });

});


/* =========================================================
   9. MYSTIC SYMBOL PARALLAX
========================================================= */

const energySymbols = document.querySelectorAll(
    ".energy-symbols span"
);

document.addEventListener("mousemove", (event) => {

    if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
        return;
    }

    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;

    energySymbols.forEach((symbol, index) => {

        const strength = 8 + (index % 3) * 5;

        symbol.style.translate =
            `${x * strength}px ${y * strength}px`;

    });

});


/* =========================================================
   10. HERO VISUAL HOVER
========================================================= */

if (heroVisual) {

    heroVisual.addEventListener("mouseenter", () => {
        heroVisual.classList.add("hero-visual-active");
    });

    heroVisual.addEventListener("mouseleave", () => {
        heroVisual.classList.remove("hero-visual-active");
    });

}


/* =========================================================
   11. BUTTON INTERACTION
========================================================= */

const buttons = document.querySelectorAll(".btn");

buttons.forEach((button) => {

    button.addEventListener("mouseenter", () => {

        button.classList.add("btn-energy");

    });

    button.addEventListener("mouseleave", () => {

        button.classList.remove("btn-energy");

    });

});


/* =========================================================
   12. PAGE LOAD SYSTEM ACTIVATION
========================================================= */

window.addEventListener("load", () => {

    document.body.classList.add("system-loaded");

});


/* =========================================================
   13. KEYBOARD ACCESSIBILITY
========================================================= */

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

        gestureCards.forEach((card) => {
            card.classList.remove("gesture-selected");
        });

    }

});


/* =========================================================
   END
========================================================= */