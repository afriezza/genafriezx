export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();
  const q = req.query || {};
  const count = Math.min(Math.max(parseInt(q.count, 10) || 100, 1), 500);
  const chunk = Math.min(Math.max(parseInt(q.chunk, 10) || 20, 1), 50);
  const host = req.headers.host || "genafriezx.vercel.app";
  const params = new URLSearchParams();
  for (const k of ["region", "name", "password_prefix", "ghost", "detect_rare", "bind"]) {
    if (q[k] !== undefined) params.set(k, q[k]);
  }
  const slices = [];
  for (let left = count; left > 0; left -= chunk) slices.push(Math.min(chunk, left));
  const started = Date.now();
  const results = await Promise.all(slices.map(async (c) => {
    const p = new URLSearchParams(params);
    p.set("count", String(c));
    try {
      const r = await fetch(`https://${host}/api/gen?${p.toString()}`);
      return await r.json();
    } catch {
      return null;
    }
  }));
  const accounts = results.filter(Boolean).flatMap((r) => r.accounts || []);
  return res.status(200).json({
    success: true,
    engine: "live",
    total_requested: count,
    total_created: accounts.length,
    rare_count: accounts.filter((a) => a.rare && a.rare.length).length,
    ms_total: Date.now() - started,
    accounts,
  });
}
