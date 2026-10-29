import { z } from 'zod';
import { CatalogApiPort, McpToolDefinition } from '../types.js';

const STRING_OR_ARRAY = {
  oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }]
};

const NUMBER_OR_ARRAY = {
  oneOf: [{ type: 'number' }, { type: 'array', items: { type: 'number' } }]
};

export const GetCardDetailsSchema = z.object({
  cardId: z.union([z.string(), z.number()]).describe('Unique database ID of the card')
});

export const SearchCardsSchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  password: z.string().optional(),
  rarity: z.union([z.string(), z.array(z.string())]).optional(),
  frame: z.union([z.string(), z.array(z.string())]).optional(),
  archetype: z.union([z.string(), z.array(z.string())]).optional(),
  cardType: z.union([z.string(), z.array(z.string())]).optional(),
  attribute: z.union([z.string(), z.array(z.string())]).optional(),
  type: z.union([z.string(), z.array(z.string())]).optional(),
  level: z.union([z.number(), z.array(z.number())]).optional(),
  levelMin: z.number().optional(),
  levelMax: z.number().optional(),
  attack: z.number().optional(),
  attackMin: z.number().optional(),
  attackMax: z.number().optional(),
  defense: z.number().optional(),
  defenseMin: z.number().optional(),
  defenseMax: z.number().optional(),
  spellType: z.union([z.string(), z.array(z.string())]).optional(),
  trapType: z.union([z.string(), z.array(z.string())]).optional(),
  genres: z.union([z.string(), z.array(z.string())]).optional(),
  limitList: z.string().optional().default('Game Original'),
  limitFilter: z.union([z.string(), z.array(z.string())]).optional(),
  page: z.number().optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(24),
  sortBy: z.string().optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
});

export const GetCatalogMetadataSchema = z.object({
  category: z
    .enum(['genres', 'archetypes', 'types'])
    .describe('Metadata category: genres, archetypes, or types')
});

function formatCardSearchResponse(searchResults: Record<string, any>) {
  const pagination = searchResults.pagination ?? {};
  const total = pagination.total ?? 0;
  const page = pagination.page ?? 1;
  const totalPages = pagination.totalPages ?? 0;

  return {
    total,
    page,
    pageSize: pagination.pageSize ?? 24,
    totalPages,
    hasNext: Boolean(pagination.hasNext),
    hasPrev: Boolean(pagination.hasPrev),
    items: searchResults.items ?? [],
    summary: `Found ${total} cards. Showing page ${page} of ${totalPages}.`
  };
}

export function createCardTools(catalogPort: CatalogApiPort): McpToolDefinition<any>[] {
  return [
    {
      name: 'get_card_details',
      description:
        'Retrieves full details of a Yu-Gi-Oh! GX Tag Force card by its numeric ID, including monster/spell/trap data, genres, and image URLs.',
      schema: GetCardDetailsSchema,
      inputSchema: {
        type: 'object',
        properties: {
          cardId: {
            type: ['string', 'number'],
            description: 'Unique database ID of the card'
          }
        },
        required: ['cardId']
      },
      execute: async (args) => catalogPort.getCardById(args.cardId)
    },
    {
      name: 'search_cards',
      description:
        'Advanced Yu-Gi-Oh! GX Tag Force card search with 20+ filters (name, code, password, cardType, attribute, type, level/ATK/DEF ranges, rarity, archetype, genres, limitList, limitFilter, pagination, and sorting).',
      schema: SearchCardsSchema,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Partial card name' },
          code: { type: 'string', description: 'Card code' },
          password: { type: 'string', description: '8-digit card password' },
          rarity: { ...STRING_OR_ARRAY, description: 'ultra, super, rare, common' },
          frame: { ...STRING_OR_ARRAY, description: 'Card frame (normal, effect, fusion, ritual, spell, trap, token)' },
          archetype: { ...STRING_OR_ARRAY, description: 'Archetype name(s)' },
          cardType: { ...STRING_OR_ARRAY, description: 'Monster, Spell, Trap' },
          attribute: { ...STRING_OR_ARRAY, description: 'DARK, LIGHT, WATER, FIRE, EARTH, WIND, DIVINE' },
          type: { ...STRING_OR_ARRAY, description: 'Monster type (Dragon, Warrior, Spellcaster, etc.)' },
          level: { ...NUMBER_OR_ARRAY, description: 'Exact monster level (1-12)' },
          levelMin: { type: 'number', description: 'Minimum monster level' },
          levelMax: { type: 'number', description: 'Maximum monster level' },
          attack: { type: 'number', description: 'Exact ATK' },
          attackMin: { type: 'number', description: 'Minimum ATK' },
          attackMax: { type: 'number', description: 'Maximum ATK' },
          defense: { type: 'number', description: 'Exact DEF' },
          defenseMin: { type: 'number', description: 'Minimum DEF' },
          defenseMax: { type: 'number', description: 'Maximum DEF' },
          spellType: { ...STRING_OR_ARRAY, description: 'Normal, Continuous, Equip, Field, Quick-Play, Ritual' },
          trapType: { ...STRING_OR_ARRAY, description: 'Normal, Continuous, Counter' },
          genres: { ...STRING_OR_ARRAY, description: 'Genre ID(s)' },
          limitList: { type: 'string', default: 'Game Original' },
          limitFilter: { ...STRING_OR_ARRAY, description: '0=Forbidden, 1=Limited, 2=Semi-Limited, 3=Unlimited' },
          page: { type: 'number', default: 1 },
          pageSize: { type: 'number', default: 24, minimum: 1, maximum: 100 },
          sortBy: { type: 'string', default: 'name' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'asc' }
        }
      },
      execute: async (args) => {
        const result = await catalogPort.searchCards(args);
        return formatCardSearchResponse(result);
      }
    },
    {
      name: 'get_catalog_metadata',
      description:
        'Lists all available catalog metadata values for a category: "genres" (card mechanics/tags), "archetypes", or monster "types".',
      schema: GetCatalogMetadataSchema,
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['genres', 'archetypes', 'types'],
            description: 'Metadata category to retrieve'
          }
        },
        required: ['category']
      },
      execute: async (args) => {
        if (args.category === 'genres') return catalogPort.getGenres();
        if (args.category === 'archetypes') return catalogPort.getArchetypes();
        return catalogPort.getMonsterTypes();
      }
    }
  ];
}
