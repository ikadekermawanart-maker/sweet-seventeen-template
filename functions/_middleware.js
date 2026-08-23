function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function absoluteUrl(value, requestUrl) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    return new URL(raw, requestUrl).href;
  } catch {
    return "";
  }
}

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  // Hanya proses halaman utama undangan.
  if (
    request.method !== "GET" ||
    (url.pathname !== "/" && url.pathname !== "/index.html")
  ) {
    return context.next();
  }

  const slug = String(url.searchParams.get("event") || "")
    .trim()
    .slice(0, 80);

  // Jika tidak ada event, kirim halaman normal.
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return context.next();
  }

  let event = null;

  try {
    event = await context.env.DB.prepare(`
      SELECT
        slug,
        event_label,
        event_title,
        main_name,
        subtitle,
        description,
        cover_url
      FROM events
      WHERE slug = ?
    `).bind(slug).first();
  } catch {
    // Kalau DB gagal, jangan rusak undangan.
    return context.next();
  }

  if (!event) {
    return context.next();
  }

  const originalResponse = await context.next();

  const contentType = originalResponse.headers.get("Content-Type") || "";
  if (!contentType.includes("text/html")) {
    return originalResponse;
  }

  let html = await originalResponse.text();

  const displayName =
    String(event.main_name || event.event_title || "Sweet Seventeen").trim();

  const eventLabel =
    String(event.event_label || "Sweet Seventeen").trim();

  const title =
    displayName && eventLabel
      ? `${displayName} — ${eventLabel}`
      : displayName || "Sweet Seventeen Invitation";

  const description =
    String(
      event.description ||
      event.subtitle ||
      `You're invited to celebrate ${displayName}.`
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220);

  const imageUrl = absoluteUrl(event.cover_url, request.url);

  // Canonical OG URL tidak perlu membawa nama tamu.
  const canonicalUrl = new URL(request.url);
  canonicalUrl.searchParams.delete("to");

  const meta = `
  <!-- Dynamic Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Digital Invitation">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl.href)}">
  ${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}">` : ""}
  ${imageUrl ? `<meta property="og:image:alt" content="${escapeHtml(displayName)}">` : ""}

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">` : ""}
  <!-- /Dynamic Open Graph -->
`;

  html = html.replace("</head>", `${meta}\n</head>`);

  const headers = new Headers(originalResponse.headers);

  // Preview event bisa berubah ketika Admin di-edit.
  headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

  return new Response(html, {
    status: originalResponse.status,
    statusText: originalResponse.statusText,
    headers
  });
}
