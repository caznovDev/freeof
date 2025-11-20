// /functions/api/videos/[id].js
// Single video endpoint by numeric id

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function onRequest(context) {
  const db = context.env.DB;
  const idParam = context.params.id;

  const id = parseInt(idParam, 10);
  if (!id || Number.isNaN(id)) {
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
      m.slug         AS model_slug,
      m.display_name AS model_name,
      m.avatar_url   AS model_avatar,
      m.bio          AS model_bio
    FROM videos v
    LEFT JOIN models m ON v.model_id = m.id
    WHERE v.id = ?
    LIMIT 1
  `;

  try {
    const res = await db.prepare(sql).bind(id).all();
    const row = res.results && res.results[0];
    if (!row) {
      return jsonResponse({ error: "Video not found" }, 404);
    }
    return jsonResponse(row);
  } catch (err) {
    return jsonResponse(
      { error: "DB error in /api/videos/:id", detail: String(err) },
      500
    );
  }
}
