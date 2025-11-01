import { 
  McpServer, 
  registerOpenAIWidget, 
  startOpenAIWidgetHttpServer
} from "@fractal-mcp/oai-server";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFile } from "fs/promises";
import { z } from "zod";
import express from "express";
import http from "http";
import fs from "fs";
import path from "path";
import url from "url";
import fetch from "node-fetch";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//
// === MCP SERVER FACTORY ===
//
const createMcpServer = async () => {
  const server = new McpServer({
    name: "weather-mcp",
    version: "1.0.0"
  });

  // ---- Load bundled UI ----
  console.log("Bundling widget UI with inline assets...");
  const bundleOutDir = resolve(__dirname, "../ui/bundle");
  const widgetHtml = await readFile(resolve(bundleOutDir, "index.html"), "utf-8");
  console.log(`✅ Widget UI loaded (${widgetHtml.length} bytes)`);

  //
  // === TOOL: get-weather ===
  //
  server.registerTool(
    "get-weather",
    {
      title: "Get Weather",
      description: "Lấy thông tin thời tiết theo thành phố",
      inputSchema: {
        city: z.string().describe("Tên thành phố cần xem thời tiết"),
      },
      outputSchema: {
        city: z.string(),
        temperature: z.string(),
        condition: z.string(),
        humidity: z.string(),
        wind: z.string(),
      }
    },
    async ({ city }: any) => {
      // Ở đây bạn có thể gọi API thật, hoặc mock dữ liệu:
      const weather = {
        city,
        temperature: "26°C",
        condition: "Nắng nhẹ",
        humidity: "68%",
        wind: "14 km/h",
      };

      return {
        // human-readable content expected by the MCP handler types
        content: [
          {
            type: "text",
            text: `Thời tiết tại ${weather.city}: ${weather.temperature}, ${weather.condition}`
          }
        ],
        // structuredContent holds the typed output payload
        structuredContent: weather
      };
    }
  );

  //
  // === WIDGET: Weather Widget ===
  //
  registerOpenAIWidget(
    server,
    {
      id: "weather-widget",
      title: "Weather",
      templateUri: "ui://widget/weather",
      invoking: "Đang tải thông tin thời tiết...",
      invoked: "Thông tin thời tiết đã được tải!",
      html: widgetHtml, // từ ui/bundle/index.html
      responseText: "Weather widget displayed",
      inputSchema: z.object({
        city: z.string().describe("Tên thành phố cần xem thời tiết")
      }),
      description: "Widget hiển thị thông tin thời tiết"
    },
    async (args) => ({
      content: [{ type: "text", text: `Hiển thị thời tiết cho ${args.city}` }],
      structuredContent: { city: args.city },
    })
  );

  //
  // Safe close patch
  //
  const originalClose = server.close.bind(server);
  let closing = false;
  server.close = async () => {
    if (closing) return;
    closing = true;
    try {
      await originalClose();
    } catch (e) {
      console.error("Safe close error:", e);
    }
  };

  return server;
};

//
// === Start the MCP HTTP server ===
//
startOpenAIWidgetHttpServer({
  port: 8001,
  serverFactory: createMcpServer
});

console.log("🚀 MCP widget server running at http://localhost:8001");

//
// === Serve static UI files ===
//
const serveStatic = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url || "");
  const pathname = `.${parsedUrl.pathname}`;
  const filePath = path.join(__dirname, "..", pathname);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    const type =
      ext === ".html"
        ? "text/html"
        : ext === ".js"
        ? "application/javascript"
        : ext === ".css"
        ? "text/css"
        : "text/plain";

    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
});

app.use("/ui", express.static(path.resolve(__dirname, "../ui")));

serveStatic.listen(8080, () => {
  console.log("🌐 Static UI server running at http://localhost:8080/ui/bundle/index.html");
});
