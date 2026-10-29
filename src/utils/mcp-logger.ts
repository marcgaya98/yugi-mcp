export class McpLogger {
  public static logInfo(context: string, message: string): void {
    process.stderr.write(`[INFO] [${context}] ${message}\n`);
  }

  public static logWarn(context: string, message: string): void {
    process.stderr.write(`[WARN] [${context}] ${message}\n`);
  }

  public static logError(context: string, message: string, error?: unknown): void {
    const detail = error instanceof Error ? error.message : String(error ?? '');
    const suffix = detail ? `: ${detail}` : '';
    process.stderr.write(`[ERROR] [${context}] ${message}${suffix}\n`);
  }
}

