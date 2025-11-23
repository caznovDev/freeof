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
  const { slug } = context.params;
  const url = new URL(context.request.url);

  if (!slug) {
    return jsonResponse({ error: "Missing slug" }, 400);
  }

  const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
  const limitRaw = parseInt(url.searchParams.get("limit") || "20", 10);
  const limit = Math.min(Math.max(limitRaw, 1), 50);
  const offset = (page - 1) * limit;

  try {
    const modelSql = `
      SELECT
        id,
        slug,
        display_name,
        avatar_url,
        banner_url,
        bio,
        created_at
      FROM models
      WHERE slug = ?
      LIMIT 1
    `;
    const modelRes = await db.prepare(modelSql).bind(slug).all();
    if (!modelRes.results || modelRes.results.length === 0) {
      return jsonResponse({ error: "Not found" }, 404);
    }
    const model = modelRes.results[0];
    const modelId = model.id;

    const videosSql = `
      SELECT
        id,
        slug,
        title,
        thumbnail_url,
        video_url,
        channel_name,
        views,
        duration_seconds,
        description,
        model_id,
        created_at
      FROM videos
      WHERE model_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?
    `;
    const videosRes = await db
      .prepare(videosSql)
      .bind(modelId, limit, offset)
      .all();

    return jsonResponse({
      model,
      videos: {
        page,
        limit,
        count: videosRes.results.length,
        items: videosRes.results
      }
    });
  } catch (err) {
    return jsonResponse({ error: "DB error in /api/models/slug/:slug", detail: String(err) }, 500);
  }
}
