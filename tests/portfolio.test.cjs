const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = path => fs.readFileSync(path,'utf8');
const app = read('app.js');
const study = read('case-study.js');
const projects = JSON.parse(read('projects.js').replace(/^window.PORTFOLIO_PROJECTS=/,'').replace(/;\s*$/,''));

test('JavaScript parses', () => {
  new vm.Script(app);
  new vm.Script(study);
});
test('every portfolio project has a unique routable case-study ID', () => {
  const ids = projects.map(project => project.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of projects) {
    assert.match(p.id,/^[a-z0-9-]+$/);
    for (const field of ['title','summary','category','myRole','outcome','architectureText']) assert.ok(p[field],p.id+' missing '+field);
    assert.ok(Array.isArray(p.results)&&p.results.length);
  }
});
test('invalid case study IDs no longer fall back to an unrelated project', () => {
  assert.match(study,/Project not found/);
  assert.doesNotMatch(study,/find\(x=>x\.id===["']multi-region["']\)/);
});
test('work and lab filters are connected', () => {
  assert.match(read('lab.html'),/class="filters lab-filters"/);
  assert.match(read('work.html'),/class="filters work-filters"/);
  assert.match(app,/setupFilters\("\.lab-filters/);
  assert.match(app,/setupFilters\("\.work-filters/);
  assert.equal((read('lab.html').match(/data-categories=/g)||[]).length,4);
});
test('navigation has keyboard support and controlled state on every page', () => {
  for(const page of ['index.html','work.html','lab.html','about.html','case-study.html']){
    assert.match(read(page),/aria-controls="primary-navigation"/);
    assert.match(read(page),/id="primary-navigation"/);
    assert.match(read(page),/href="resume\/Kelechukwu_Nwandu_Resume_2026.pdf"/);
  }
  assert.match(app,/event\.key === "Escape"/);
  assert.match(app,/aria-expanded/);
});
test('responsive components have fluid sizing', () => {
  const css=read('app.css');
  assert.match(css,/\.case-image\{width:100%;max-width:100%/);
  assert.match(css,/\.project-art\{width:100%;max-width:100%/);
  assert.match(css,/prefers-reduced-motion/);
});
test('homepage featured links resolve to project IDs', () => {
  const html=read('index.html');
  for(const match of html.matchAll(/case-study\.html\?id=([a-z0-9-]+)/g)) {
    assert.ok(projects.some(p=>p.id===match[1]),'Unknown featured project '+match[1]);
  }
});

test('case studies display data-driven architecture, not a generic image', () => {
  assert.match(read('case-study.html'), /id="case-visual"/);
  assert.match(study, /project\.architecture\.forEach/);
  assert.match(study, /Conceptual architecture/);
  assert.doesNotMatch(read('case-study.html'), /sprite-case-map/);
});
test('Traveler has its own catalogue artwork and repository link', () => {
  const traveler=projects.find(p=>p.id==='traveler-app');
  assert.ok(traveler);
  assert.equal(traveler.sourceUrl,'https://github.com/caseynv/traveler-app');
  assert.equal(traveler.thumbnail,'images/thumbs/traveler-app.svg');
  assert.match(app,/image\.src = project\.thumbnail/);
  assert.match(study,/Explore project repository/);
});

test('each project has a matching local SVG thumbnail', () => {
  for (const project of projects) {
    assert.equal(project.thumbnail, 'images/thumbs/' + project.id + '.svg');
    const image = read(project.thumbnail);
    assert.match(image, /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(image, /<title id="title">/);
    assert.match(image, /<desc id="desc">/);
    assert.ok(!/<script\b|<foreignObject\b|onload\s*=|href\s*=\s*["']https?:/i.test(image), 'Unsafe SVG: ' + project.id);
  }
  assert.match(app, /image\.src = project\.thumbnail/);
  assert.match(read('app.css'), /\.project-thumb-img/);
});
