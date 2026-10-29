import { McpToolDefinition, McpToolInputSchema, McpToolResult } from '../types.js';
import { McpLogger } from './mcp-logger.js';

export function formatMcpSuccess(payload: unknown): McpToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2)
      }
    ]
  };
}

export function formatMcpError(toolName: string, error: unknown): McpToolResult {
  const message = error instanceof Error ? error.message : 'Unexpected execution error';
  return {
    content: [
      {
        type: 'text',
        text: `Error executing tool "${toolName}": ${message}`
      }
    ],
    isError: true
  };
}

export class McpToolRegistry {
  private readonly toolsByName = new Map<string, McpToolDefinition>();

  public registerTools(tools: McpToolDefinition[]): void {
    for (const tool of tools) {
      this.toolsByName.set(tool.name, tool);
    }
  }

  public listToolDescriptors(): Array<{
    name: string;
    description: string;
    inputSchema: McpToolInputSchema;
  }> {
    return Array.from(this.toolsByName.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }

  public async executeToolCall(
    toolName: string,
    rawArgs: unknown
  ): Promise<McpToolResult> {
    const tool = this.toolsByName.get(toolName);
    if (!tool) {
      return formatMcpError(toolName, new Error(`Unknown MCP tool: ${toolName}`));
    }

    try {
      const validatedArgs = tool.schema.parse(rawArgs ?? {});
      const payload = await tool.execute(validatedArgs);
      return formatMcpSuccess(payload);
    } catch (error) {
      McpLogger.logError('McpToolRegistry', `Failed executing ${toolName}`, error);
      return formatMcpError(toolName, error);
    }
  }
}

