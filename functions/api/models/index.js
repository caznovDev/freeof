// functions/api/models/index.js

export const onRequestGet = async ({ env, request }) => {
  const url = new URL(request.url);

  const slug = url.searchParams.get("slug");

  let page = parseInt(url.searchParams.get("page") || "1", 10);
  let limit = parseInt(url.searchParams.get("limit") || "24", 10);

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = 24;
  if (limit > 100) limit = 100;

  const offset = (page - 1) * limit;

  try {
    // =========================
    // 1) Buscar UM modelo por slug
    // =========================
    if (slug) {
      const stmt = env.DB.prepare(`
        SELECT *
        FROM models
        WHERE slug = ?
      `);

      const model = await stmt.bind(slug).first();

      if (!model) {
        return jsonResponse({ error: "Model not found" }, 404);
      }

      return jsonResponse(model);
    }

    // =========================
    // 2) Listar modelos paginados
    // =========================
    const whereSql = ""; // por enquanto sem filtros extras

    // ---- Contagem total ----
    const countStmt = env.DB.prepare(`
      SELECT COUNT(*) AS total
      FROM models
      ${whereSql}
    `);

    const countRow = await countStmt.first();
    const total = countRow?.total || 0;

    // ---- Lista de modelos ----
    const listStmt = env.DB.prepare(`
      SELECT *
      FROM models
      ${whereSql}
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?
    `);

    const { results } = await listStmt.bind(limit, offset).all();
    const hasMore = page * limit < total;

    return jsonResponse({
      items: results || [],
      page,
      limit,
      total,
      hasMore
    });
  } catch (err) {
    console.error("Error in /api/models:", err);
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
