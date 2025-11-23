import { jsonResponse, errorResponse, getPagination, requireApiKey } from "../../_utils";

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const id = searchParams.get("id");
  const modelId = searchParams.get("model_id");
  const modelSlug = searchParams.get("model_slug");

  try {
    if (id) {
      const stmt = db.prepare(`
        SELECT v.*, m.display_name AS model_name, m.slug AS model_slug
        FROM videos v
        LEFT JOIN models m ON v.model_id = m.id
        WHERE v.id = ?
      `);
      const row = await stmt.get(id);
      if (!row) return jsonResponse({ items: [] }, 404);
      return jsonResponse({ items: [row] });
    }

    let where = [];
    let params = [];

    if (modelId) {
      where.push("v.model_id = ?");
      params.push(modelId);
    }

    if (modelSlug) {
      where.push("m.slug = ?");
      params.push(modelSlug);
    }

    const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";
    const { page, limit, offset } = getPagination(searchParams, 20, 100);
    const sort = (searchParams.get("sort") || "recent").toLowerCase();

    let orderBy = "v.created_at DESC";
    if (sort === "popular") orderBy = "v.views DESC";

    const rows = await db
      .prepare(
        `
        SELECT v.*, m.display_name AS model_name, m.slug AS model_slug
        FROM videos v
        LEFT JOIN models m ON v.model_id = m.id
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `
      )
      .bind(...params, limit, offset)
      .all();

    const countRow = await db
      .prepare(
        `
        SELECT COUNT(*) as c
        FROM videos v
        LEFT JOIN models m ON v.model_id = m.id
        ${whereClause}
      `
      )
      .bind(...params)
      .all();

    const total = countRow.results?.[0]?.c || 0;
    const hasMore = page * limit < total;

    return jsonResponse({
      items: rows.results || [],
      page,
      limit,
      total,
      hasMore
    });
  } catch (err) {
    return errorResponse(err.message || "Videos error", 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.DB;

  try {
    requireApiKey(request, env);
    const body = await request.json();

    const {
      slug,
      title,
      thumbnail_url = null,
      video_url,
      channel_name = null,
      views = 0,
      duration_seconds = null,
      description = null,
      model_id = null
    } = body;

    if (!slug || !title || !video_url) {
      return errorResponse("Missing slug, title or video_url", 400);
    }

    const stmt = db.prepare(`
      INSERT INTO videos (
        slug, title, thumbnail_url, video_url,
        channel_name, views, duration_seconds,
        description, model_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = await stmt
      .bind(
        slug,
        title,
        thumbnail_url,
        video_url,
        channel_name,
        views,
        duration_seconds,
        description,
        model_id
      )
      .run();

    return jsonResponse(
      {
        id: info.meta.last_row_id,
        slug,
        title,
        thumbnail_url,
        video_url,
        channel_name,
        views,
        duration_seconds,
        description,
        model_id
      },
      201
    );
  } catch (err) {
    if (err.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse(err.message || "Videos insert error", 500);
  }
}
