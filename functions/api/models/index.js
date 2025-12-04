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
    console.error("Error in /api/models GET:", err);
    return jsonResponse(
      { error: "Internal server error" },
      500
    );
  }
};

// =========================
// POST /api/models
// Cria um novo model
// =========================
export const onRequestPost = async ({ env, request }) => {
  try {
    // 🔐 Proteção opcional com x-api-key (compatível com teu script)
    const authError = requireAdminApiKey(env, request);
    if (authError) return authError;

    const contentType = request.headers.get("content-type") || "";
    let data;

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

    let {
      slug,
      display_name,
      avatar_url,
      banner_url,
      bio
    } = data || {};

    if (!display_name) {
      return jsonResponse(
        { error: "Missing required field: display_name" },
        400
      );
    }

    // Normaliza / gera slug
    slug = (slug || display_name || "")
      .toString()
      .toLowerCase()
      .trim();
    slug = slugify(slug);

    if (!slug) {
      return jsonResponse({ error: "Could not generate slug" }, 400);
    }

    avatar_url = avatar_url || null;
    banner_url = banner_url || null;
    bio = bio || null;

    // Inserir na D1 com tratamento de slug duplicado
    let finalSlug = slug;
    let meta = null;
    let attempt = 0;

    while (attempt < 5) {
      try {
        const stmt = env.DB.prepare(`
          INSERT INTO models (
            slug,
            display_name,
            avatar_url,
            banner_url,
            bio
          ) VALUES (?, ?, ?, ?, ?)
        `);

        const result = await stmt
          .bind(finalSlug, display_name, avatar_url, banner_url, bio)
          .run();

        meta = result.meta;
        break;
      } catch (err) {
        const msg = String(err || "");
        if (msg.includes("UNIQUE") && msg.includes("models.slug")) {
          // gera novo slug se já existir
          attempt += 1;
          finalSlug = `${slug}-${Date.now().toString(36).slice(-4)}-${attempt}`;
          continue;
        }
        console.error("Error inserting model:", err);
        return jsonResponse({ error: "Failed to insert model" }, 500);
      }
    }

    if (!meta) {
      return jsonResponse(
        { error: "Could not generate a unique slug for this model" },
        500
      );
    }

    const newId = meta.last_row_id;

    // Buscar o model recém-criado
    const selectStmt = env.DB.prepare(`
      SELECT *
      FROM models
      WHERE id = ?
    `);

    const model = await selectStmt.bind(newId).first();

    // 🔥 MUITO IMPORTANTE: retornar JSON com id + slug + 201
    return jsonResponse(
      model || {
        id: newId,
        slug: finalSlug,
        display_name,
        avatar_url,
        banner_url,
        bio
      },
      201
    );
  } catch (err) {
    console.error("Error in /api/models POST:", err);
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

// Helper simples pra gerar slug
function slugify(str) {
  return String(str)
    .normalize("NFKD")                  // remove acentos
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")        // troca qualquer coisa que não é [a-z0-9] por "-"
    .replace(/^-+|-+$/g, "")            // tira "-" do começo/fim
    .slice(0, 80)                       // limite de tamanho
    || `model-${Date.now().toString(36)}`;
}

// Proteção simples por x-api-key (compatível com o script do Colab)
function requireAdminApiKey(env, request) {
  const headerKey = request.headers.get("x-api-key");
  const expectedKey = env.ADMIN_API_KEY || "freeof_admin_7f4b9c2e6a1d4c89";

  if (!headerKey || headerKey !== expectedKey) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  return null;
}
