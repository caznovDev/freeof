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
    console.error("Error in /api/videos:", err);
    return jsonResponse(
      { error: "Internal server error" },
      500
    );
  }
};

// =========================
// POST /api/videos
// Cria um novo vídeo
// =========================
export const onRequestPost = async ({ env, request }) => {
  try {
    const contentType = request.headers.get("content-type") || "";
    let data;

    // Aceita JSON ou form-urlencoded
    if (contentType.includes("application/json")) {
      data = await request.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData();
      data = Object.fromEntries(form);
    } else {
      return jsonResponse(
        { error: "Unsupported Content-Type. Use application/json or x-www-form-urlencoded." },
        415
      );
    }

    const {
      slug,
      title,
      thumbnail_url,
      video_url,
      channel_name,
      views,
      duration_seconds,
      description,
      model_id
    } = data || {};

    // Campos obrigatórios
    if (!title || !video_url) {
      return jsonResponse(
        { error: "Missing required fields: title and video_url" },
        400
      );
    }

    // Slug: usa o enviado ou gera a partir do título
    let finalSlug = (slug || "").trim();
    if (!finalSlug) {
      finalSlug = slugify(title);
    }

    const numericViews =
      views !== undefined && views !== null && views !== ""
        ? Number(views)
        : 0;
    const numericDuration =
      duration_seconds !== undefined && duration_seconds !== null && duration_seconds !== ""
        ? Number(duration_seconds)
        : null;
    const numericModelId =
      model_id !== undefined && model_id !== null && model_id !== ""
        ? Number(model_id)
        : null;

    // Tentativa de inserir, tratando conflito de slug
    let attempt = 0;
    let meta = null;
    let currentSlug = finalSlug;

    while (attempt < 5) {
      try {
        const stmt = env.DB.prepare(`
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
        `);

        const result = await stmt
          .bind(
            currentSlug,
            title,
            thumbnail_url || null,
            video_url,
            channel_name || null,
            Number.isFinite(numericViews) ? numericViews : 0,
            Number.isFinite(numericDuration) ? numericDuration : null,
            description || null,
            Number.isFinite(numericModelId) ? numericModelId : null
          )
          .run();

        meta = result.meta;
        finalSlug = currentSlug;
        break;
      } catch (err) {
        const msg = String(err || "");
        // Conflito de UNIQUE(slug) → gera outro slug e tenta de novo
        if (msg.includes("UNIQUE") && msg.includes("videos.slug")) {
          attempt += 1;
          currentSlug = `${slugify(title)}-${Date.now().toString(36).slice(-4)}-${attempt}`;
          continue;
        }

        console.error("Error inserting video:", err);
        return jsonResponse({ error: "Failed to insert video" }, 500);
      }
    }

    if (!meta) {
      return jsonResponse(
        { error: "Could not generate a unique slug for this video" },
        500
      );
    }

    const newId = meta.last_row_id;

    // Buscar o vídeo recém-criado (já com model_name/model_slug)
    const selectStmt = env.DB.prepare(`
      SELECT
        v.*,
        m.slug         AS model_slug,
        m.display_name AS model_name
      FROM videos v
      LEFT JOIN models m ON v.model_id = m.id
      WHERE v.id = ?
    `);

    const video = await selectStmt.bind(newId).first();

    return jsonResponse(video || { id: newId, slug: finalSlug }, 201);
  } catch (err) {
    console.error("Error in POST /api/videos:", err);
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

// Helper simples pra gerar slug a partir do título
function slugify(str) {
  return String(str)
    .normalize("NFKD")                  // remove acentos
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")        // troca qualquer coisa que não é [a-z0-9] por "-"
    .replace(/^-+|-+$/g, "")            // tira "-" do começo/fim
    .slice(0, 80)                       // limite de tamanho
    || `video-${Date.now().toString(36)}`;
}
