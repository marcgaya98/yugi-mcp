import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { DEFAULT_API_BASE_URL, YugiohApiClient } from './api/api-client.js';
import { createCardTools } from './tools/card-tools.js';
import { createObtentionTools } from './tools/obtention-tools.js';
import { createSemanticSearchTools } from './tools/semantic-search-tools.js';
import { createDuelistAndStatsTools } from './tools/duelist-and-stats-tools.js';
import { YugiohBackendPort } from './types.js';
import { McpLogger } from './utils/mcp-logger.js';
import { McpToolRegistry } from './utils/tool-registry.js';

const SERVER_NAME = 'yugioh-mcp-server';
const SERVER_VERSION = '2.0.0';

export function buildDefaultToolRegistry(backendPort: YugiohBackendPort): McpToolRegistry {
  const registry = new McpToolRegistry();
  registry.registerTools(createCardTools(backendPort));
  registry.registerTools(createObtentionTools(backendPort));
  registry.registerTools(createSemanticSearchTools(backendPort));
  registry.registerTools(createDuelistAndStatsTools(backendPort, backendPort));
  return registry;
}

export class YugiohMcpServer {
  private readonly server: Server;
  private readonly backendPort: YugiohBackendPort;
  private readonly toolRegistry: McpToolRegistry;

  constructor(
    backendPort?: YugiohBackendPort,
    toolRegistry?: McpToolRegistry
  ) {
    const apiBaseUrl = process.env.YUGIOH_API_BASE_URL || DEFAULT_API_BASE_URL;
    this.backendPort = backendPort ?? new YugiohApiClient(apiBaseUrl);
    this.toolRegistry = toolRegistry ?? buildDefaultToolRegistry(this.backendPort);
    this.server = new Server(
      { name: SERVER_NAME, version: SERVER_VERSION },
      { capabilities: { tools: {} } }
    );
    this.registerProtocolHandlers();
  }

  public getRegistry(): McpToolRegistry {
    return this.toolRegistry;
  }

  public async start(): Promise<void> {
    const isHealthy = await this.backendPort.healthCheck();
    if (!isHealthy) {
      McpLogger.logWarn('Server', 'Backend API is not reachable yet; tools will retry per call');
    } else {
      McpLogger.logInfo('Server', 'Backend API connectivity verified');
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    McpLogger.logInfo('Server', `${SERVER_NAME} v${SERVER_VERSION} connected over stdio`);
  }

  public async stop(): Promise<void> {
    await this.server.close();
    McpLogger.logInfo('Server', 'MCP server stopped cleanly');
  }

  private registerProtocolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.toolRegistry.listToolDescriptors()
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      McpLogger.logInfo('ToolCall', `Executing ${name}`);
      return this.toolRegistry.executeToolCall(name, args);
    });
  }
}

function registerProcessSignals(mcpServer: YugiohMcpServer): void {
  const shutdown = async (signal: string) => {
    McpLogger.logInfo('Server', `Received ${signal}, shutting down...`);
    await mcpServer.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

async function main(): Promise<void> {
  const mcpServer = new YugiohMcpServer();
  registerProcessSignals(mcpServer);
  await mcpServer.start();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    McpLogger.logError('Server', 'Fatal startup error', error);
    process.exit(1);
  });
}
