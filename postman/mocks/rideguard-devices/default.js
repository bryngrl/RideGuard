// Local fixture from rideguard-node origin/staging 6534611, devices controller/service.
// Includes the new local button-presence contract; deployment is still required.
const http = require("node:http");
const key = "rideguard-devices-state";
const fresh = () => ({ mode: "online", claims: [], lastHeartbeat: null });
http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const state = await pm.state.get(key) || fresh();
  const send = (code, data) => {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: code < 400, data, message: "Local devices fixture", timestamp: new Date().toISOString() }));
  };
  if (url.pathname === "/__test/reset") { await pm.state.set(key, fresh()); return send(200, null); }
  if (url.pathname === "/__test/mode") {
    state.mode = url.searchParams.get("value"); await pm.state.set(key, state); return send(200, null);
  }
  if (url.pathname === "/__test/state") return send(200, state);
  if (url.pathname === "/__test/age") {
    state.lastHeartbeat = new Date(Date.now() - Number(url.searchParams.get("ms"))).toISOString();
    await pm.state.set(key, state); return send(200, null);
  }
  if (req.method === "POST" && url.pathname === "/v1/devices/BUT-123-ABC/heartbeat") {
    if (req.headers.authorization !== "Bearer hardware-fixture") return send(401, null);
    state.lastHeartbeat = new Date().toISOString(); await pm.state.set(key, state);
    return send(200, { device_id: "BUT-123-ABC", heartbeat_interval_ms: 30000, online_timeout_ms: 90000 });
  }
  if (req.headers.authorization !== "Bearer fixture") return send(401, null);
  if (req.method === "GET" && url.pathname === "/v1/devices/buttons") {
    if (state.mode === "buttons-unsupported") return send(404, null);
    if (state.mode === "buttons-failed") return send(503, null);
    if (state.mode === "buttons-empty") return send(200, []);
    const age = state.lastHeartbeat ? Date.now() - Date.parse(state.lastHeartbeat) : Infinity;
    return send(200, [{ device_id: "BUT-123-ABC", online: age >= 0 && age <= 90000, last_seen_at: state.lastHeartbeat }]);
  }
  if (req.method === "GET" && url.pathname === "/v1/devices/cameras") {
    if (state.mode === "failed") return send(503, null);
    if (state.mode === "malformed") return send(200, { unexpected: true });
    if (state.mode === "empty") return send(200, []);
    const online = state.mode === "online";
    return send(200, [
      { device_id: "PHONE-1", source: "phone", online: true, stream_url: null, last_seen_at: new Date().toISOString() },
      { device_id: "CAM-111-AAA", source: "esp32", online, stream_url: "http://192.0.2.1/stream", last_seen_at: new Date().toISOString() },
      { device_id: "CAM-222-BBB", source: "esp32", online: false, stream_url: null, last_seen_at: null },
    ]);
  }
  if (req.method === "PATCH" && url.pathname === "/v1/devices/claim-device/BUT-123-ABC") {
    state.claims.push("BUT-123-ABC"); await pm.state.set(key, state); return send(200, null);
  }
  return send(501, null);
}).listen(process.env.PORT);
