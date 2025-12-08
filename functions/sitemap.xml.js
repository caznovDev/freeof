
export async function onRequestGet(context) {
  const db = context.env.DB;
  const models = await db.prepare("SELECT slug FROM models").all();
  const base = context.request.url.replace("/sitemap.xml", "");

  let body = '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  body += `<url><loc>${base}/</loc></url>`;
  models.results.forEach(m => {
    body += `<url><loc>${base}/website/${m.slug}</loc></url>`
  });
  body += "</urlset>";

  return new Response(body, { headers: { "Content-Type": "application/xml" } });
}
