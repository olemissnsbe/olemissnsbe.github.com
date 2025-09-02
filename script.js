// === NSBE Ole Miss — vanilla JS enhancements (no deps) ===

// ------- Data -------
const officers = [
  { role: "President", person: "Tyneah Buckley", major: "Electrical Engineering", email: "president.nsbe.um@gmail.com" },
  { role: "Vice President", person: "McKenzie Stanley", major: "Computer Science", email: "mlstanl2@go.olemiss.edu" },
  { role: "Secretary", person: "Danaria Ward", major: "Computer Science", email: "djward1@go.olemiss.edu" },
  { role: "Treasurer", person: "Chauncey Newsome Jr.", major: "Electrical Engineering", email: "treasurer@nsbeolemiss.org" },
  { role: "Senator", person: "Nalaya Thompson", major: "Chemical Engineering", email: "senator@nsbeolemiss.org" },
  { role: "Senator", person: "Jamari Osborne", major: "Biomedical Engineering", email: "senator@nsbeolemiss.org" },
  { role: "Social Media Coordinator", person: "Jordan Cochran", major: "Mechanical Engineering", email: "media@nsbeolemiss.org" },
  { role: "Fundraising Chair", person: "Landon Armstrong", major: "Electrical & Electronics Engineering", email: "fundraising@nsbeolemiss.org" },
  { role: "Programs Chair", person: "Jaren Sullivan", major: "Mechanical Engineering", email: "programs@nsbeolemiss.org" },
  { role: "Academic Excellence Chair", person: "Kermit Oville", major: "Mechanical Engineering", email: "excellence@nsbeolemiss.org" },
  { role: "Membership Chair", person: "Destiny Bush", major: "Biomedical Engineering", email: "membership@nsbeolemiss.org" },
  { role: "Alumni Extension Chair", person: "Addison Williams", major: "Mechanical Engineering", email: "alumni@nsbeolemiss.org" },
  { role: "Telecommunications Chair", person: "Kahilyn Boyd", major: "Computer Science", email: "tech@nsbeolemiss.org" }, 
  { role: "Community Engagement Coordinator", person: "Devyne Agulanna", major: "Biomedical Engineering", email: "community@nsbeolemiss.org" },
];

// You can optionally set gcalUrl per event to use your prebuilt Google Calendar link.
// If gcalUrl is missing, we auto-generate a Google Calendar link.
const events = [
  {
    title: "General Body Meeting #1",
    date: "Aug 29, 2025",
    time: "6:00–7:30 PM",
    location: "Brewer Hall 205",
    description: "Kickoff, fall overview, committees sign-up, snacks provided."
    gcalUrl: "https://calendar.google.com/calendar/ical/25b7b1807f72f7445ee7e893a149ccbcc53a124d83890fd4804ff48085bc53b3%40group.calendar.google.com/public/basic.ics",
  },
  {
    title: "Study Jam + Tutoring",
    date: "Sep 3, 2025",
    time: "5:30–8:00 PM",
    location: "Weir Hall CS Commons",
    description: "Peer tutoring for CS, EE, Math, and Physics. Bring your laptop."
  },
  {
    title: "Corporate Info Session: GE Aerospace",
    date: "Sep 9, 2025",
    time: "6:00–7:00 PM",
    location: "Brewer Hall 112",
    description: "Resume tips, internships, and co-op opportunities."
  },
];

const sponsorTiers = [
  { tier: "Platinum", amount: "$5,000+", perks: ["Logo on homepage hero", "Career night keynote", "Priority tabling", "Resume book access"] },
  { tier: "Gold", amount: "$2,500", perks: ["Logo on sponsors page", "Workshop host", "Job board posts", "Resume book access"] },
  { tier: "Green", amount: "$1,000", perks: ["Logo on sponsors page", "Info session", "Social shoutout"] },
  { tier: "Red", amount: "$500", perks: ["Logo on sponsors page", "Social shoutout"] },
];

// ------- Constants & Utils -------
const dash = /–|—|-/; // accept en/em dash or hyphen

function el(tag, opts = {}) {
  const e = document.createElement(tag);
  if (opts.className) e.className = opts.className;
  if (opts.text) e.textContent = opts.text;
  if (opts.html) e.innerHTML = opts.html;
  if (opts.attrs) Object.entries(opts.attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (opts.on) Object.entries(opts.on).forEach(([type, fn]) => e.addEventListener(type, fn));
  return e;
}
function strong(text) { const s = document.createElement("strong"); s.textContent = text; return s; }
const pad = (n) => String(n).padStart(2, "0");

function parseDateTimeRange(dateStr, timeRangeStr) {
  // dateStr: "Sep 3, 2025"
  // timeRangeStr: "5:30–8:00 PM" OR "6–7:30 PM"
  const endSuffix = (timeRangeStr.match(/\b(AM|PM)\b/i) || [])[0] || null;
  const [rawStart, rawEnd] = timeRangeStr.split(dash).map(s => s.trim());
  const startPart = endSuffix && !/\b(AM|PM)\b/i.test(rawStart) ? `${rawStart} ${endSuffix}` : rawStart;
  const endPart = rawEnd;

  function to24hPieces(tstr) {
    const m = tstr.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const mins = parseInt(m[2] || "0", 10);
    const ampm = m[3].toUpperCase();
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return { h, m: mins };
  }
  function build(dates, tstr) {
    const d = new Date(dates);
    const p = to24hPieces(tstr);
    if (!p || isNaN(d)) return null;
    d.setHours(p.h, p.m, 0, 0);
    return d;
  }
  const start = build(dateStr, startPart);
  const end = build(dateStr, endPart);
  return { start, end };
}

function formatICSDate(dt) {
  // Floating local time format: YYYYMMDDTHHMMSS (no TZ)
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}${pad(dt.getSeconds())}`;
}

function escapeICS(s = "") {
  return String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function makeICS(evObj) {
  const { start, end } = parseDateTimeRange(evObj.date, evObj.time);
  const uid = `nsbe-olemiss-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}@nsbeolemiss.org`;
  const dtstamp = formatICSDate(new Date());
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//NSBE Ole Miss//Events//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${formatICSDate(start)}
DTEND:${formatICSDate(end)}
SUMMARY:${escapeICS(evObj.title)}
LOCATION:${escapeICS(evObj.location)}
DESCRIPTION:${escapeICS(evObj.description)}
END:VEVENT
END:VCALENDAR`;
}

function download(filename, text, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// Build a standard Google "create event" link if you didn't supply one
function googleCalendarLink(evObj) {
  const { start, end } = parseDateTimeRange(evObj.date, evObj.time);
  const toUTCBasic = (dt) => dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: evObj.title,
    details: evObj.description,
    location: evObj.location,
    dates: `${toUTCBasic(start)}/${toUTCBasic(end)}`
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function debounce(fn, wait = 200) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

// ------- Rendering -------
function renderOfficers() {
  const grid = document.getElementById("officers-grid");
  if (!grid) return;
  grid.replaceChildren();
  officers.forEach(o => {
    const card = el("div", { className: "card", attrs: { role: "group", "aria-label": o.role } });
    const h3 = el("h3", { text: o.role });
    const name = el("div"); name.append(strong(o.person));
    const major = el("div", { className: "muted", text: o.major });
    const link = el("a", { className: "muted", attrs: { href: `mailto:${o.email}`, "aria-label": `Email ${o.person}` }, text: o.email });
    card.append(h3, name, major, link);
    grid.appendChild(card);
  });
}

function annotateAndSortEvents(evts) {
  const enriched = evts.map(e => {
    const { start, end } = parseDateTimeRange(e.date, e.time) || {};
    return { ...e, _start: start, _end: end };
  }).filter(e => e._start instanceof Date && !isNaN(e._start));
  enriched.sort((a, b) => a._start - b._start);
  return enriched;
}

function renderEvents(list = events, { hidePast = true } = {}) {
  const grid = document.getElementById("events-grid");
  if (!grid) return;
  grid.replaceChildren();

  const now = new Date();
  const cleaned = annotateAndSortEvents(list).filter(e => hidePast ? e._end > now : true);

  if (cleaned.length === 0) {
    grid.appendChild(el("div", { className: "muted", text: "No upcoming events. Check back soon!" }));
    return;
  }

  cleaned.forEach(e => {
    const card = el("div", { className: "card", attrs: { role: "article" } });
    const h3 = el("h3", { text: e.title });
    const meta = el("div", { className: "muted", text: `${e.date} • ${e.time} — ${e.location}` });
    const p = el("p", { text: e.description });

    const actions = el("div", { className: "mt-2", attrs: { role: "group", "aria-label": "Event actions" } });

    const icsBtn = el("button", {
      className: "btn btn-light", attrs: { type: "button" }, text: "Add to Calendar (.ics)",
      on: { click: () => download(`${e.title.replace(/[^\w\-]+/g, "_")}.ics`, makeICS(e), "text/calendar;charset=utf-8") }
    });

    const gcal = el("a", {
      className: "btn btn-link",
      attrs: {
        href: e.gcalUrl || googleCalendarLink(e),
        target: "_blank", rel: "noopener", "aria-label": "Add to Google Calendar"
      },
      text: "Add to Google Calendar"
    });

    actions.append(icsBtn, gcal);
    card.append(h3, meta, p, actions);
    grid.appendChild(card);
  });
}

function renderSponsors() {
  const grid = document.getElementById("sponsor-tiers");
  if (!grid) return;
  grid.replaceChildren();

  sponsorTiers.forEach(t => {
    const card = el("div", { className: "card" });
    const h3 = el("h3", { text: t.tier });

    const amtWrap = el("div", { className: "muted" });
    const amtStrong = strong(t.amount);
    amtStrong.style.color = "var(--green)";
    amtStrong.style.fontSize = "1.2rem";
    amtWrap.append(amtStrong);

    const ul = el("ul", { className: "list", attrs: { role: "list" } });
    t.perks.forEach(p => ul.appendChild(el("li", { text: p })));

    card.append(h3, amtWrap, ul);
    grid.appendChild(card);
  });
}

// ------- Behavior -------
function setupSearch() {
  const input = document.getElementById("event-search");
  if (!input) return;
  const run = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { renderEvents(events); return; }
    const tokens = q.split(/\s+/).filter(Boolean);
    const filtered = events.filter(e => {
      const hay = [e.title, e.date, e.time, e.location, e.description].join(" ").toLowerCase();
      return tokens.every(tok => hay.includes(tok));
    });
    renderEvents(filtered);
  };
  input.addEventListener("input", debounce(run, 150));
}

function setupYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

// ---- Bylaws link (Google Drive) ----
// Set ONE URL and we wire both buttons/links to it.
function setupDownloads() {
  // Use your Drive share link (viewer) or direct-download link (commented example).
  // Viewer example:
  const BYLAWS_URL = "https://drive.google.com/file/d/FILE_ID/view?usp=sharing";
  // Direct download form (optional):
  // const BYLAWS_URL = "https://drive.google.com/uc?export=download&id=FILE_ID";

  const bylawsBtn  = document.getElementById("download-bylaws");
  const bylawsLink = document.getElementById("bylaws-link");

  [bylawsBtn, bylawsLink].forEach(a => {
    if (!a) return;
    a.setAttribute("href", BYLAWS_URL);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
    a.onclick = null; // remove old click handlers
  });
}

function setupForms() {
  const join = document.getElementById("join-form");
  if (join) join.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Thanks! We'll follow up by email."); // replace with fetch() to Google Forms if you want
    e.target.reset();
  });

  const contact = document.getElementById("contact-form");
  if (contact) contact.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Message sent! We'll be in touch."); // replace with your email service
    e.target.reset();
  });
}

// Optional: include a separate header.html via fetch() if you’re splitting the navbar
function loadHeader() {
  const target = document.getElementById("header");
  if (!target) return;
  fetch("header.html", { cache: "no-store" })
    .then(res => res.ok ? res.text() : Promise.reject(res))
    .then(html => { target.innerHTML = html; })
    .catch(() => {
      const fallback = el("nav", { className: "card" });
      fallback.append(el("a", { attrs: { href: "/" }, text: "NSBE Ole Miss" }));
      target.replaceChildren(fallback);
    });
}

// ------- Init -------
document.addEventListener("DOMContentLoaded", () => {
  loadHeader();          // only matters if you have a separate header.html and a <div id="header"></div>
  renderOfficers();
  renderEvents(events);  // auto-hides past
  renderSponsors();
  setupSearch();
  setupYear();
  setupDownloads();      // <-- set your Drive FILE_ID above
  setupForms();
});
