const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });

export async function onRequestGet(context) {
  const slug = (new URL(context.request.url).searchParams.get("slug") || "").trim();

  if (!slug || slug.length > 80) {
    return json({ error: "Slug tidak valid" }, 400);
  }

  const row = await context.env.DB.prepare(`
    SELECT
      slug,
      event_type,
      event_type_label,
      event_label,
      event_title,
      main_name,
      subtitle,
      event_date,
      event_time,
      location,
      maps_url,
      music_url,
      dresscode_title,
      dresscode_note,
      dresscode_male_colors,
      dresscode_female_colors,
      description,
      cover_url,
      gallery_urls,
      created_at,
      updated_at
    FROM events
    WHERE slug = ?
  `).bind(slug).first();

  if (!row) {
    return json({ error: "Acara tidak ditemukan" }, 404);
  }

  row.gallery_urls = row.gallery_urls ? JSON.parse(row.gallery_urls) : [];

  try {
    row.dresscode_male_colors = row.dresscode_male_colors
      ? JSON.parse(row.dresscode_male_colors)
      : [];
  } catch {
    row.dresscode_male_colors = [];
  }

  try {
    row.dresscode_female_colors = row.dresscode_female_colors
      ? JSON.parse(row.dresscode_female_colors)
      : [];
  } catch {
    row.dresscode_female_colors = [];
  }

  return json({ event: row });
}
