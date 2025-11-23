export function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      ...headers
    }
  });
}

export function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, status);
}

export function getPagination(searchParams, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  let limit = parseInt(searchParams.get("limit") || String(defaultLimit), 10);
  if (!Number.isFinite(limit) || limit <= 0) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function requireApiKey(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || request.headers.get("x-api-key");
  const expected = env.API_SECRET || env.API_KEY;
  if (!expected || key !== expected) {
    throw new Error("Unauthorized");
  }
}
