
export async function onRequestGet(context) {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const featured = url.searchParams.get("featured") === "true";
  const limit = Number(url.searchParams.get("limit") || 20);

  let sql = "SELECT * FROM models";
  if (featured) sql += " WHERE is_featured=1";
  sql += " ORDER BY created_at DESC LIMIT ?";

  const data = await db.prepare(sql).bind(limit).all();
  return Response.json(data.results);
}
