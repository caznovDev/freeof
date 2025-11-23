// Small helper to always send JSON with CORS enabled
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

export async function onRequest(context) {
  const db = context.env.DB;
  const { id } = context.params;
  const num = parseInt(id, 10);

  if (Number.isNaN(num)) {
    return jsonResponse({ error: "Invalid id" }, 400);
  }

  const sql = `
    SELECT
      v.id,
      v.slug,
      v.title,
      v.thumbnail_url,
      v.video_url,
      v.channel_name,
      v.views,
      v.duration_seconds,
      v.description,
      v.model_id,
      v.created_at,
      m.id           AS model_id_real,
      m.slug         AS model_slug,
      m.display_name AS model_name,
      m.avatar_url   AS model_avatar,
      m.banner_url   AS model_banner,
      m.bio          AS model_bio,
      m.created_at   AS model_created_at
    FROM videos v
    LEFT JOIN models m ON v.model_id = m.id
    WHERE v.id = ?
    LIMIT 1
  `;

  try {
    const { results } = await db.prepare(sql).bind(num).all();
    if (!results || results.length === 0) {
      return jsonResponse({ error: "Not found" }, 404);
    }
    return jsonResponse(results[0]);
  } catch (err) {
    return jsonResponse({ error: "DB error in /api/videos/:id", detail: String(err) }, 500);
  }
}
