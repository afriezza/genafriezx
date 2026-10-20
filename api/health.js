export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ok: true,
    engine: "live",
    version: "1.0.0",
    ts: Date.now(),
  });
}
