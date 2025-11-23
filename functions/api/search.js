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
  const q = (url.searchParams.get("q") || "").trim();

  if (!q) {
    return jsonResponse({ error: "Missing query parameter 'q'" }, 400);
  }

  const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
  const limitRaw = parseInt(url.searchParams.get("limit") || "20", 10);
  const limit = Math.min(Math.max(limitRaw, 1), 50);
  const offset = (page - 1) * limit;

  const like = `%${q}%`;
  const params = [like, like, like];

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
    WHERE
      v.title LIKE ?
      OR v.description LIKE ?
      OR m.display_name LIKE ?
    ORDER BY v.views DESC, v.created_at DESC
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);

  try {
    const { results } = await db.prepare(sql).bind(...params).all();
    return jsonResponse({
      page,
      limit,
      count: results.length,
      items: results
    });
  } catch (err) {
    return jsonResponse({ error: "DB error in /api/search", detail: String(err) }, 500);
  }
}
