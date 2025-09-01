
// === NSBE Ole Miss — vanilla JS enhancements (no deps) ===

// ------- Data (unchanged) -------
const officers = [
  { role: "President", person: "Alex Johnson", major: "Electrical Engineering", email: "president@nsbeolemiss.org" },
  { role: "Vice President", person: "Taylor Smith", major: "Computer Science", email: "vp@nsbeolemiss.org" },
  { role: "Secretary", person: "Riley Brown", major: "Mechanical Engineering", email: "secretary@nsbeolemiss.org" },
  { role: "Treasurer", person: "Jordan Lee", major: "Civil Engineering", email: "treasurer@nsbeolemiss.org" },
  { role: "Programs Chair", person: "Sydney Green", major: "Chemical Engineering", email: "programs@nsbeolemiss.org" },
  { role: "PCI (Pre-College) Chair", person: "Chris Davis", major: "Computer Engineering", email: "pci@nsbeolemiss.org" },
];

const events = [
  { title: "General Body Meeting #1", date: "Aug 29, 2025", time: "6:00–7:30 PM", location: "Brewer Hall 205", description: "Kickoff, fall overview, committees sign-up, snacks provided." },
  { title: "Study Jam + Tutoring", date: "Sep 3, 2025", time: "5:30–8:00 PM", location: "Weir Hall CS Commons", description: "Peer tutoring for CS, EE, Math, and Physics. Bring your laptop." },
  { title: "Corporate Info Session: GE Aerospace", date: "Sep 9, 2025", time: "6:00–7:00 PM", location: "Brewer Hall 112", description: "Resume tips, internships, and co-op opportunities." },
];

const sponsorTiers = [
  { tier: "Platinum", amount: "$5,000+", perks: ["Logo on homepage hero", "Career night keynote", "Priority tabling", "Resume book access"] },
  { tier: "Gold", amount: "$2,500", perks: ["Logo on sponsors page", "Workshop host", "Job board posts", "Resume book access"] },
  { tier: "Green", amount: "$1,000", perks: ["Logo on sponsors page", "Info session", "Social shoutout"] },
  { tier: "Red", amount: "$500", perks: ["Logo on sponsors page", "Social shoutout"] },
];

// ------- Utilities -------
const CHI_TZ = "America/Chicago"; // for documentation; we’ll emit local “floating” times in ICS
const dash = /–|—|-/;

function el(tag, opts = {}) {
  const e = document.createElement(tag);
  if (opts.className) e.className = opts.className;
  if (opts.text) e.textContent = opts.text;
  if (opts.attrs) Object.entries(opts.attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (opts.on) Object.entries(opts.on).forEach(([type, fn]) => e.addEventListener(type, fn));
  return e;
}

function strong(text) {
  const s = document.createElement("strong");
  s.textContent = text;
  return s;
}

function pad(n) { return String(n).padStart(2, "0"); }

function parseDateTimeRange(dateStr, timeRangeStr) {
  // Accepts date like "Sep 3, 2025" and time like "5:30–8:00 PM" or "6–7:30 PM"
  // Returns { start: Date, end: Date }
  const endSuffix = (timeRangeStr.match(/\b(AM|PM)\b/i) || [])[0] || null;
  const [rawStart, rawEnd] = timeRangeStr.split(dash).map(s => s.trim());
  const startPart = endSuffix && !/\b(AM|PM)\b/i.test(rawStart) ? `${rawStart} ${endSuffix}` : rawStart;
  const endPart = rawEnd;

  function to24hPieces(tstr) {
    // "6:00 PM" | "6 PM" -> {h, m}
    const m = tstr.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const mins = parseInt(m[2] || "0", 10);
    const ampm = m[3].toUpperCase();
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return { h, m: mins };
    }

  function build(dateStr, tstr) {
    const d = new Date(dateStr); // relies on US short month parsing; your inputs match this
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
  // Floating local time format without TZ: YYYYMMDDTHHMMSS
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}${pad(dt.getSeconds())}`;
}

function makeICS(evObj) {
  const { start, end } = parseDateTimeRange(evObj.date, evObj.time);
  const uid = `nsbe-olemiss-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}@nsbeolemiss.org`;
  const dtstamp = formatICSDate(new Date());

  const ics =
`BEGIN:VCALENDAR
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
  return ics;
}

function escapeICS(s = "") {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function download(filename, text, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function googleCalendarLink(evObj) {
  const { start, end } = parseDateTimeRange(evObj.date, evObj.time);
  // Google expects YYYYMMDDTHHMMSSZ (UTC) or floating time with dates; to keep simple, we’ll pass date/time as local floating via toISOString stripped of dashes/colons and Z.
  // But safer: create “dates” param in UTC so Google shows correctly across zones.
  function toUTCBasic(dt) {
    return dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  }
  const base = "https://calendar.google.com/calendar/u/3?cid=MjViN2IxODA3ZjcyZjc0NDVlZTdlODkzYTE0OWNjYmNjNTNhMTI0ZDgzODkwZmQ0ODA0ZmY0ODA4NWJjNTNiM0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t";
  const params = new URLSearchParams({
    text: evObj.title,
    details: evObj.description,
    location: evObj.location,
    dates: `${toUTCBasic(start)}/${toUTCBasic(end)}`
  });
  return `${base}&${params.toString()}`;
}

function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// ------- Rendering -------
function renderOfficers() {
  const grid = document.getElementById("officers-grid");
  if (!grid) return;
  grid.replaceChildren();
  officers.forEach(o => {
    const card = el("div", { className: "card", attrs: { role: "group", "aria-label": `${o.role}` } });

    const h3 = el("h3");
    h3.append(document.createTextNode(o.role));

    const name = el("div");
    name.append(strong(o.person));

    const major = el("div", { className: "muted", text: o.major });
    const link = el("a", {
      className: "muted",
      attrs: { href: `mailto:${o.email}`, "aria-label": `Email ${o.person}` },
      text: o.email
    });

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
    const meta = el("div", {
      className: "muted",
      text: `${e.date} • ${e.time} — ${e.location}`
    });
    const p = el("p", { text: e.description });

    const actions = el("div", { className: "mt-2", attrs: { role: "group", "aria-label": "Event actions" } });

    const icsBtn = el("button", {
      className: "btn btn-light",
      attrs: { type: "button" },
      text: "Add to Calendar (.ics)",
      on: {
        click: () => {
          const ics = makeICS(e);
          const safeTitle = e.title.replace(/[^\w\-]+/g, "_");
          download(`${safeTitle}.ics`, ics, "text/calendar;charset=utf-8");
        }
      }
    });

    const gcal = el("a", {
      className: "btn btn-link",
      attrs: { href: googleCalendarLink(e), target: "_blank", rel: "noopener", "aria-label": "Add to Google Calendar" },
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

    // very light fuzzy: split into tokens, all must match somewhere
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

function setupDownloads() {
  const bylawsBtn = document.getElementById("download-bylaws");
  const bylawsLink = document.getElementById("bylaws-link");

  function downloadDummy() {
    const blob = new Blob(["NSBE Ole Miss — Bylaws (placeholder)"], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "NSBE_OleMiss_Bylaws.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  bylawsBtn?.addEventListener("click", (e) => { e.preventDefault(); downloadDummy(); });
  bylawsLink?.addEventListener("click", (e) => { e.preventDefault(); downloadDummy(); });
}

function setupForms() {
  const join = document.getElementById("join-form");
  if (join) join.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Thanks! We'll follow up by email."); // swap for fetch() to Google Forms
    e.target.reset();
  });

  const contact = document.getElementById("contact-form");
  if (contact) contact.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Message sent! We'll be in touch."); // swap for email service
    e.target.reset();
  });
}

function loadHeader() {
  const target = document.getElementById("header");
  if (!target) return;

  fetch("header.html", { cache: "no-store" })
    .then(res => res.ok ? res.text() : Promise.reject(res))
    .then(html => { target.innerHTML = html; })
    .catch(() => {
      // graceful fallback if header fails
      const fallback = el("nav", { className: "card" });
      fallback.append(el("a", { attrs: { href: "/" }, text: "NSBE Ole Miss" }));
      target.replaceChildren(fallback);
    });
}

// ------- Init -------
document.addEventListener("DOMContentLoaded", () => {
  loadHeader();
  renderOfficers();
  renderEvents(events);        // auto-hides past
  renderSponsors();
  setupSearch();
  setupYear();
  setupDownloads();
  setupForms();
});
