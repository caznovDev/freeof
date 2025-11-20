// /functions/api/videos.js
// GET  -> list videos (paginated, filters)
// POST -> create new video (simple API key)

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

    const sortParam = (url.searchParams.get("sort") || "recent").toLowerCase();
    let orderBy;
    switch (sortParam) {
      case "popular":
        orderBy = "v.views DESC";
        break;
      case "oldest":
        orderBy = "v.created_at ASC, v.id ASC";
        break;
      case "random":
        orderBy = "RANDOM()";
        break;
      case "recent":
      default:
        orderBy = "v.created_at DESC, v.id DESC";
        break;
    }

    const modelIdParam = url.searchParams.get("model_id");
    const modelSlugParam = url.searchParams.get("model_slug");
    const whereClauses = [];
    const params = [];

    if (modelIdParam) {
      const id = parseInt(modelIdParam, 10);
      if (!Number.isNaN(id)) {
        whereClauses.push("v.model_id = ?");
        params.push(id);
      }
    }

    if (modelSlugParam) {
      whereClauses.push("m.slug = ?");
      params.push(modelSlugParam);
    }

    const whereSql =
      whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    const baseSelect = `
      FROM videos v
      LEFT JOIN models m ON v.model_id = m.id
      ${whereSql}
    `;

    const listSql = `
      SELECT
        v.id,
        v.slug,
        v.title,
        v.thumbnail_url,
        v.video_url,
        v.channel_name,
        v.views,
        v.duration_seconds,
        v.description,
        v.model_id,
        v.created_at,
        m.id           AS model_id_real,
        m.slug         AS model_slug,
        m.display_name AS model_name,
        m.avatar_url   AS model_avatar
      ${baseSelect}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      ${baseSelect}
    `;

    const paramsForCount = [...params];
    const paramsForList = [...params, limit, offset];

    try {
      const [listRes, countRes] = await Promise.all([
        db.prepare(listSql).bind(...paramsForList).all(),
        db.prepare(countSql).bind(...paramsForCount).all(),
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
        { error: "DB error in /api/videos (GET)", detail: String(err) },
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
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const slug = (body.slug || "").trim();
    const title = (body.title || "").trim();
    const videoUrl = (body.video_url || "").trim();
    const thumbnailUrl = body.thumbnail_url || null;
    const channelName = body.channel_name || null;
    const description = body.description || null;
    const views =
      typeof body.views === "number" && body.views >= 0 ? body.views : 0;
    const durationSeconds =
      typeof body.duration_seconds === "number" && body.duration_seconds >= 0
        ? body.duration_seconds
        : null;
    const modelId =
      typeof body.model_id === "number" && body.model_id > 0
        ? body.model_id
        : null;

    if (!slug || !title || !videoUrl) {
      return jsonResponse(
        {
          error: "Missing fields",
          required: ["slug", "title", "video_url"],
        },
        400
      );
    }

    const insertSql = `
      INSERT INTO videos (
        slug,
        title,
        thumbnail_url,
        video_url,
        channel_name,
        views,
        duration_seconds,
        description,
        model_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await db
        .prepare(insertSql)
        .bind(
          slug,
          title,
          thumbnailUrl,
          videoUrl,
          channelName,
          views,
          durationSeconds,
          description,
          modelId
        )
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
          title,
        },
        201
      );
    } catch (err) {
      return jsonResponse(
        { error: "DB error in /api/videos (POST)", detail: String(err) },
        500
      );
    }
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
}
