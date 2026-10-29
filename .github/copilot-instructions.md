# GitHub Copilot Instructions - Yu-Gi-Oh! MCP Server

Eres un desarrollador experto en TypeScript, Node.js y arquitectura de servidores MCP (Model Context Protocol). Este proyecto implementa un servidor MCP para la API de Yu-Gi-Oh! DB.

## 🎯 Contexto del Proyecto

**Objetivo:** Servidor MCP que actúa como gateway entre Agentes de IA y la API REST de Yu-Gi-Oh! DB.

**Stack Principal:**
- TypeScript (strict mode)
- Node.js con módulos ES (ESNext)
- @modelcontextprotocol/sdk (SDK oficial MCP)
- Express.js para HTTP server
- Axios para HTTP client
- Zod para validación de schemas

**Arquitectura:**
```
src/
├── api/          → Cliente HTTP para la API externa
├── tools/        → Definición de herramientas MCP
├── types.ts      → Tipos compartidos
└── server.ts     → Punto de entrada del servidor MCP
```

## 📋 Principios de Desarrollo

### 1. TypeScript - Tipado Estricto
- **SIEMPRE** usa tipos explícitos, evita `any`
- Prefiere interfaces sobre types para objetos
- Usa `unknown` en lugar de `any` para valores desconocidos
- Importa tipos con `.js` en extensiones (ESM requirement)

```typescript
// ✅ CORRECTO
import { Card } from '../types.js';
async function getCard(id: string): Promise<Card> { }

// ❌ INCORRECTO
import { Card } from '../types';
async function getCard(id: any) { }
```

### 2. Manejo de Errores
- **SIEMPRE** captura errores en operaciones async
- Usa bloques try-catch en todas las funciones de herramientas
- Retorna objetos de error estructurados, no lances excepciones sin capturar
- Incluye contexto útil en los mensajes de error

```typescript
// ✅ CORRECTO
try {
  const data = await apiClient.getCard(id);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
} catch (error) {
  return {
    content: [{
      type: 'text',
      text: `Error al obtener carta: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }],
    isError: true
  };
}

// ❌ INCORRECTO
const data = await apiClient.getCard(id); // Sin try-catch
throw new Error('Failed'); // Sin contexto
```

### 3. Validación con Zod
- Define schemas Zod para TODAS las entradas de herramientas
- Usa `.describe()` para documentar cada campo
- Exporta los schemas para testing
- Valida antes de procesar

```typescript
// ✅ CORRECTO
export const GetCardSchema = z.object({
  cardId: z.string().describe('ID único de la carta en la base de datos'),
});

async function getTool(args: z.infer<typeof GetCardSchema>) {
  // args está validado y tipado
}

// ❌ INCORRECTO
async function getTool(args: { cardId: string }) {
  // Sin validación Zod
}
```

### 4. Nomenclatura y Convenciones
- Archivos: kebab-case (`card-tools.ts`, `api-client.ts`)
- Clases: PascalCase (`YugiohApiClient`)
- Funciones/variables: camelCase (`getCardById`, `apiClient`)
- Constantes: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Herramientas MCP: snake_case (`obtener_detalles_carta`)

### 5. Estructura de Herramientas MCP
Cada herramienta debe seguir este patrón:

```typescript
// 1. Schema de validación
export const ToolNameSchema = z.object({
  param: z.string().describe('Descripción clara'),
});

// 2. Función de implementación
export async function toolName(args: z.infer<typeof ToolNameSchema>) {
  const apiClient = getApiClient();
  
  try {
    const result = await apiClient.someMethod(args.param);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      }],
      isError: true,
    };
  }
}

// 3. Definición para el servidor MCP
export const toolDefinitions = [
  {
    name: 'tool_name',
    description: 'Descripción clara y concisa de qué hace la herramienta',
    inputSchema: {
      type: 'object',
      properties: {
        param: {
          type: 'string',
          description: 'Descripción del parámetro',
        },
      },
      required: ['param'],
    },
  },
];
```

### 6. Logging y Debugging
- Usa `console.log` para información útil en desarrollo
- Prefija logs con categorías: `[API Request]`, `[Tool Call]`, `[Error]`
- Incluye timestamps cuando sea relevante
- No logguees información sensible

```typescript
// ✅ CORRECTO
console.log(`[API Request] GET /cards/${id}`);
console.log(`[Tool Call] obtener_detalles_carta: cardId=${args.cardId}`);
console.error('[Error]', error.message);

// ❌ INCORRECTO
console.log(id); // Sin contexto
console.log(secretKey); // Información sensible
```

### 7. Async/Await
- Prefiere async/await sobre Promises con .then()
- Marca funciones como async solo si usan await
- No uses await innecesariamente

```typescript
// ✅ CORRECTO
async function getData(): Promise<Data> {
  const result = await apiCall();
  return result;
}

// ❌ INCORRECTO
async function getData(): Promise<Data> {
  return apiCall(); // Await innecesario
}
```

### 8. Cliente API
- Usa el patrón Singleton para el cliente API
- Configura timeouts apropiados (10s para requests normales)
- Incluye retry logic para operaciones críticas
- Usa interceptores para logging y manejo de errores global

### 9. Documentación
- Usa JSDoc para todas las funciones públicas
- Documenta parámetros complejos
- Incluye ejemplos cuando sea útil
- Mantén TOOLS.md actualizado

```typescript
/**
 * Obtiene información detallada de una carta de Yu-Gi-Oh!
 * 
 * @param cardId - ID único de la carta en la base de datos
 * @returns Objeto con todos los detalles de la carta
 * @throws {Error} Si la carta no existe o la API no está disponible
 * 
 * @example
 * const card = await getCardById('46986414');
 * console.log(card.name); // "Dark Magician"
 */
async function getCardById(cardId: string): Promise<Card> {
  // ...
}
```

### 10. Performance
- Usa Promise.all() para operaciones paralelas
- Evita operaciones síncronas bloqueantes
- Implementa caché cuando sea apropiado
- Limita resultados de búsqueda con defaults razonables

```typescript
// ✅ CORRECTO - Paralelo
const [card, methods] = await Promise.all([
  getCardById(id),
  getObtentionMethods(id),
]);

// ❌ INCORRECTO - Secuencial innecesario
const card = await getCardById(id);
const methods = await getObtentionMethods(id);
```

## 🔒 Seguridad

1. **Variables de Entorno:**
   - NUNCA commitees archivos `.env`
   - Usa `.env.example` como plantilla
   - Valida que las variables requeridas existan al inicio

2. **Validación de Input:**
   - SIEMPRE valida con Zod antes de procesar
   - Sanitiza strings antes de usarlos en queries
   - Limita tamaños de arrays/strings

3. **Manejo de Secrets:**
   - No loguees API keys o tokens
   - Usa variables de entorno para credenciales
   - Implementa rate limiting si es necesario

## 🧪 Testing (Futuro)

Cuando agregues tests:
- Usa Jest o Vitest
- Mock el cliente API
- Test casos de éxito y error
- Mantén cobertura >80%

```typescript
// Estructura recomendada
describe('obtenerDetallesCarta', () => {
  it('should return card details when card exists', async () => {
    // Arrange
    const mockCard = { id: '123', name: 'Test Card' };
    jest.spyOn(apiClient, 'getCardById').mockResolvedValue(mockCard);
    
    // Act
    const result = await obtenerDetallesCarta({ cardId: '123' });
    
    // Assert
    expect(result.content[0].text).toContain('Test Card');
  });
  
  it('should handle errors gracefully', async () => {
    // Test error case
  });
});
```

## 📦 Dependencias

**Producción:**
- `@modelcontextprotocol/sdk` - Core MCP
- `express` - HTTP server
- `axios` - HTTP client
- `zod` - Validación
- `typescript` - Lenguaje
- `ts-node` - Ejecución directa

**Desarrollo:**
- `@types/node` - Tipos Node.js
- `@types/express` - Tipos Express

## 🚀 Comandos Útiles

```bash
# Desarrollo con hot-reload
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar versión compilada
npm start

# Verificar tipos
npx tsc --noEmit

# Formatear código (cuando se agregue)
npm run format
```

## 🎨 Estilo de Código

- Usa 2 espacios para indentación
- Usa comillas simples para strings
- Punto y coma obligatorio
- Máximo 100 caracteres por línea
- Una línea en blanco entre funciones
- Imports agrupados y ordenados

```typescript
// ✅ CORRECTO
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import express from 'express';

import { getApiClient } from './api/api-client.js';
import { cardTools } from './tools/card-tools.js';

const PORT = 3000;

// ❌ INCORRECTO
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import express from "express"
import { getApiClient } from "./api/api-client.js"
const PORT=3000
```

## 🐛 Debugging

Para debugging del servidor MCP:
1. Verifica variables de entorno con `console.log(process.env.YUGIOH_API_BASE_URL)`
2. Logguea requests entrantes al servidor
3. Logguea respuestas de la API externa
4. Usa VS Code debugger con configuración:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug MCP Server",
  "program": "${workspaceFolder}/src/server.ts",
  "preLaunchTask": "tsc: build - tsconfig.json",
  "outFiles": ["${workspaceFolder}/dist/**/*.js"],
  "env": {
    "NODE_ENV": "development"
  }
}
```

## 📚 Recursos

- [MCP SDK Docs](https://github.com/modelcontextprotocol/typescript-sdk)
- [Zod Documentation](https://zod.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/)

## ✅ Checklist Pre-Commit

Antes de hacer commit, verifica:
- [ ] Código compila sin errores (`npx tsc --noEmit`)
- [ ] No hay `console.error` o `TODO` sin resolver
- [ ] Schemas Zod definidos para nuevas herramientas
- [ ] Manejo de errores implementado
- [ ] Tipos explícitos (no `any`)
- [ ] Documentación JSDoc añadida
- [ ] Variables de entorno documentadas en `.env.example`
- [ ] TOOLS.md actualizado si agregaste herramientas
- [ ] No commiteas archivos `.env` o `node_modules`

---

**Versión:** 1.0  
**Actualizado:** 23 de octubre de 2025  
**Proyecto:** Yu-Gi-Oh! MCP Server MVP
