export const onRequestGet = async ({ env }) => {
  const baseUrl = "https://freeof.pages.dev";

  // =============================
  // 1) Buscar dados da D1 com segurança
  // =============================

  let models = [];
  let videos = [];

  try {
    const m = await env.DB.prepare(`SELECT slug, created_at FROM models`).all();
    models = m?.results || [];
  } catch (e) {
    models = [];
  }

  try {
    const v = await env.DB.prepare(`
      SELECT slug, title, description, thumbnail_url, video_url, created_at
      FROM videos
    `).all();
    videos = v?.results || [];
  } catch (e) {
    videos = [];
  }

  // Helper: converte dates em YYYY-MM-DD, ignorando erros
  const date = (row) => {
    try {
      return new Date(row?.created_at).toISOString().split("T")[0];
    } catch (e) {
      return "";
    }
  };

  // Escapar XML
  const esc = (s = "") =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const cdata = (s = "") => `<![CDATA[${s}]]>`;

  // =============================
  // 2) Construir XML
  // =============================
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset 
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
  >`;

  // Página inicial
  xml += `
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>`;

  // Página de modelos
  xml += `
  <url>
    <loc>${baseUrl}/onlyf</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

  // Páginas de cada modelo
  for (const m of models) {
    xml += `
  <url>
    <loc>${baseUrl}/model/${esc(m.slug)}</loc>
    <lastmod>${date(m)}</lastmod>
    <priority>0.8</priority>
  </url>`;
  }

  // Vídeos
  for (const v of videos) {
    const watchUrl = `${baseUrl}/watch/${v.slug}`;
    xml += `
  <url>
    <loc>${watchUrl}</loc>
    <lastmod>${date(v)}</lastmod>
    <priority>0.7</priority>
    <video:video>
      <video:title>${cdata(v.title || v.slug)}</video:title>
      <video:description>${cdata(v.description || "")}</video:description>
      ${v.thumbnail_url ? `<video:thumbnail_loc>${esc(v.thumbnail_url)}</video:thumbnail_loc>` : ""}
      ${v.video_url ? `<video:content_loc>${esc(v.video_url)}</video:content_loc>` : ""}
    </video:video>
  </url>`;
  }

  xml += `\n</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
};
