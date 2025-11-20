export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  let limit = parseInt(url.searchParams.get("limit") || "20", 10);
  if (!Number.isFinite(limit) || limit <= 0) limit = 20;
  if (limit > 50) limit = 50;

  try {
    const stmt = `
      SELECT v.*, m.display_name AS model_name
      FROM videos v
      LEFT JOIN models m ON v.model_id = m.id
      ORDER BY RANDOM()
      LIMIT ?;
    `;
    const { results } = await env.DB.prepare(stmt).bind(limit).all();

    return new Response(JSON.stringify({
      items: results,
      hasNext: results.length === limit
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: "internal_error",
      message: String(err)
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
