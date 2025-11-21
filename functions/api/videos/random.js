function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key",
      "Access-Control-Allow-Methods": "GET,OPTIONS"
    }
  });
}

export async function onRequestOptions(context) {
  return jsonResponse({}, 204);
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  let page = parseInt(url.searchParams.get("page") || "1", 10);
  let limit = parseInt(url.searchParams.get("limit") || "20", 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit <= 0) limit = 20;
  if (limit > 50) limit = 50;

  try {
    const stmt = `
      SELECT v.*, m.display_name AS model_name, m.slug AS model_slug
      FROM videos v
      LEFT JOIN models m ON v.model_id = m.id
      ORDER BY RANDOM()
      LIMIT ?;
    `;
    const { results } = await env.DB.prepare(stmt).bind(limit).all();

    return jsonResponse({
      items: results,
      page,
      limit,
      hasMore: results.length === limit
    });
  } catch (err) {
    return jsonResponse(
      { error: "internal_error", message: String(err) },
      500
    );
  }
}
