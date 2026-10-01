// ==========================================
// CHARLIE BLASINGAME — CMS STORY LOADER
// ==========================================

const storiesGrid = document.getElementById("stories-grid");

async function loadStories() {
    try {
        const response = await fetch("content/stories.json");

        if (!response.ok) {
            throw new Error(`Could not load stories: ${response.status}`);
        }

        const stories = await response.json();

        stories.forEach((story) => {
            const card = document.createElement("article");
            card.classList.add("story-card");

            card.innerHTML = `
                <img
                    src="${story.imageURL}"
                    alt="${story.title}"
                    class="story-image"
                >

                <div class="story-card-content">
                    <div class="story-meta">
                        <span class="pub-tag">${story.publication}</span>
                        <span class="year-tag">${story.year}</span>
                    </div>

                    <h3>${story.title}</h3>

                    <span class="view-story">
                        View Story →
                    </span>
                </div>
            `;

            storiesGrid.appendChild(card);

            card.addEventListener("click", () => {
                document.getElementById("modal-image").src = story.imageURL;
                document.getElementById("modal-image").alt = story.title;
                document.getElementById("modal-publication").innerText = story.publication;
                document.getElementById("modal-year").innerText = story.year;
                document.getElementById("modal-title").innerText = story.title;
                document.getElementById("modal-overview").innerHTML =
                    markdownToHTML(story.overview);
                document.getElementById("modal-link").href = story.articleLink || "#";
                document.getElementById("story-modal").style.display = "flex";
                document.body.classList.add("modal-open");
            });
        });

    } catch (error) {
        console.error("Error loading stories:", error);
        storiesGrid.innerHTML =
            "<p>Stories could not be loaded. Please refresh the page.</p>";
    }
}

// Small Markdown converter for the formatting used by the CMS.
function markdownToHTML(markdown) {
    if (!markdown) return "";

    return markdown
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/\n\n/g, "<br><br>")
        .replace(/\n/g, "<br>");
}

loadStories();


// ==========================================
// MODAL
// ==========================================

const modal = document.getElementById("story-modal");
const closeModalBtn = document.getElementById("close-modal");

closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
});

window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
        document.body.classList.remove("modal-open");
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.style.display === "flex") {
        modal.style.display = "none";
        document.body.classList.remove("modal-open");
    }
});


// ==========================================
// SMOOTH SCROLLING
// ==========================================

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (event) {
        const targetID = this.getAttribute("href");

        if (targetID === "#") {
            return;
        }

        const target = document.querySelector(targetID);

        if (target) {
            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});
