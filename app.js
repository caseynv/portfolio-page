const portfolioProjects=window.PORTFOLIO_PROJECTS||[];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}
function tagClass(project) {
  if (project.filters.includes("security")) return "violet";
  if (project.filters.includes("frontend")) return "teal";
  if (project.filters.includes("distributed")) return "red";
  return "blue";
}
function render(filter = "all") {
  const grid = document.getElementById("project-grid");
  if (!grid) return;
  grid.replaceChildren();
  const visible = portfolioProjects.filter(project => filter === "all" || project.filters.includes(filter));
  visible.forEach(project => {
    const card = document.createElement("article");
    card.className = "project-card";
    const art = document.createElement("div");
    art.className = "project-art sprite sprite-" + (project.visual || project.id);
    art.setAttribute("aria-hidden", "true");
    const body = document.createElement("div");
    body.innerHTML = `<span class="tag ${tagClass(project)}">${escapeHtml(project.category.toUpperCase())}</span>
      <h3>${escapeHtml(project.title)}</h3>
      <small class="project-context">${escapeHtml(project.context || project.role)}</small>
      <p>${escapeHtml(project.recruiterSummary || project.summary)}</p>`;
    const link = document.createElement("a");
    link.href = "case-study.html?id=" + encodeURIComponent(project.id);
    link.textContent = "Read case study →";
    body.append(link);
    card.append(art, body);
    grid.append(card);
  });
  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No projects in this category yet.";
    grid.append(empty);
  }
}

function setupFilters(selector, cardSelector, attribute) {
  const buttons = [...document.querySelectorAll(selector)];
  if (!buttons.length) return;
  const cards = [...document.querySelectorAll(cardSelector)];
  buttons.forEach(button => button.addEventListener("click", () => {
    const selected = button.dataset.filter || "all";
    buttons.forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    if (cardSelector === ".lab-grid article") {
      let count = 0;
      cards.forEach(card => {
        const matches = selected === "all" || (card.dataset[attribute] || "").split(" ").includes(selected);
        card.hidden = !matches;
        if (matches) count++;
      });
      const message = document.getElementById("lab-empty");
      if (message) message.hidden = count > 0;
    } else render(selected);
  }));
}
setupFilters(".work-filters [data-filter]", ".project-card", "filter");
setupFilters(".lab-filters [data-filter]", ".lab-grid article", "categories");

const menu = document.querySelector(".mobile-menu");
const nav = document.querySelector(".topbar nav");
if (menu && nav) {
  const closeMenu = () => {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
  };
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-controls", "primary-navigation");
  nav.id = "primary-navigation";
  menu.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(isOpen));
  });
  nav.addEventListener("click", event => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener("click", event => {
    if (!nav.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 800) closeMenu();
  });
}
const footerYear = document.getElementById("year");
if (footerYear) footerYear.textContent = new Date().getFullYear();
render();
