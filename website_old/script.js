"use strict";

/* =========================================================
   HAND-TRACKING AR UI
   OPTIMIZED COSMIC GAME WEBSITE
========================================================= */


/* =========================================================
   1. SCROLL REVEAL
========================================================= */

const revealElements = document.querySelectorAll(
    ".section, .gesture-card, .effect-card, " +
    ".technology-card, .architecture-node, .stat-card"
);

const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;


if (!reducedMotion) {

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

} else {

    revealElements.forEach((element) => {
        element.classList.add("cosmic-visible");
    });

}


/* =========================================================
   2. GESTURE CARD INTERACTION
========================================================= */

const gestureCards = document.querySelectorAll(".gesture-card");

gestureCards.forEach((card) => {

    card.addEventListener("click", () => {

        gestureCards.forEach((item) => {
            item.classList.remove("gesture-selected");
        });

        card.classList.add("gesture-selected");

    });

});


/* =========================================================
   3. SMOOTH NAVIGATION
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
            behavior: reducedMotion ? "auto" : "smooth",
            block: "start"
        });

    });

});


/* =========================================================
   4. SYSTEM STATUS
========================================================= */

const statusDot = document.querySelector(".status-dot");

if (statusDot && !reducedMotion) {

    setInterval(() => {

        statusDot.classList.toggle("status-pulse");

    }, 1500);

}


/* =========================================================
   5. ACTIVE NAVIGATION
========================================================= */

const sections = document.querySelectorAll(
    "main section[id]"
);

const navSectionLinks = document.querySelectorAll(
    '.nav-links a[href^="#"]'
);

if (sections.length > 0) {

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

}


/* =========================================================
   6. LIGHTWEIGHT HERO PARALLAX
========================================================= */

const heroContent = document.querySelector(".hero-content");
const heroVisual = document.querySelector(".hero-visual");

let mouseX = 0;
let mouseY = 0;
let ticking = false;


if (!reducedMotion) {

    document.addEventListener(
        "mousemove",
        (event) => {

            mouseX =
                event.clientX / window.innerWidth - 0.5;

            mouseY =
                event.clientY / window.innerHeight - 0.5;

            if (!ticking) {

                requestAnimationFrame(() => {

                    if (heroContent) {

                        heroContent.style.transform =
                            `translate3d(${mouseX * -4}px, ${mouseY * -3}px, 0)`;

                    }

                    if (heroVisual) {

                        heroVisual.style.transform =
                            `translate3d(${mouseX * 5}px, ${mouseY * 4}px, 0)`;

                    }

                    ticking = false;

                });

                ticking = true;
            }

        },
        {
            passive: true
        }
    );

}


/* =========================================================
   7. HERO VISUAL HOVER
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
   8. PAGE LOAD
========================================================= */

window.addEventListener("load", () => {

    document.body.classList.add("system-loaded");

});


/* =========================================================
   9. ESCAPE = CLEAR GESTURE SELECTION
========================================================= */

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

        gestureCards.forEach((card) => {

            card.classList.remove("gesture-selected");

        });

    }

});

/* =========================================================
   GAME ABILITY LOADOUT
   ========================================================= */

const abilitySystemCards = document.querySelectorAll(".ability-card");
const abilitySystemFooter = document.querySelector(".ability-footer");

abilitySystemCards.forEach((card) => {

    card.addEventListener("click", () => {

        // Remove selection from all abilities
        abilitySystemCards.forEach((item) => {
            item.classList.remove("active");
        });

        // Select clicked ability
        card.classList.add("active");

        // Read selected gesture
        const selectedGesture = card.dataset.gesture || "UNKNOWN";

        // Update system footer
        if (abilitySystemFooter) {
            abilitySystemFooter.innerHTML = `
                <span>ABILITY SELECTED</span>
                <span>◈</span>
                <span>${selectedGesture}</span>
                <span>◈</span>
                <span>AR ENGINE READY</span>
            `;
        }

        // Small console message for testing
        console.log(`AR Ability Selected: ${selectedGesture}`);
    });

});


/* =========================================================
   END
========================================================= */