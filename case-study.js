const projects = window.PORTFOLIO_PROJECTS || [];
const id = new URLSearchParams(location.search).get("id");
const project = projects.find(item => item.id === id);
const main = document.querySelector(".case-page");
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

if (!project) {
  document.title = "Project not found · Kelechukwu Vivian Nwandu";
  if (main) {
    main.replaceChildren();
    const section = document.createElement("section");
    section.className = "case-not-found";
    const heading = document.createElement("h1");
    heading.textContent = "Project not found";
    const description = document.createElement("p");
    description.textContent = "This case study may have moved or the link may be incorrect.";
    const back = document.createElement("a");
    back.href = "work.html";
    back.textContent = "← Explore all projects";
    section.append(heading, description, back);
    main.append(section);
  }
} else {
  const set = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value ?? "";
  };
  const addTextItems = (containerId, tag, values) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.replaceChildren();
    values.forEach(value => {
      const element = document.createElement(tag);
      element.textContent = value;
      container.append(element);
    });
  };
  document.title = project.title + " · Kelechukwu Vivian Nwandu";
  set("case-category", project.category.toUpperCase());
  set("case-title", project.title);
  set("case-summary", project.summary);
  set("overview-copy", project.myRole + " " + project.outcome);
  set("case-architecture-text", project.architectureText);
  set("case-learnings-text", project.learnings);
  set("public-note", project.publicNote);
  const glance = document.getElementById("glance-card");
  if (glance) {
    glance.replaceChildren();
    [["Role",project.role],["Area",project.category],["Focus",project.focus],["My contribution",project.contribution],["Technologies",project.technologies],["Read time",project.readTime]].forEach(([label,value]) => {
      const wrapper = document.createElement("div");
      const strong = document.createElement("strong");
      const span = document.createElement("span");
      strong.textContent = label;
      span.textContent = value;
      wrapper.append(strong,span);
      glance.append(wrapper);
    });
  }
  const outcomes = document.getElementById("case-results-grid");
  if (outcomes) {
    outcomes.replaceChildren();
    project.results.slice(0,4).forEach(value => {
      const wrapper = document.createElement("div");
      const symbol = document.createElement("i");
      symbol.textContent = "◇";
      symbol.setAttribute("aria-hidden", "true");
      const paragraph = document.createElement("p");
      paragraph.textContent = value;
      wrapper.append(symbol, paragraph);
      outcomes.append(wrapper);
    });
  }
  addTextItems("case-problem-text", "p", project.problem);
  addTextItems("approach-list", "li", project.approach);
  const architecture = document.getElementById("architecture-flow");
  if (architecture) {
    architecture.replaceChildren();
    project.architecture.forEach((step,index) => {
      if (index) {
        const arrow = document.createElement("b");
        arrow.textContent = "→";
        arrow.setAttribute("aria-hidden", "true");
        architecture.append(arrow);
      }
      const node = document.createElement("div");
      node.className = "flow-node";
      const number = document.createElement("span");
      number.textContent = String(index+1).padStart(2,"0");
      const title = document.createElement("strong");
      title.textContent = step.label;
      const note = document.createElement("small");
      note.textContent = step.note;
      node.append(number,title,note);
      architecture.append(node);
    });
  }
  const contributions = document.getElementById("contribution-copy");
  if (contributions) {
    contributions.replaceChildren();
    [["Challenge",project.challenge],["My role",project.myRole],["Outcome",project.outcome]].forEach(([label,value])=>{
      const paragraph=document.createElement("p");
      const strong=document.createElement("strong");
      strong.textContent=label+": ";
      paragraph.append(strong,document.createTextNode(value));
      contributions.append(paragraph);
    });
  }
  const illustration = document.querySelector(".case-image");
  if (illustration) {
    illustration.classList.toggle("case-image-traveler", project.id === "traveler-app");
    illustration.setAttribute("aria-label", "Illustrative visual for " + project.title + "; not a product screenshot");
  }
}
