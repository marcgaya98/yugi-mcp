# Yu-Gi-Oh! GX Tag Force — MCP Server (`yugi-mcp` v2.0)

Gateway **Model Context Protocol (MCP)** sobre `stdio` que conecta agentes de IA con el backend DDD [`yugioh-ts-ddd`](file:///home/marc/Projects/ddd/yugioh-ts-ddd) (`http://localhost:3001/api`).

---

## Arquitectura (SOLID & Clean Code)

- **Transporte `stdio` limpio**: Todo el logging se escribe exclusivamente en `stderr` ([`McpLogger`](file:///home/marc/Projects/ddd/yugi-mcp/src/utils/mcp-logger.ts)), preservando `stdout` libre de ruido para tramas JSON-RPC 2.0.
- **Open/Closed Principle (OCP)**: [`McpToolRegistry`](file:///home/marc/Projects/ddd/yugi-mcp/src/utils/tool-registry.ts) registra y despacha herramientas dinámicamente mediante contratos [`McpToolDefinition`](file:///home/marc/Projects/ddd/yugi-mcp/src/types.ts).
- **Interface Segregation & Dependency Inversion (ISP / DIP)**: Cada familia de herramientas depende únicamente de su puerto segregado (`CatalogApiPort`, `ObtentionApiPort`, `SemanticSearchApiPort`, `DuelistApiPort`, `LimitListAndStatsApiPort`), implementado por [`YugiohApiClient`](file:///home/marc/Projects/ddd/yugi-mcp/src/api/api-client.ts).

---

## Requisitos y Configuración

1. Asegúrate de tener el backend `yugioh-ts-ddd` corriendo en el puerto `3001`.
2. Variables de entorno (`.env`):
   ```env
   YUGIOH_API_BASE_URL=http://localhost:3001/api
   NODE_ENV=development
   ```
3. Configuración para clientes MCP ([`mcp-config.json`](file:///home/marc/Projects/ddd/yugi-mcp/mcp-config.json)):
   ```json
   {
     "mcpServers": {
       "yugioh": {
         "command": "node",
         "args": ["/home/marc/Projects/ddd/yugi-mcp/dist/server.js"],
         "env": {
           "YUGIOH_API_BASE_URL": "http://localhost:3001/api"
         }
       }
     }
   }
   ```

---

## Comandos

```bash
# Compilar TypeScript a dist/
npm run build

# Ejecutar tests unitarios e integración E2E contra :3001
npm test

# Iniciar servidor MCP compilado
npm start
```

Consulta el catálogo completo de las **22 herramientas MCP** en [TOOLS.md](file:///home/marc/Projects/ddd/yugi-mcp/TOOLS.md).
