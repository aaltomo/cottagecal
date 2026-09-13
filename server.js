// Cottage reservation server: Node stdlib http, JSON-file storage, no deps.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "reservations.json");
const INDEX = path.join(__dirname, "index.html");

// Shared-password Basic Auth. Set COTTAGE_PASSWORD to require it; unset = open (local dev).
const PASSWORD = process.env.COTTAGE_PASSWORD || "";
const timingEq = (a, b) => {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};
const authed = (req) => {
  if (!PASSWORD) return true;
  const m = (req.headers.authorization || "").match(/^Basic (.+)$/);
  if (!m) return false;
  const pass = Buffer.from(m[1], "base64").toString().split(":").slice(1).join(":");
  return timingEq(pass, PASSWORD);
};

const load = () => {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return []; // ponytail: missing/corrupt file starts empty; fine for a family cottage
  }
};
const save = (list) => fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));

// A reservation blocks [start, end] inclusive. Two overlap if start <= b.end && end >= b.start.
const overlaps = (a, b) => a.start <= b.end && a.end >= b.start;

// Off-season: cottage is closed Nov–Mar (months 11,12,1,2,3). True if the range touches any.
const closedMonth = (mo) => mo >= 11 || mo <= 3; // mo is 1–12
const rangeHasClosedDay = (start, end) => {
  for (let d = new Date(start + "T00:00:00Z"); d.toISOString().slice(0, 10) <= end;
       d.setUTCDate(d.getUTCDate() + 1)) {
    if (closedMonth(d.getUTCMonth() + 1)) return true;
  }
  return false;
};

const send = (res, code, body) => {
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  if (!authed(req)) {
    res.writeHead(401, {
      "WWW-Authenticate": 'Basic realm="Cottage"',
      "Content-Type": "application/json",
    });
    return res.end(JSON.stringify({ error: "unauthorized" }));
  }

  if (req.method === "GET" && req.url === "/") {
    return fs.readFile(INDEX, (err, buf) => {
      if (err) return send(res, 500, { error: "index missing" });
      res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-cache" });
      res.end(buf);
    });
  }

  if (req.method === "GET" && req.url === "/holidays.js") {
    return fs.readFile(path.join(__dirname, "holidays.js"), (err, buf) => {
      if (err) return send(res, 500, { error: "holidays.js missing" });
      res.writeHead(200, { "Content-Type": "text/javascript", "Cache-Control": "no-cache" });
      res.end(buf);
    });
  }

  if (req.method === "GET" && req.url === "/reservations") {
    return send(res, 200, load());
  }

  if (req.method === "POST" && req.url === "/reservations") {
    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > 1e4) req.destroy(); // ponytail: cap body, no one posts 10KB of dates
    });
    req.on("end", () => {
      let r;
      try {
        r = JSON.parse(body);
      } catch {
        return send(res, 400, { error: "bad json" });
      }
      const name = (r.name || "").trim();
      const { start, end } = r;
      const dateRe = /^\d{4}-\d{2}-\d{2}$/;
      if (!name || !dateRe.test(start) || !dateRe.test(end) || start > end) {
        return send(res, 400, { error: "anna nimi ja kelvollinen alku ≤ loppu (VVVV-KK-PP)" });
      }
      if (rangeHasClosedDay(start, end)) {
        return send(res, 409, { error: "mökki on suljettu marras–maaliskuussa" });
      }
      const list = load();
      const clash = list.find((b) => overlaps({ start, end }, b));
      if (clash) {
        return send(res, 409, { error: `päivät on jo varannut ${clash.name}` });
      }
      const rec = { id: `${start}_${end}_${name}`, name, start, end };
      list.push(rec);
      save(list);
      console.log(`+ reserved ${start}→${end} by ${name} (${list.length} total)`);
      return send(res, 201, rec);
    });
    return;
  }

  if (req.method === "DELETE" && req.url.startsWith("/reservations/")) {
    const id = decodeURIComponent(req.url.slice("/reservations/".length));
    const list = load();
    const next = list.filter((b) => b.id !== id);
    if (next.length === list.length) return send(res, 404, { error: "not found" });
    save(next);
    console.log(`- cancelled ${id} (${next.length} total)`);
    return send(res, 200, { ok: true });
  }

  send(res, 404, { error: "not found" });
});

// Only start listening when run directly (`node server.js`), not when required by a test.
if (require.main === module) {
  if (!PASSWORD) console.warn("⚠ COTTAGE_PASSWORD not set — running WITHOUT auth (dev only).");
  server.listen(PORT, () => console.log(`CottageCal on http://localhost:${PORT}`));
}

module.exports = { overlaps, rangeHasClosedDay }; // for the self-check
