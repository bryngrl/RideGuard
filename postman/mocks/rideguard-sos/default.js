// Local test fixture derived from rideguard-node's v1 SOS contract (ba5629e).
// No credentials, contact numbers, coordinates, message content, or real SMS.
const http = require("node:http");
const key = "rideguard-sos-data";
const fresh = () => ({ records: {}, requests: {}, active: null, mode: "normal", starts: 0, stops: 0 });
http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const state = await pm.state.get(key) || fresh();
  const save = () => pm.state.set(key, state);
  const send = (status, data, code) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: status < 400, message: "Local SOS fixture", timestamp: new Date().toISOString(), ...(status < 400 ? { data } : { statusCode: status, code }) }));
  };
  if (url.pathname === "/__test/reset") { await pm.state.set(key, fresh()); return send(200, null); }
  if (url.pathname === "/__test/mode") { state.mode = url.searchParams.get("value"); await save(); return send(200, null); }
  if (url.pathname === "/__test/counts") return send(200, { starts: state.starts, stops: state.stops });
  if (url.pathname === "/v1/sos/active") return send(200, state.active ? state.records[state.active] : null);
  if (url.pathname.startsWith("/v1/sos/by-request/")) {
    const id = state.requests[decodeURIComponent(url.pathname.slice("/v1/sos/by-request/".length))];
    return id ? send(200, state.records[id]) : send(404, null);
  }
  if (req.method === "POST" && url.pathname === "/v1/sos") {
    state.starts++;
    const body = req.body;
    if (!body || typeof body.requestId !== "string" || !Object.prototype.hasOwnProperty.call(body, "location")) { await save(); return send(400, null); }
    if (state.mode === "disabled") { await save(); return send(503, null, "SOS_DISABLED"); }
    if (state.mode === "server-error") { await save(); return send(503, null); }
    if (state.mode === "html-error") { await save(); res.writeHead(502, { "Content-Type": "text/html" }); return res.end("<html>Local fixture</html>"); }
    const existing = state.requests[body.requestId] || state.active;
    if (existing) { state.requests[body.requestId] = existing; await save(); return send(200, state.records[existing]); }
    const now = new Date().toISOString();
    const id = "sos-" + (Object.keys(state.records).length + 1);
    const record = { sosId: id, requestId: body.requestId, alertId: body.alertId || null, status: "active", createdAt: now, endedAt: null, location: null,
      recipients: [{ contactId: "fixture-contact", name: "Test contact", phone: "masked", initial: { status: "unknown", updatedAt: now }, ended: null }] };
    state.records[id] = record; state.requests[body.requestId] = id; state.active = id; await save();
    if (state.mode === "lost-submit") return send(500, null);
    if (state.mode === "timeout") { setTimeout(() => send(201, record), 1500); return; }
    return send(201, record);
  }
  const match = /^\/v1\/sos\/([^/]+)(\/stop)?$/.exec(url.pathname);
  if (match) {
    const record = state.records[decodeURIComponent(match[1])];
    if (!record) return send(404, null);
    if (match[2] && req.method === "POST") {
      state.stops++;
      record.status = "ended"; record.endedAt ||= new Date().toISOString(); state.active = null;
      for (const recipient of record.recipients) recipient.ended ||= { status: "accepted", updatedAt: record.endedAt };
      await save();
      if (state.mode === "lost-stop") return send(500, null);
    }
    return send(200, record);
  }
  return send(501, null);
}).listen(process.env.PORT);
