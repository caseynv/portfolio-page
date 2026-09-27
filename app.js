const projects=window.PORTFOLIO_PROJECTS||[];

function tagClass(p){
  if(p.filters.includes("security"))return"violet";
  if(p.filters.includes("frontend"))return"teal";
  if(p.filters.includes("distributed"))return"red";
  return"blue";
}

function render(filter="all"){
  const grid=document.getElementById("project-grid");
  if(!grid)return;
  grid.innerHTML="";
  projects
    .filter(p=>filter==="all"||p.filters.includes(filter))
    .forEach(p=>{
      const el=document.createElement("article");
      el.className="project-card";
      const visual=p.visual||p.id;
      el.innerHTML=`<div class="project-art sprite sprite-${visual}"></div>
        <div>
          <span class="tag ${tagClass(p)}">${p.category.toUpperCase()}</span>
          <h3>${p.title}</h3>
          <small class="project-context">${p.context||p.role}</small>
          <p>${p.recruiterSummary||p.summary}</p>
          <a href="case-study.html?id=${p.id}">Read case study →</a>
        </div>`;
      grid.appendChild(el);
    });
}

document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll("[data-filter]").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  render(b.dataset.filter);
}));

const menu=document.querySelector(".mobile-menu"),nav=document.querySelector(".topbar nav");
if(menu&&nav)menu.addEventListener("click",()=>{
  nav.classList.toggle("open");
  menu.setAttribute("aria-expanded",nav.classList.contains("open")?"true":"false");
});

const year=document.getElementById("year");
if(year)year.textContent=new Date().getFullYear();
render();
