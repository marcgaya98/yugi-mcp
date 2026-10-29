import { z } from 'zod';
import {
  DuelistApiPort,
  LimitListAndStatsApiPort,
  McpToolDefinition
} from '../types.js';

export const ListCharactersSchema = z.object({
  tier: z.string().optional().describe('Optional character tier filter'),
  pack: z.string().optional().describe('Optional associated booster pack filter'),
  search: z.string().optional().describe('Optional partial character name search')
});

export const GetCharacterDecksSchema = z.object({
  characterId: z.union([z.string(), z.number()]).describe('Unique character ID'),
  limit: z.number().min(1).max(50).optional().default(20)
});

export const GetDeckDetailsSchema = z.object({
  deckId: z.union([z.string(), z.number()]).describe('Unique deck ID')
});

export const GetLimitListStatsSchema = z.object({
  listName: z
    .string()
    .optional()
    .describe('Optional limit list name (e.g., "Game Original"). Omit to get all lists.')
});

export const GetGameStatsSchema = z.object({
  category: z
    .enum(['bonus', 'challenge', 'high-score'])
    .describe('Game stats category: bonus, challenge, or high-score')
});

export function createDuelistAndStatsTools(
  duelistPort: DuelistApiPort,
  statsPort: LimitListAndStatsApiPort
): McpToolDefinition<any>[] {
  return [
    {
      name: 'list_characters',
      description:
        'Lists duelists/characters in Yu-Gi-Oh! GX Tag Force with optional filters by tier, pack, or name.',
      schema: ListCharactersSchema,
      inputSchema: {
        type: 'object',
        properties: {
          tier: { type: 'string', description: 'Optional character tier filter' },
          pack: { type: 'string', description: 'Optional associated booster pack' },
          search: { type: 'string', description: 'Optional character name search' }
        }
      },
      execute: async (args) => duelistPort.getCharacters(args)
    },
    {
      name: 'get_character_decks',
      description:
        'Retrieves all decks used by a specific character in Yu-Gi-Oh! GX Tag Force.',
      schema: GetCharacterDecksSchema,
      inputSchema: {
        type: 'object',
        properties: {
          characterId: { type: ['string', 'number'], description: 'Character ID' },
          limit: { type: 'number', default: 20, minimum: 1, maximum: 50 }
        },
        required: ['characterId']
      },
      execute: async (args) => duelistPort.getCharacterDecks(args.characterId, args.limit)
    },
    {
      name: 'get_deck_details',
      description:
        'Retrieves full details of a specific deck by deckId, including its owner and card list (main, side, fusion sections).',
      schema: GetDeckDetailsSchema,
      inputSchema: {
        type: 'object',
        properties: {
          deckId: { type: ['string', 'number'], description: 'Deck ID' }
        },
        required: ['deckId']
      },
      execute: async (args) => duelistPort.getDeckById(args.deckId)
    },
    {
      name: 'get_limit_list_stats',
      description:
        'Retrieves Forbidden/Limited/Semi-Limited card lists and statistics (all banlists or a specific listName such as "Game Original").',
      schema: GetLimitListStatsSchema,
      inputSchema: {
        type: 'object',
        properties: {
          listName: {
            type: 'string',
            description: 'Optional banlist name (e.g., "Game Original")'
          }
        }
      },
      execute: async (args) =>
        args.listName
          ? statsPort.getLimitListStatsByName(args.listName)
          : statsPort.getAllLimitListsWithStats()
    },
    {
      name: 'get_game_stats',
      description:
        'Retrieves Yu-Gi-Oh! GX Tag Force game statistics by category: "bonus" (duel bonuses), "challenge" (challenges), or "high-score" (records).',
      schema: GetGameStatsSchema,
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['bonus', 'challenge', 'high-score'],
            description: 'Category of game statistics'
          }
        },
        required: ['category']
      },
      execute: async (args) => statsPort.getGameStatsCategory(args.category)
    }
  ];
}

