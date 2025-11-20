// /functions/api/models.js
// GET  -> list models (paginated)
// POST -> create new model (simple API key)

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function getAdminKey(env) {
  return env.ADMIN_API_KEY || "freeof_admin_7f4b9c2e6a1d4c89";
}

function isAuthorized(request, env) {
  const url = new URL(request.url);
  const headerKey = request.headers.get("x-api-key");
  const queryKey = url.searchParams.get("key");
  const provided = headerKey || queryKey;
  const expected = getAdminKey(env);
  return !!provided && provided === expected;
}

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const method = request.method.toUpperCase();

  if (method === "GET") {
    const url = new URL(request.url);

    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const limitRaw = parseInt(url.searchParams.get("limit") || "20", 10);
    const limit = Math.min(Math.max(limitRaw, 1), 50);
    const offset = (page - 1) * limit;

    const listSql = `
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

    const countSql = `
      SELECT COUNT(*) AS total
      FROM models
    `;

    try {
      const [listRes, countRes] = await Promise.all([
        db.prepare(listSql).bind(limit, offset).all(),
        db.prepare(countSql).all(),
      ]);

      const items = listRes.results || [];
      const totalRow =
        (countRes.results && countRes.results[0]) || { total: 0 };
      const total =
        typeof totalRow.total === "number" ? totalRow.total : 0;
      const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

      const meta = {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      };

      return jsonResponse({
        ...meta,
        items,
      });
    } catch (err) {
      return jsonResponse(
        { error: "DB error in /api/models (GET)", detail: String(err) },
        500
      );
    }
  }

  if (method === "POST") {
    if (!isAuthorized(request, env)) {
      return jsonResponse(
        { error: "Unauthorized", message: "Invalid or missing API key" },
        401
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        { error: "Invalid JSON body" },
        400
      );
    }

    const slug = (body.slug || "").trim();
    const displayName = (body.display_name || "").trim();
    const avatarUrl = body.avatar_url || null;
    const bannerUrl = body.banner_url || null;
    const bio = body.bio || null;

    if (!slug || !displayName) {
      return jsonResponse(
        { error: "Missing fields", required: ["slug", "display_name"] },
        400
      );
    }

    const insertSql = `
      INSERT INTO models (slug, display_name, avatar_url, banner_url, bio)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      const result = await db
        .prepare(insertSql)
        .bind(slug, displayName, avatarUrl, bannerUrl, bio)
        .run();

      const newId =
        result && result.meta && typeof result.meta.last_row_id === "number"
          ? result.meta.last_row_id
          : null;

      return jsonResponse(
        {
          success: true,
          id: newId,
          slug,
          display_name: displayName,
        },
        201
      );
    } catch (err) {
      return jsonResponse(
        { error: "DB error in /api/models (POST)", detail: String(err) },
        500
      );
    }
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
}
