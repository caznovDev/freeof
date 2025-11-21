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
  const slug = url.searchParams.get("slug");
  const sort = (url.searchParams.get("sort") || "recent").toLowerCase();
  let page = parseInt(url.searchParams.get("page") || "1", 10);
  let limit = parseInt(url.searchParams.get("limit") || "20", 10);

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit <= 0) limit = 20;
  if (limit > 100) limit = 100;

  const where = [];
  const params = [];

  if (id) {
    where.push("m.id = ?");
    params.push(id);
  }
  if (slug) {
    where.push("m.slug = ?");
    params.push(slug);
  }

  let orderBy = "m.created_at DESC";
  if (sort === "alpha") {
    orderBy = "m.display_name COLLATE NOCASE ASC";
  } else if (sort === "random") {
    orderBy = "RANDOM()";
  }

  let sql = `
    SELECT m.*
    FROM models m
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
    display_name,
    avatar_url,
    banner_url,
    bio
  } = body || {};

  if (!slug || !display_name) {
    return jsonResponse({ error: "missing_fields", message: "slug and display_name are required" }, 400);
  }

  try {
    const stmt = `
      INSERT INTO models (slug, display_name, avatar_url, banner_url, bio)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        banner_url = excluded.banner_url,
        bio = excluded.bio
      RETURNING *;
    `;

    const result = await env.DB
      .prepare(stmt)
      .bind(
        slug,
        display_name,
        avatar_url || null,
        banner_url || null,
        bio || null
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
