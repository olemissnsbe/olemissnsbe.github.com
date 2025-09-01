// NSBE Ole Miss — vanilla JS enhancements

const officers = [
  { role: "President", person: "Alex Johnson", major: "Electrical Engineering", email: "president@nsbeolemiss.org" },
  { role: "Vice President", person: "Taylor Smith", major: "Computer Science", email: "vp@nsbeolemiss.org" },
  { role: "Secretary", person: "Riley Brown", major: "Mechanical Engineering", email: "secretary@nsbeolemiss.org" },
  { role: "Treasurer", person: "Jordan Lee", major: "Civil Engineering", email: "treasurer@nsbeolemiss.org" },
  { role: "Programs Chair", person: "Sydney Green", major: "Chemical Engineering", email: "programs@nsbeolemiss.org" },
  { role: "PCI (Pre‑College) Chair", person: "Chris Davis", major: "Computer Engineering", email: "pci@nsbeolemiss.org" },
];

const events = [
  { title: "General Body Meeting #1", date: "Aug 29, 2025", time: "6:00–7:30 PM", location: "Brewer Hall 205", description: "Kickoff, fall overview, committees sign‑up, snacks provided." },
  { title: "Study Jam + Tutoring", date: "Sep 3, 2025", time: "5:30–8:00 PM", location: "Weir Hall CS Commons", description: "Peer tutoring for CS, EE, Math, and Physics. Bring your laptop." },
  { title: "Corporate Info Session: GE Aerospace", date: "Sep 9, 2025", time: "6:00–7:00 PM", location: "Brewer Hall 112", description: "Resume tips, internships, and co‑op opportunities." },
];

const sponsorTiers = [
  { tier: "Platinum", amount: "$5,000+", perks: ["Logo on homepage hero", "Career night keynote", "Priority tabling", "Resume book access"] },
  { tier: "Gold", amount: "$2,500", perks: ["Logo on sponsors page", "Workshop host", "Job board posts", "Resume book access"] },
  { tier: "Green", amount: "$1,000", perks: ["Logo on sponsors page", "Info session", "Social shoutout"] },
  { tier: "Red", amount: "$500", perks: ["Logo on sponsors page", "Social shoutout"] },
];

function el(tag, opts={}){
  const e = document.createElement(tag);
  if(opts.className) e.className = opts.className;
  if(opts.text) e.textContent = opts.text;
  if(opts.html) e.innerHTML = opts.html;
  if(opts.attrs){
    Object.entries(opts.attrs).forEach(([k,v]) => e.setAttribute(k, v));
  }
  return e;
}

function renderOfficers(){
  const grid = document.getElementById("officers-grid");
  officers.forEach(o => {
    const card = el("div", { className: "card" });
    const h3 = el("h3", { text: o.role });
    const name = el("div", { html: `<strong>${o.person}</strong>` });
    const major = el("div", { className: "muted", text: o.major });
    const link = el("a", { attrs:{ href:`mailto:${o.email}` }, className:"muted" , text:o.email });
    card.append(h3, name, major, link);
    grid.appendChild(card);
  });
}

function renderEvents(list = events){
  const grid = document.getElementById("events-grid");
  grid.innerHTML = "";
  list.forEach(e => {
    const card = el("div", { className: "card" });
    const h3 = el("h3", { text: e.title });
    const meta = el("div", { className: "muted", text: `${e.date} • ${e.time} — ${e.location}` });
    const p = el("p", { text: e.description });
    const btn = el("a", { className: "btn btn-light mt-2", attrs:{ href:"#"} , text:"Add to Calendar" });
    card.append(h3, meta, p, btn);
    grid.appendChild(card);
  });
}

function renderSponsors(){
  const grid = document.getElementById("sponsor-tiers");
  sponsorTiers.forEach(t => {
    const card = el("div", { className: "card" });
    const h3 = el("h3", { text: t.tier });
    const amt = el("div", { className: "muted", html: `<strong style="color: var(--green); font-size: 1.2rem;">${t.amount}</strong>` });
    const ul = el("ul", { className: "list" });
    t.perks.forEach(p => {
      const li = el("li", { text: "• " + p });
      ul.appendChild(li);
    });
    card.append(h3, amt, ul);
    grid.appendChild(card);
  });
}

function setupSearch(){
  const input = document.getElementById("event-search");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if(!q){ renderEvents(events); return; }
    const filtered = events.filter(e => [e.title, e.date, e.time, e.location, e.description].some(v => v.toLowerCase().includes(q)));
    renderEvents(filtered);
  });
}

function setupYear(){
  const y = document.getElementById("year");
  y.textContent = new Date().getFullYear();
}

function setupDownloads(){
  const bylawsBtn = document.getElementById("download-bylaws");
  const bylawsLink = document.getElementById("bylaws-link");
  function downloadDummy(){
    const blob = new Blob([\"NSBE Ole Miss — Bylaws (placeholder)\"], { type: \"application/pdf\"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement(\"a\"); a.href = url; a.download = \"NSBE_OleMiss_Bylaws.pdf\"; a.click();
    URL.revokeObjectURL(url);
  }
  bylawsBtn?.addEventListener(\"click\", (e)=>{ e.preventDefault(); downloadDummy(); });
  bylawsLink?.addEventListener(\"click\", (e)=>{ e.preventDefault(); downloadDummy(); });
}

function setupForms(){
  document.getElementById(\"join-form\")?.addEventListener(\"submit\", (e)=>{
    e.preventDefault();
    alert(\"Thanks! We'll follow up by email.\"); // replace with Google Forms post
    e.target.reset();
  });
  document.getElementById(\"contact-form\")?.addEventListener(\"submit\", (e)=>{
    e.preventDefault();
    alert(\"Message sent! We'll be in touch.\"); // replace with email service
    e.target.reset();
  });
}

renderOfficers();
renderEvents(events);
renderSponsors();
setupSearch();
setupYear();
setupDownloads();
setupForms();
