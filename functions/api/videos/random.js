import { jsonResponse, errorResponse, getPagination } from "../../_utils";

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  try {
    const { page, limit } = getPagination(searchParams, 20, 50);

    const totalRow = await db
      .prepare("SELECT COUNT(*) as c FROM videos")
      .all();
    const total = totalRow.results?.[0]?.c || 0;
    if (!total) {
      return jsonResponse({ items: [], page, limit, total: 0, hasMore: false });
    }

    const rows = await db
      .prepare(
        `
        SELECT v.*, m.display_name AS model_name, m.slug AS model_slug
        FROM videos v
        LEFT JOIN models m ON v.model_id = m.id
        ORDER BY RANDOM()
        LIMIT ?
      `
      )
      .bind(limit)
      .all();

    // For "random", hasMore is always true while page*limit < total, but
    // random order means it's soft.
    const hasMore = page * limit < total;

    return jsonResponse({
      items: rows.results || [],
      page,
      limit,
      total,
      hasMore
    });
  } catch (err) {
    return errorResponse(err.message || "Random videos error", 500);
  }
}
