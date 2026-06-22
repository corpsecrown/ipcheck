const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Accurately resolve client IP behind proxies (Railway, Cloudflare, etc.)
function resolveIP(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; first entry is the client
    return forwarded.split(",")[0].trim();
  }
  return (
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// ── API endpoints ──────────────────────────────────────────────────────────────

// JSON response
app.get("/api/ip", (req, res) => {
  const ip = resolveIP(req);
  res.json({
    ip,
    timestamp: new Date().toISOString(),
    userAgent: req.headers["user-agent"] || null,
  });
});

// Plain-text response (curl-friendly)
app.get("/api/ip/plain", (req, res) => {
  res.type("text/plain").send(resolveIP(req));
});

// JSONP response for cross-origin browser use
app.get("/api/ip/jsonp", (req, res) => {
  const cb = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(req.query.callback)
    ? req.query.callback
    : "callback";
  const payload = JSON.stringify({ ip: resolveIP(req) });
  res.type("application/javascript").send(`${cb}(${payload});`);
});

// TOS page
app.get("/tos", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "tos.html"));
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`ipcheck running on port ${PORT}`);
});
