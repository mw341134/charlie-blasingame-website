const storiesGrid = document.getElementById("stories-grid");
const collectedSection = document.getElementById("collected-stories");
const collectedGrid = document.getElementById("collected-stories-grid");
const collectedNavLink = document.getElementById("collected-nav-link");
const modal = document.getElementById("story-modal");
const closeModalBtn = document.getElementById("close-modal");

function markdownToHTML(markdown) {
    if (!markdown) return "";
    const escaped = String(markdown)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    return escaped
        .replace(/^### (.*)$/gm, "<h3>$1</h3>")
        .replace(/^## (.*)$/gm, "<h2>$1</h2>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/^- (.*)$/gm, "<li>$1</li>")
        .replace(/(<li>.*<\/li>\n?)+/g, (list) => `<ul>${list}</ul>`)
        .split(/\n\s*\n/)
        .map((part) => part.trim() ? (part.startsWith("<h") || part.startsWith("<ul>") ? part : `<p>${part.replace(/\n/g, "<br>")}</p>`) : "")
        .join("");
}

function openStory(story) {
    document.getElementById("modal-image").src = story.imageURL || "";
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
    image.src = story.imageURL || "";
    image.alt = story.title || "";
    image.loading = "lazy";
    image.addEventListener("error", () => { image.style.display = "none"; }, { once: true });

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
        if (!storiesResponse.ok) throw new Error(`Could not load stories (${storiesResponse.status})`);
        const storiesData = await storiesResponse.json();
        const stories = Array.isArray(storiesData.stories) ? storiesData.stories : [];

        storiesGrid.replaceChildren();
        stories.forEach((story) => storiesGrid.appendChild(createStoryCard(story)));
        if (!stories.length) storiesGrid.textContent = "Stories will appear here soon.";

        let collected = [];
        if (collectedResponse.ok) {
            const collectedData = await collectedResponse.json();
            collected = Array.isArray(collectedData.collectedStories) ? collectedData.collectedStories : [];
        }
        if (collected.length && collectedGrid && collectedSection) {
            const byTitle = new Map(stories.map((story) => [String(story.title || "").trim().toLowerCase(), story]));
            collectedGrid.replaceChildren();
            collected.forEach((item) => {
                const match = byTitle.get(String(item.storyTitle || "").trim().toLowerCase());
                if (match) collectedGrid.appendChild(createStoryCard(match, item.whySelected || ""));
            });
            if (collectedGrid.children.length) {
                collectedSection.hidden = false;
                if (collectedNavLink) collectedNavLink.hidden = false;
            }
        }
    } catch (error) {
        console.error("Error loading portfolio stories:", error);
        storiesGrid.textContent = "Stories could not be loaded. Please refresh the page.";
    }
}

loadStories();

if (closeModalBtn) closeModalBtn.addEventListener("click", closeStoryModal);
window.addEventListener("click", (event) => { if (event.target === modal) closeStoryModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && modal.style.display === "flex") closeStoryModal(); });
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (event) {
        const targetID = this.getAttribute("href");
        if (!targetID || targetID === "#") return;
        const target = document.querySelector(targetID);
        if (target && !target.hidden) {
            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });
});
