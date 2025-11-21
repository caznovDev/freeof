const DEFAULT_API_SECRET = "freeof_super_secret_7b3e9d";

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
    }
  });
}

function checkAuth(request, env) {
  const url = new URL(request.url);
  const headerKey = request.headers.get("x-api-key");
  const queryKey = url.searchParams.get("key");
  const provided = headerKey || queryKey;
  const expected = env.API_SECRET || DEFAULT_API_SECRET;
  return !!provided && provided === expected;
}

export async function onRequestOptions(context) {
  return jsonResponse({}, 204);
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  const id = url.searchParams.get("id");
  const modelId = url.searchParams.get("model_id");
  const modelSlug = url.searchParams.get("model_slug");
  const sort = (url.searchParams.get("sort") || "recent").toLowerCase();
  let page = parseInt(url.searchParams.get("page") || "1", 10);
  let limit = parseInt(url.searchParams.get("limit") || "20", 10);

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit <= 0) limit = 20;
  if (limit > 100) limit = 100;

  const where = [];
  const params = [];

  if (id) {
    where.push("v.id = ?");
    params.push(id);
  }
  if (modelId) {
    where.push("v.model_id = ?");
    params.push(modelId);
  }
  if (modelSlug) {
    where.push("m.slug = ?");
    params.push(modelSlug);
  }

  let orderBy = "v.created_at DESC";
  if (sort === "popular") {
    orderBy = "v.views DESC, v.created_at DESC";
  } else if (sort === "random") {
    orderBy = "RANDOM()";
  }

  let sql = `
    SELECT v.*, m.display_name AS model_name, m.slug AS model_slug
    FROM videos v
    LEFT JOIN models m ON v.model_id = m.id
  `;

  if (where.length) {
    sql += " WHERE " + where.join(" AND ");
  }

  const offset = (page - 1) * limit;
  sql += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  try {
    const { results } = await env.DB.prepare(sql).bind(...params).all();

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

export async function onRequestPost(context) {
  const { env, request } = context;

  if (!checkAuth(request, env)) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  let {
    slug,
    title,
    thumbnail_url,
    video_url,
    channel_name,
    views,
    duration_seconds,
    description,
    model_id,
    model_slug
  } = body || {};

  if (!video_url || !title) {
    return jsonResponse({ error: "missing_fields", message: "title and video_url are required" }, 400);
  }

  try {
    if (!model_id && model_slug) {
      const findModel = await env.DB
        .prepare("SELECT id FROM models WHERE slug = ?")
        .bind(model_slug)
        .first();
      if (findModel && findModel.id) {
        model_id = findModel.id;
      }
    }

    if (!slug) {
      if (crypto && crypto.randomUUID) {
        slug = crypto.randomUUID();
      } else {
        slug = "v_" + Date.now().toString(16);
      }
    }

    if (typeof views !== "number" || views < 0) views = 0;

    const stmt = `
      INSERT INTO videos
        (slug, title, thumbnail_url, video_url, channel_name, views, duration_seconds, description, model_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        thumbnail_url = excluded.thumbnail_url,
        video_url = excluded.video_url,
        channel_name = excluded.channel_name,
        views = excluded.views,
        duration_seconds = excluded.duration_seconds,
        description = excluded.description,
        model_id = excluded.model_id
      RETURNING *;
    `;

    const result = await env.DB
      .prepare(stmt)
      .bind(
        slug,
        title,
        thumbnail_url || null,
        video_url,
        channel_name || null,
        views,
        duration_seconds || null,
        description || null,
        model_id || null
      )
      .first();

    return jsonResponse({ item: result || null });
  } catch (err) {
    return jsonResponse(
      { error: "internal_error", message: String(err) },
      500
    );
  }
}
