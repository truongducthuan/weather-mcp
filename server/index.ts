import { 
  McpServer, 
  registerOpenAIWidget, 
  startOpenAIWidgetHttpServer
} from "@fractal-mcp/oai-server";
import { bundleJSEntrypoint, bundleReactComponent } from "@fractal-mcp/bundle";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFile } from "fs/promises";
import { z } from "zod";

import http from "http";
import fs from "fs";
import path from "path";
import url from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a simple MCP server with async initialization
const createMcpServer = async () => {
  const server = new McpServer({
    name: "example-oai-server",
    version: "1.0.0"
  });

  // Bundle the React component with EVERYTHING INLINED
  console.log("Bundling widget UI with inline assets...");
  const bundleOutDir = resolve(__dirname, '../ui/bundle');
  // await bundleReactComponent({
  //   entrypoint: resolve(__dirname, '../ui/Component.tsx'),
  //   out: bundleOutDir,
  //   output: {
  //     type: 'html',
  //     inline: { js: true, css: true },
  //     rootOnly: false  // Just the snippet, no <html> wrapper
  //   }
  // });
  
  // Read the fully inlined HTML
  const widgetHtml = await readFile(resolve(bundleOutDir, 'index.html'), 'utf-8');
  console.log(`Widget UI bundled! Size: ${widgetHtml.length} bytes`);

  const widgetHtml2 =`
<div id="root"></div>
<link rel="stylesheet" href="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-albums-0038.css">
<script type="module" src="https://persistent.oaistatic.com/ecosystem-built-assets/pizzaz-albums-0038.js"></script>
`
  // Register a simple widget
  registerOpenAIWidget(
    server,
    {
      id: "hello-widget",
      title: "Hello Widget",
      templateUri: "ui://widget/hello",
      invoking: "Creating hello widget...",
      invoked: "Hello widget created",
      html: widgetHtml,
      responseText: "Widget displayed successfully",
      inputSchema: z.object({
        name: z.string().describe("Name to greet")
      }),
      description: "A simple hello widget"
    },
    async (args) => {
      return {
        content: [
          {
            type: "text",
            text: `Hello, ${args.name}!`
          }
        ],
        structuredContent: {
          name: args.name,
          timestamp: new Date().toISOString()
        }
      };
    }
  );

  // ✅ Gắn patch vào server.close() để tránh loop onclose()
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

// Start the HTTP server with SSE transport
const httpServer = startOpenAIWidgetHttpServer({
  port: 8001,
  serverFactory: createMcpServer
});

console.log("OpenAI widget server starting on http://localhost:8001");


// Serve static files from /ui/bundle
const serveStatic = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url || "");
  let pathname = `.${parsedUrl.pathname}`;
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

serveStatic.listen(8080, () => {
  console.log("🌐 Static UI server running at http://localhost:8080/ui/bundle/index.html");
});