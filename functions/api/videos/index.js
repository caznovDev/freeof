// functions/api/videos/index.js

export const onRequestGet = async ({ env, request }) => {
  const url = new URL(request.url);

  const id = url.searchParams.get("id");
  const modelId = url.searchParams.get("model_id");
  const modelSlug = url.searchParams.get("model_slug");

  const sortParam = (url.searchParams.get("sort") || "recent").toLowerCase();

  let page = parseInt(url.searchParams.get("page") || "1", 10);
  let limit = parseInt(url.searchParams.get("limit") || "24", 10);

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = 24;
  if (limit > 100) limit = 100;

  const offset = (page - 1) * limit;

  try {
    // =========================
    // 1) Buscar UM vídeo por ID
    // =========================
    if (id) {
      const stmt = env.DB.prepare(`
        SELECT
          v.*,
          m.slug         AS model_slug,
          m.display_name AS model_name
        FROM videos v
        LEFT JOIN models m ON v.model_id = m.id
        WHERE v.id = ?
      `);

      const video = await stmt.bind(id).first();

      if (!video) {
        return jsonResponse({ error: "Video not found" }, 404);
      }

      return jsonResponse(video);
    }

    // =====================================
    // 2) Listar vídeos (geral ou por modelo)
    // =====================================
    const whereClauses = [];
    const params = [];
    let joinModels = false;

    if (modelId) {
      whereClauses.push("v.model_id = ?");
      params.push(modelId);
    }

    if (modelSlug) {
      joinModels = true;
      whereClauses.push("m.slug = ?");
      params.push(modelSlug);
    }

    const whereSql =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    let orderBySql = "ORDER BY v.created_at DESC"; // default: recentes
    if (sortParam === "popular") {
      orderBySql = "ORDER BY v.views DESC, v.created_at DESC";
    }

    const baseFrom = joinModels
      ? `FROM videos v
         LEFT JOIN models m ON v.model_id = m.id`
      : `FROM videos v
         LEFT JOIN models m ON v.model_id = m.id`; // ainda fazemos join pra ter model_slug/model_name

    // ---- Contagem total ----
    const countStmt = env.DB.prepare(`
      SELECT COUNT(*) AS total
      ${baseFrom}
      ${whereSql}
    `);

    const countRow = await countStmt.bind(...params).first();
    const total = countRow?.total || 0;

    // ---- Lista de vídeos ----
    const listStmt = env.DB.prepare(`
      SELECT
        v.*,
        m.slug         AS model_slug,
        m.display_name AS model_name
      ${baseFrom}
      ${whereSql}
      ${orderBySql}
      LIMIT ? OFFSET ?
    `);

    const listParams = [...params, limit, offset];
    const { results } = await listStmt.bind(...listParams).all();

    const hasMore = page * limit < total;

    return jsonResponse({
      items: results || [],
      page,
      limit,
      total,
      hasMore
    });
  } catch (err) {
    // Log simples pro console do Worker
    console.error("Error in /api/videos:", err);
    return jsonResponse(
      { error: "Internal server error" },
      500
    );
  }
};

// Helper pra resposta JSON
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
