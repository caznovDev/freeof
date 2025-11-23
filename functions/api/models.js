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

  const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
  const limitRaw = parseInt(url.searchParams.get("limit") || "20", 10);
  const limit = Math.min(Math.max(limitRaw, 1), 50);
  const offset = (page - 1) * limit;

  const sql = `
    SELECT
      id,
      slug,
      display_name,
      avatar_url,
      banner_url,
      bio,
      created_at
    FROM models
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
  `;

  try {
    const { results } = await db.prepare(sql).bind(limit, offset).all();
    return jsonResponse({
      page,
      limit,
      count: results.length,
      items: results
    });
  } catch (err) {
    return jsonResponse({ error: "DB error in /api/models", detail: String(err) }, 500);
  }
}
