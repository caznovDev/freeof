
export async function onRequestGet(context) {
  const { slug } = context.params;
  const db = context.env.DB;

  const model = await db.prepare("SELECT * FROM models WHERE slug=?").bind(slug).first();
  if (!model) return new Response("Model not found", { status: 404 });

  const url = new URL(model.adult_site_url);
  url.searchParams.set("utm_source", "youtube");
  url.searchParams.set("utm_model", slug);

  return new Response(
    `<!DOCTYPE html><html><body style="background:black;color:white;text-align:center;padding-top:60px;">
      <h1>18+ Redirection</h1>
      <p>You will be redirected shortly...</p>
      <script>setTimeout(()=>location.href="${url.toString()}",1500)</script>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
