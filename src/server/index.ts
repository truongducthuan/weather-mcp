import { McpServer, registerOpenAIWidget, startOpenAIWidgetHttpServer } from '@fractal-mcp/oai-server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WeatherService } from './weatherService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize weather service
const weatherService = new WeatherService();

function createServer() {
  const server = new McpServer({
    name: 'weather-mcp-app',
    version: '1.0.0'
  });

  // Read bundled widget HTML
  const widgetHtmlPath = path.join(__dirname, '../../dist/ui/index.html');
  let widgetHtml: string;
  
  try {
    widgetHtml = fs.readFileSync(widgetHtmlPath, 'utf-8');
    console.log('✅ Widget HTML loaded successfully');
  } catch (error) {
    console.error('❌ Error loading widget HTML:', error);
    throw error;
  }

  // ===== TOOL 1: Get Weather =====
  registerOpenAIWidget(
    server,
    {
      id: 'get-weather',
      title: 'Xem Thời Tiết',
      description: 'Lấy thông tin thời tiết hiện tại cho một thành phố',
      templateUri: 'ui://widget/weather.html',
      invoking: 'Đang lấy dữ liệu thời tiết...',
      invoked: 'Thông tin thời tiết đã được tải!',
      html: widgetHtml,
      responseText: 'Đây là thông tin thời tiết hiện tại',
      inputSchema: z.object({
        city: z.string().describe('Tên thành phố (ví dụ: Hà Nội, Sài Gòn, Đà Nẵng)')
      })
    },
    async (args) => {
      try {
        const weatherData = await weatherService.getWeather(args.city);
        const history = weatherService.getHistory();

        return {
          content: [{
            type: 'text',
            text: `🌤️ Thời tiết ở ${weatherData.city}: ${weatherData.temperature}°C, ${weatherData.description}. Độ ẩm: ${weatherData.humidity}%, Gió: ${weatherData.windSpeed} km/h.`
          }],
          structuredContent: {
            current: weatherData,
            history: history,
            action: 'get',
            message: `Thông tin thời tiết cho ${weatherData.city}`
          }
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Không thể lấy thông tin thời tiết cho ${args.city}. Vui lòng kiểm tra tên thành phố.`
          }],
          structuredContent: {
            current: null,
            history: [],
            action: 'get',
            message: 'Lỗi khi lấy dữ liệu thời tiết'
          }
        };
      }
    }
  );

  // ===== TOOL 2: Get History =====
  registerOpenAIWidget(
    server,
    {
      id: 'weather-history',
      title: 'Lịch Sử Tìm Kiếm',
      description: 'Xem lịch sử các thành phố đã tìm kiếm',
      templateUri: 'ui://widget/history.html',
      invoking: 'Đang tải lịch sử...',
      invoked: 'Lịch sử đã được tải!',
      html: widgetHtml,
      responseText: 'Đây là lịch sử tìm kiếm thời tiết của bạn',
      inputSchema: z.object({})
    },
    async () => {
      const history = weatherService.getHistory();
      
      if (history.length === 0) {
        return {
          content: [{
            type: 'text',
            text: '📋 Chưa có lịch sử tìm kiếm. Hãy tìm kiếm thời tiết một thành phố!'
          }],
          structuredContent: {
            current: null,
            history: [],
            action: 'history',
            message: 'Chưa có lịch sử tìm kiếm'
          }
        };
      }

      // Get weather for last searched city
      const lastCity = history[history.length - 1].city;
      const currentWeather = await weatherService.getWeather(lastCity);

      return {
        content: [{
          type: 'text',
          text: `📊 Bạn đã tìm kiếm thời tiết của ${history.length} thành phố. Thành phố gần nhất: ${lastCity}.`
        }],
        structuredContent: {
          current: currentWeather,
          history: history,
          action: 'history',
          message: `Lịch sử tìm kiếm (${history.length} thành phố)`
        }
      };
    }
  );

  return server;
}

// Health check endpoint
function setupHealthCheck(app: any) {
  app.get('/health', (_req: any, res: any) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'weather-mcp-app'
    });
  });
}

// Start server
const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;
const PORT: number = typeof envPort === 'number' && !Number.isNaN(envPort) ? envPort : 10000;

console.log('🚀 Starting Weather MCP Server...\n');

const serverOptions: any = {
  port: PORT,
  serverFactory: createServer,
  setupRoutes: setupHealthCheck
};

startOpenAIWidgetHttpServer(serverOptions);

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  🌤️  WEATHER MCP SERVER                                       ║
║                                                               ║
║  Status: ✅ Running                                           ║
║  Port: ${PORT}                                                 ║
║  Environment: ${process.env.NODE_ENV || 'development'}        ║
║                                                               ║
║  📚 Available Tools:                                          ║
║    • get-weather: Xem thời tiết thành phố                    ║
║    • weather-history: Xem lịch sử tìm kiếm                   ║
║                                                               ║
║  🔗 Endpoints:                                                ║
║    • Health Check: GET /health                                ║
║    • MCP: POST /                                              ║
║                                                               ║
║  💡 Next Steps:                                               ║
║    1. Deploy to Render                                        ║
║    2. Get HTTPS URL                                           ║
║    3. Add to ChatGPT Apps SDK                                 ║
║    4. Test: "Thời tiết ở Hà Nội"                             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);