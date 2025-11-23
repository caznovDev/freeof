import { jsonResponse, errorResponse, getPagination, requireApiKey } from "../../_utils";

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const slug = searchParams.get("slug");

  try {
    if (slug) {
      const stmt = db.prepare(`
        SELECT id, slug, display_name, avatar_url, banner_url, bio, created_at
        FROM models
        WHERE slug = ?
      `);
      const row = await stmt.get(slug);
      if (!row) return jsonResponse({ items: [] });
      return jsonResponse({ items: [row] });
    }

    const { page, limit, offset } = getPagination(searchParams, 12, 100);
    const sort = (searchParams.get("sort") || "recent").toLowerCase();
    const orderBy =
      sort === "recent"
        ? "created_at DESC"
        : "display_name COLLATE NOCASE ASC";

    const rows = await db
      .prepare(
        `
        SELECT id, slug, display_name, avatar_url, banner_url, bio, created_at
        FROM models
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `
      )
      .bind(limit, offset)
      .all();

    const totalRow = await db
      .prepare("SELECT COUNT(*) as c FROM models")
      .all();
    const total = totalRow.results?.[0]?.c || 0;
    const hasMore = page * limit < total;

    return jsonResponse({
      items: rows.results || [],
      page,
      limit,
      total,
      hasMore
    });
  } catch (err) {
    return errorResponse(err.message || "Models error", 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.DB;

  try {
    requireApiKey(request, env);

    const body = await request.json();
    const { slug, display_name, avatar_url = null, banner_url = null, bio = null } = body;

    if (!slug || !display_name) {
      return errorResponse("Missing slug or display_name", 400);
    }

    const stmt = db.prepare(`
      INSERT INTO models (slug, display_name, avatar_url, banner_url, bio)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = await stmt.bind(slug, display_name, avatar_url, banner_url, bio).run();

    return jsonResponse({
      id: info.meta.last_row_id,
      slug,
      display_name,
      avatar_url,
      banner_url,
      bio
    }, 201);
  } catch (err) {
    if (err.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse(err.message || "Models insert error", 500);
  }
}
