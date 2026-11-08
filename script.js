const storiesGrid = document.getElementById("stories-grid");
const collectedSection = document.getElementById("collected-stories");
const collectedGrid = document.getElementById("collected-stories-grid");
const collectedNavLink = document.getElementById("collected-nav-link");
const modal = document.getElementById("story-modal");
const closeModalBtn = document.getElementById("close-modal");

// Convert CMS image paths into paths that work on GitHub Pages.
function normaliseImagePath(path) {
    if (!path) return "";

    // Keep full external image URLs unchanged.
    if (/^https?:\/\//i.test(path)) return path;

    // Remove the leading slash from paths such as /images/profile.jpg.
    return path.replace(/^\/+/, "");
}

// Convert basic Markdown from the CMS into HTML.
function markdownToHTML(markdown) {
    if (!markdown) return "";

    let escaped = String(markdown)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Support Markdown links, allowing only HTTP and HTTPS links.
    escaped = escaped.replace(
        /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    return escaped
        .replace(/^### (.*)$/gm, "<h3>$1</h3>")
        .replace(/^## (.*)$/gm, "<h2>$1</h2>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/^- (.*)$/gm, "<li>$1</li>")
        .replace(/(<li>.*<\/li>\n?)+/g, (list) => `<ul>${list}</ul>`)
        .split(/\n\s*\n/)
        .map((part) => {
            part = part.trim();

            if (!part) return "";

            if (
                part.startsWith("<h") ||
                part.startsWith("<ul>")
            ) {
                return part;
            }

            return `<p>${part.replace(/\n/g, "<br>")}</p>`;
        })
        .join("");
}

// Load the About section from the CMS.
async function loadAbout() {
    const biography = document.getElementById("bio-content");
    const profileImage = document.getElementById("profile-img");

    try {
        const response = await fetch("content/about.json");

        if (!response.ok) {
            throw new Error(`Could not load About content (${response.status})`);
        }

        const aboutData = await response.json();

        // Update the biography if the CMS contains one.
        if (biography && aboutData.biography) {
            biography.innerHTML = markdownToHTML(aboutData.biography);
        }

        // Update the profile image if one has been selected in the CMS.
        if (profileImage && aboutData.profileImage) {
            profileImage.src = normaliseImagePath(aboutData.profileImage);
        }

    } catch (error) {
        // Keep the original HTML biography as a fallback.
        console.error("Error loading About content:", error);
    }
}

function openStory(story) {
    document.getElementById("modal-image").src = normaliseImagePath(story.imageURL || "");
    document.getElementById("modal-image").alt = story.title || "";
    document.getElementById("modal-publication").textContent = story.publication || "";
    document.getElementById("modal-year").textContent = story.year || "";
    document.getElementById("modal-title").textContent = story.title || "";
    document.getElementById("modal-overview").innerHTML = markdownToHTML(story.overview || "");

    const articleLink = document.getElementById("modal-link");

    articleLink.href = story.articleLink || "#";
    articleLink.hidden = !story.articleLink || story.articleLink === "#";

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    closeModalBtn.focus();
}

function closeStoryModal() {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

function createStoryCard(story, extraText = "") {
    const card = document.createElement("button");

    card.type = "button";
    card.className = "story-card";
    card.setAttribute("aria-label", `View details for ${story.title || "story"}`);

    const image = document.createElement("img");

    image.className = "story-image";
    image.src = normaliseImagePath(story.imageURL || "");
    image.alt = story.title || "";
    image.loading = "lazy";

    image.addEventListener("error", () => {
        image.style.display = "none";
    }, { once: true });

    const content = document.createElement("div");
    content.className = "story-card-content";

    const meta = document.createElement("div");
    meta.className = "story-meta";

    const publication = document.createElement("span");
    publication.textContent = story.publication || "";

    const year = document.createElement("span");
    year.textContent = story.year || "";

    meta.append(publication, year);

    const heading = document.createElement("h3");
    heading.textContent = story.title || "Untitled story";

    content.append(meta, heading);

    if (extraText) {
        const reason = document.createElement("p");

        reason.className = "collected-reason";
        reason.textContent = extraText;

        content.append(reason);
    }

    const view = document.createElement("span");

    view.className = "view-story";
    view.textContent = "View Story →";

    content.append(view);
    card.append(image, content);

    card.addEventListener("click", () => openStory(story));

    return card;
}

async function loadStories() {
    if (!storiesGrid) return;

    try {
        const [storiesResponse, collectedResponse] = await Promise.all([
            fetch("content/stories.json"),
            fetch("content/collected-stories.json")
        ]);

        if (!storiesResponse.ok) {
            throw new Error(`Could not load stories (${storiesResponse.status})`);
        }

        const storiesData = await storiesResponse.json();

        const stories = Array.isArray(storiesData.stories)
            ? storiesData.stories
            : [];

        storiesGrid.replaceChildren();

        stories.forEach((story) => {
            storiesGrid.appendChild(createStoryCard(story));
        });

        if (!stories.length) {
            storiesGrid.textContent = "Stories will appear here soon.";
        }

        let collected = [];

        if (collectedResponse.ok) {
            const collectedData = await collectedResponse.json();

            collected = Array.isArray(collectedData.collectedStories)
                ? collectedData.collectedStories
                : [];
        }

        if (collected.length && collectedGrid && collectedSection) {
            const byTitle = new Map(
                stories.map((story) => [
                    String(story.title || "").trim().toLowerCase(),
                    story
                ])
            );

            collectedGrid.replaceChildren();

            collected.forEach((item) => {
                const match = byTitle.get(
                    String(item.storyTitle || "").trim().toLowerCase()
                );

                if (match) {
                    collectedGrid.appendChild(
                        createStoryCard(match, item.whySelected || "")
                    );
                }
            });

            if (collectedGrid.children.length) {
                collectedSection.hidden = false;

                if (collectedNavLink) {
                    collectedNavLink.hidden = false;
                }
            }
        }

    } catch (error) {
        console.error("Error loading portfolio stories:", error);

        storiesGrid.textContent =
            "Stories could not be loaded. Please refresh the page.";
    }
}

// Load the About section and stories.
loadAbout();
loadStories();

// Modal controls.
if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeStoryModal);
}

window.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeStoryModal();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.style.display === "flex") {
        closeStoryModal();
    }
});

// Smooth scrolling for navigation links.
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (event) {
        const targetID = this.getAttribute("href");

        if (!targetID || targetID === "#") return;

        const target = document.querySelector(targetID);

        if (target && !target.hidden) {
            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});
