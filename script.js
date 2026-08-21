const params = new URLSearchParams(location.search);
const slug = (params.get("event") || "demo").trim().slice(0, 80);
const guest = (params.get("to") || "Tamu Undangan").trim().slice(0, 80);

const $ = (id) => document.getElementById(id);

$("guestName").textContent = guest;
$("commentName").value = guest;

$("openInvitation").addEventListener("click", () => {
  $("content").classList.remove("hidden");
  $("content").scrollIntoView({ behavior: "smooth" });
});

function setText(id, value, fallback = "") {
  const el = $(id);
  if (el) el.textContent = value || fallback;
}

function prettyDate(value) {
  if (!value) return "-";
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

function coverDateParts(value) {
  if (!value) return { day: "-", date: "-" };
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return { day: "-", date: value };

  const date = new Date(Date.UTC(y, m - 1, d));

  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "long"
  }).format(date);

  const shortDate = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);

  return { day, date: shortDate };
}

function detailDateParts(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    return { weekday: "-", day: "-", month: "-", year: "-" };
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return {
    weekday: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date),
    day: String(day).padStart(2, "0"),
    month: new Intl.DateTimeFormat("en-US", { month: "long" }).format(date),
    year: String(year)
  };
}

function cleanCoverName(event) {
  const raw = String(event.main_name || event.event_title || "").trim();
  if (!raw) return "VIONA";

  // If the stored "main name" accidentally contains a birthday title,
  // strip common birthday wording so the cover remains name-focused.
  const stripped = raw
    .replace(/\b\d+(st|nd|rd|th)?\b/gi, " ")
    .replace(/\b(sweet\s*seventeen|birthday|birthday party|party)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (stripped || raw).toUpperCase();
}

function startCountdown(dateString, timeString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || "")) {
    setText("countdownStatus", "Tanggal acara belum ditentukan.");
    return;
  }

  const [year, month, day] = dateString.split("-").map(Number);
  const [hour, minute] = String(timeString || "00:00").split(":").map(Number);

  // WITA = UTC+8
  const target = Date.UTC(year, month - 1, day, hour - 8, minute || 0, 0);

  let timer;

  const update = () => {
    const diff = target - Date.now();

    if (diff <= 0) {
      ["days", "hours", "minutes", "seconds"].forEach((id) => setText(id, "00"));
      setText("countdownStatus", "The day is here ✨");
      if (timer) clearInterval(timer);
      return;
    }

    const total = Math.floor(diff / 1000);

    setText("days", String(Math.floor(total / 86400)).padStart(2, "0"));
    setText("hours", String(Math.floor((total % 86400) / 3600)).padStart(2, "0"));
    setText("minutes", String(Math.floor((total % 3600) / 60)).padStart(2, "0"));
    setText("seconds", String(total % 60).padStart(2, "0"));
    setText("countdownStatus", "");
  };

  update();
  timer = setInterval(update, 1000);
}

function renderGallery(items) {
  const valid = Array.isArray(items) ? items.filter(Boolean) : [];
  const gallerySection = $("gallerySection");
  const gallery = $("gallery");

  gallery.replaceChildren();

  if (!valid.length) {
    gallerySection.classList.add("hidden");
    return;
  }

  gallerySection.classList.remove("hidden");
  setText("galleryCount", String(valid.length).padStart(2, "0"));

  if (valid.length === 1) {
    gallery.dataset.count = "1";
  } else if (valid.length === 2) {
    gallery.dataset.count = "2";
  } else if (valid.length === 3) {
    gallery.dataset.count = "3";
  } else {
    gallery.dataset.count = "many";
  }

  valid.forEach((url, index) => {
    const figure = document.createElement("figure");
    const img = document.createElement("img");

    img.src = url;
    img.alt = `Foto Sweet Seventeen ${index + 1}`;
    img.loading = "lazy";

    figure.appendChild(img);
    gallery.appendChild(figure);
  });

  // Hero statement photo uses the first gallery image.
  $("statementPhoto").src = valid[0];
  $("statementPhotoSection").classList.remove("hidden");

  // Closing uses the last gallery image.
  $("closingImage").src = valid[valid.length - 1];
  $("closingImage").style.display = "block";
}

async function loadEvent() {
  try {
    const response = await fetch(`/api/events?slug=${encodeURIComponent(slug)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Acara tidak ditemukan");
    }

    const event = data.event;

    document.title = `${event.event_title || "Sweet Seventeen"} — Invitation`;

    setText("eventLabel", event.event_label, "Sweet Seventeen");
    setText("eventTitle", event.event_title, "Sweet Seventeen");
    setText("coverName", cleanCoverName(event), "VIONA");
    setText("coverEventTitle", event.event_label || "Sweet Seventeen", "Sweet Seventeen");
    setText("mainName", event.main_name, event.event_title);

    const coverDate = coverDateParts(event.event_date);
    setText("coverDay", coverDate.day);
    setText("coverDateShort", coverDate.date);

    if (/^\d{4}-\d{2}-\d{2}$/.test(event.event_date || "")) {
      const [iy, im, id] = event.event_date.split("-");
      setText("introDay", id);
      setText("introMonth", im);
      setText("introYear", iy);
      setText("closingDay", id);
      setText("closingMonth", im);
      setText("closingYear", iy);
    }
    setText("closingName", event.main_name, event.event_title);
    setText("subtitle", event.subtitle);
    setText("description", event.description);
    setText("eventDate", prettyDate(event.event_date));

    const detailDate = detailDateParts(event.event_date);
    setText("detailWeekday", detailDate.weekday);
    setText("detailDay", detailDate.day);
    setText("detailMonth", detailDate.month);
    setText("detailYear", detailDate.year);

    setText("eventTime", event.event_time ? `${event.event_time} WITA` : "-");
    setText("eventLocation", event.location, "-");

    const mapsButton = $("mapsButton");
    const mapsUrl = String(event.maps_url || "").trim();

    if (/^https?:\/\//i.test(mapsUrl)) {
      mapsButton.href = mapsUrl;
      mapsButton.classList.remove("hidden");
    } else {
      mapsButton.removeAttribute("href");
      mapsButton.classList.add("hidden");
    }

    if (event.cover_url) {
      $("coverImage").src = event.cover_url;
      $("coverImage").style.display = "block";

      $("closingImage").src = event.cover_url;
      $("closingImage").style.display = "block";
    }

    renderGallery(event.gallery_urls || []);
    startCountdown(event.event_date, event.event_time);

  } catch (error) {
    setText("mainName", "Acara belum ditemukan");
    setText("countdownStatus", error.message);
  }
}

function initials(name) {
  const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

function renderComments(items) {
  const wrap = $("comments");
  wrap.replaceChildren();

  setText("commentCount", `${items.length} ucapan`);

  if (!items.length) {
    const empty = document.createElement("p");
    empty.style.color = "var(--muted)";
    empty.style.fontSize = "13px";
    empty.style.padding = "18px 0";
    empty.textContent = "Belum ada ucapan. Jadi yang pertama!";
    wrap.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("article");
    row.className = "comment";

    const avatar = document.createElement("div");
    avatar.className = "comment-avatar";
    avatar.textContent = initials(item.guest_name);

    const body = document.createElement("div");
    body.className = "comment-body";

    const name = document.createElement("strong");
    name.textContent = item.guest_name;

    const message = document.createElement("div");
    message.textContent = item.message;

    const time = document.createElement("time");
    const value = String(item.created_at || "");
    const parsed = value.includes("T") ? value : value.replace(" ", "T") + "Z";

    time.textContent = new Date(parsed).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short"
    });

    body.append(name, message, time);
    row.append(avatar, body);
    wrap.appendChild(row);
  });
}

async function loadComments() {
  try {
    const response = await fetch(`/api/comments?wedding_id=${encodeURIComponent(slug)}`);
    const data = await response.json();

    if (!response.ok) throw new Error();

    renderComments(data.comments || []);
  } catch {
    $("comments").textContent = "Komentar belum dapat dimuat.";
  }
}

$("commentMessage").addEventListener("input", () => {
  setText("messageCount", `${$("commentMessage").value.length} / 500`);
});

$("commentForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = $("commentName").value.trim();
  const message = $("commentMessage").value.trim();

  if (!name || !message) return;

  setText("formStatus", "Mengirim...");

  try {
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        wedding_id: slug,
        guest_name: name,
        message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Gagal mengirim");
    }

    $("commentMessage").value = "";
    setText("messageCount", "0 / 500");
    setText("formStatus", "Ucapan berhasil dikirim.");
    await loadComments();

  } catch (error) {
    setText("formStatus", error.message);
  }
});

loadEvent();
loadComments();
