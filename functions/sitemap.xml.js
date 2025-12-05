// functions/sitemap.xml.js

export const onRequestGet = async ({ env, request }) => {
  const baseUrl = "https://freeof.pages.dev"; // se quiser, pode ler de request.url

  // =============================
  // 1) Buscar dados da D1
  // =============================
  const modelsRes = await env.DB.prepare(`
    SELECT slug, created_at, updated_at
    FROM models
  `).all();

  const videosRes = await env.DB.prepare(`
    SELECT slug, title, description, thumbnail_url, video_url, created_at, updated_at
    FROM videos
  `).all();

  const models = modelsRes.results || [];
  const videos = videosRes.results || [];

  // Helper pra lastmod
  const isoDate = (row) => {
    const raw = row.updated_at || row.created_at;
    if (!raw) return "";
    // D1 armazena texto ISO/SQL; vamos só garantir um formato aceito
    try {
      return new Date(raw).toISOString().split("T")[0]; // YYYY-MM-DD
    } catch (e) {
      return "";
    }
  };

  // Escape básico pra XML (loc / urls)
  const esc = (str = "") =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  // Pra título/descrição de vídeo, é melhor usar CDATA
  const cdata = (str = "") => `<![CDATA[${str}]]>`;

  // =============================
  // 2) Montar XML
  // =============================
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n`;

  // --------- Página inicial ---------
  xml += `
  <url>
    <loc>${esc(baseUrl + "/")}</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  `;

  // --------- Página de modelos (ajuste o path se for outro) ---------
  xml += `
  <url>
    <loc>${esc(baseUrl + "/onlyf")}</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  `;

  // --------- Páginas de cada modelo ---------
  for (const m of models) {
    const loc = `${baseUrl}/model/${m.slug}`;
    const lastmod = isoDate(m);

    xml += `
  <url>
    <loc>${esc(loc)}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
    `;
  }

  // --------- Páginas de vídeo + marcação de vídeo ---------
  for (const v of videos) {
    const loc = `${baseUrl}/watch/${v.slug}`;
    const lastmod = isoDate(v);

    const thumb = v.thumbnail_url || "";
    const title = v.title || v.slug;
    const desc =
      v.description ||
      `Watch ${title} on freeof.pages.dev`;

    const contentLoc = v.video_url || loc; // se não tiver URL do arquivo, usa a página mesmo

    xml += `
  <url>
    <loc>${esc(loc)}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <video:video>
      ${thumb ? `<video:thumbnail_loc>${esc(thumb)}</video:thumbnail_loc>` : ""}
      <video:title>${cdata(title)}</video:title>
      <video:description>${cdata(desc)}</video:description>
      <video:content_loc>${esc(contentLoc)}</video:content_loc>
    </video:video>
  </url>
    `;
  }

  xml += `</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "max-age=3600",
    },
  });
};
