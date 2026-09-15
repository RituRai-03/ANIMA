document.addEventListener("DOMContentLoaded", () => {

    const buttons = document.querySelectorAll(".mode-btn");

    buttons.forEach((button) => {

        button.addEventListener("click", () => {

            const card = button.closest(".mode-card");

            if (!card) return;

            const title = card.querySelector("h3");

            if (!title) return;

            if (title.textContent.trim() === "Geometric Shapes") {
                window.location.href = "geometric.html";
            }

        });

    });

});