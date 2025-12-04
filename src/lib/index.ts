import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

type ToolHandler<T> = (params: T) => Promise<CallToolResult>;

export function withErrorHandling<T extends Record<string, unknown>>(
  handler: ToolHandler<T>
): ToolHandler<T> {
  return async (params) => {
    try {
      return await handler(params);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Tool Error] ${message}`);
      return {
        isError: true,
        content: [{ type: 'text', text: `Error: ${message}` }],
      };
    }
  };
}
