
export async function onRequestGet(context) {
  const { slug } = context.params;
  const url = new URL(context.request.url);
  const limit = Number(url.searchParams.get("limit") || 6);

  const sql = `
    SELECT v.* FROM videos v
    JOIN models m ON v.model_id=m.id
    WHERE m.slug=? AND v.is_sfw=1
    ORDER BY v.created_at DESC
    LIMIT ?`;

  const rows = await context.env.DB.prepare(sql).bind(slug, limit).all();
  return Response.json(rows.results);
}
