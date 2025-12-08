
export async function onRequestGet(context) {
  const { slug } = context.params;
  const model = await context.env.DB.prepare("SELECT * FROM models WHERE slug=?").bind(slug).first();
  return model ? Response.json(model) : new Response("Not found", { status: 404 });
}
