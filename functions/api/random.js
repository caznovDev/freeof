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
  const url = new URL(context.request.url);

  const limitRaw = parseInt(url.searchParams.get("limit") || "1", 10);
  const limit = Math.min(Math.max(limitRaw, 1), 50);

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
      m.avatar_url   AS model_avatar
    FROM videos v
    LEFT JOIN models m ON v.model_id = m.id
    ORDER BY RANDOM()
    LIMIT ?
  `;

  try {
    const { results } = await db.prepare(sql).bind(limit).all();
    if (limit === 1) {
      if (!results || results.length === 0) {
        return jsonResponse({ error: "Not found" }, 404);
      }
      return jsonResponse(results[0]);
    }

    return jsonResponse({
      limit,
      count: results.length,
      items: results
    });
  } catch (err) {
    return jsonResponse({ error: "DB error in /api/random", detail: String(err) }, 500);
  }
}
