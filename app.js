const projects=window.PORTFOLIO_PROJECTS||[];

const visibleIds=["multi-region","api-security","workflow-automation","tax-notifications","crawler-filter","wikimedia-dashboard"];
function tagClass(p){if(p.id==="api-security")return"violet";if(p.id==="workflow-automation")return"red";if(p.id==="wikimedia-dashboard")return"teal";return"blue"}
function render(filter="all"){const grid=document.getElementById("project-grid");if(!grid)return;grid.innerHTML="";projects.filter(p=>visibleIds.includes(p.id)).filter(p=>filter==="all"||p.filters.includes(filter)).forEach(p=>{const el=document.createElement("article");el.className="project-card";el.innerHTML=`<div class="project-art sprite sprite-${p.id}"></div><div><span class="tag ${tagClass(p)}">${p.category.toUpperCase()}</span><h3>${p.title}</h3><p>${p.recruiterSummary||p.summary}</p><a href="case-study.html?id=${p.id}">Read case study →</a></div>`;grid.appendChild(el)})}
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-filter]").forEach(x=>x.classList.remove("active"));b.classList.add("active");render(b.dataset.filter)}));
const menu=document.querySelector(".mobile-menu"),nav=document.querySelector(".topbar nav");if(menu&&nav)menu.addEventListener("click",()=>nav.classList.toggle("open"));
const year=document.getElementById("year");if(year)year.textContent=new Date().getFullYear();render();
