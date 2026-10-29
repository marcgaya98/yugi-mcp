import { z } from 'zod';
import { McpToolDefinition, SemanticSearchApiPort } from '../types.js';

export const SearchByVisualDescriptionSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      'Visual artwork description in Spanish or English (e.g., "guerrero con espada y armadura", "blue dragon with wings")'
    ),
  limit: z.number().min(1).max(50).optional().default(12)
});

export const FindVisuallySimilarCardsSchema = z.object({
  cardId: z
    .union([z.string(), z.number()])
    .describe('Reference card ID to find visually similar artwork via CLIP cosine similarity'),
  limit: z.number().min(1).max(50).optional().default(12)
});

export const SearchByVisualStyleSchema = z.object({
  style: z
    .string()
    .min(1)
    .describe('Visual style preset (e.g., "dark-magician", "blue-dragon", "ghost-rare")'),
  limit: z.number().min(1).max(50).optional().default(12)
});

const EmptySchema = z.object({});

export function createSemanticSearchTools(
  semanticSearchPort: SemanticSearchApiPort
): McpToolDefinition<any>[] {
  return [
    {
      name: 'search_cards_by_visual_description',
      description:
        'AI Visual Search powered by CLIP (clip_embedding): Finds cards whose artwork matches a natural-language visual description in Spanish or English (e.g., "guerrero con espada y armadura", "dragón azul con alas", "mago oscuro").',
      schema: SearchByVisualDescriptionSchema,
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'Natural-language visual description of the card artwork (Spanish or English)'
          },
          limit: {
            type: 'number',
            default: 12,
            minimum: 1,
            maximum: 50,
            description: 'Maximum number of matching cards to return'
          }
        },
        required: ['query']
      },
      execute: async (args) =>
        semanticSearchPort.searchByVisualDescription(args.query, args.limit)
    },
    {
      name: 'find_visually_similar_cards',
      description:
        'Finds cards with visually similar artwork to a reference cardId by computing cosine similarity over their 169-dimensional CLIP embeddings (clip_embedding).',
      schema: FindVisuallySimilarCardsSchema,
      inputSchema: {
        type: 'object',
        properties: {
          cardId: {
            type: ['string', 'number'],
            description: 'Database ID of the reference card'
          },
          limit: {
            type: 'number',
            default: 12,
            minimum: 1,
            maximum: 50,
            description: 'Maximum number of visually similar cards to return'
          }
        },
        required: ['cardId']
      },
      execute: async (args) =>
        semanticSearchPort.findVisuallySimilarCards(args.cardId, args.limit)
    },
    {
      name: 'search_cards_by_visual_style',
      description:
        'Searches cards matching a predefined visual artwork style preset ("dark-magician", "blue-dragon", "ghost-rare") or custom aesthetic phrase using CLIP.',
      schema: SearchByVisualStyleSchema,
      inputSchema: {
        type: 'object',
        properties: {
          style: {
            type: 'string',
            description: 'Visual style preset ("dark-magician", "blue-dragon", "ghost-rare")'
          },
          limit: {
            type: 'number',
            default: 12,
            minimum: 1,
            maximum: 50
          }
        },
        required: ['style']
      },
      execute: async (args) =>
        semanticSearchPort.searchByVisualStyle(args.style, args.limit)
    },
    {
      name: 'get_clip_search_stats',
      description:
        'Returns statistics and readiness status of the CLIP visual search engine (total cards, cards with clip_embedding, completion percentage).',
      schema: EmptySchema,
      inputSchema: { type: 'object', properties: {} },
      execute: async () => semanticSearchPort.getSemanticSearchStats()
    }
  ];
}

