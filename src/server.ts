import { createServer } from "node:http";
import { publishRelease } from "./release.js";

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/release") { res.writeHead(404); res.end("not found"); return; }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try {
    const result = await publishRelease(JSON.parse(raw));
    res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid request";
    res.writeHead(400, { "content-type": "application/json" }); res.end(JSON.stringify({ error: message }));
  }
});
server.listen(Number(process.env.PORT ?? 3000), () => console.log("release service listening"));
