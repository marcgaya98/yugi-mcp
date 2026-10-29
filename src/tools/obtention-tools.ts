import { z } from 'zod';
import { McpToolDefinition, ObtentionApiPort } from '../types.js';

const OBTENTION_METHODS = [
  'pack',
  'victory',
  'converter',
  'tutorial',
  'initial',
  'sandwich'
] as const;

export const GetCardObtentionMethodsSchema = z.object({
  cardId: z.union([z.string(), z.number()]).describe('Unique card ID')
});

export const GetPackCardsSchema = z.object({
  packId: z.union([z.string(), z.number()]).optional()
});

export const GetCharacterRewardCardsSchema = z.object({
  characterId: z.union([z.string(), z.number()]).optional()
});

export const GetTutorialCardsSchema = z.object({
  day: z.union([z.string(), z.number()]).optional()
});

export const GetCardsByMethodSchema = z.object({
  method: z.enum(OBTENTION_METHODS),
  sourceId: z.string().optional()
});

export const GetExclusiveCardsSchema = z.object({
  method: z.enum(OBTENTION_METHODS)
});

const EmptySchema = z.object({});

export function createObtentionTools(
  obtentionPort: ObtentionApiPort
): McpToolDefinition<any>[] {
  return [
    {
      name: 'get_card_obtention_methods',
      description:
        'CORE TOOL: Retrieves ALL ways to obtain a specific card in Yu-Gi-Oh! GX Tag Force (booster packs, character duel rewards, Card Converter, tutorials, initial starter deck, and Plain Sandwich).',
      schema: GetCardObtentionMethodsSchema,
      inputSchema: {
        type: 'object',
        properties: {
          cardId: { type: ['string', 'number'], description: 'Unique card ID' }
        },
        required: ['cardId']
      },
      execute: async (args) => obtentionPort.getCardAllObtentionMethods(args.cardId)
    },
    {
      name: 'list_obtention_methods',
      description:
        'Returns a summary of all card obtention methods in Yu-Gi-Oh! GX Tag Force along with card counts per method.',
      schema: EmptySchema,
      inputSchema: { type: 'object', properties: {} },
      execute: async () => obtentionPort.getAllObtentionMethods()
    },
    {
      name: 'get_cards_by_method',
      description:
        'Retrieves cards obtainable through a specific method (pack, victory, converter, tutorial, initial, sandwich) and optional sourceId.',
      schema: GetCardsByMethodSchema,
      inputSchema: {
        type: 'object',
        properties: {
          method: { type: 'string', enum: [...OBTENTION_METHODS] },
          sourceId: { type: 'string', description: 'Optional specific source ID' }
        },
        required: ['method']
      },
      execute: async (args) => obtentionPort.getCardsByMethod(args.method, args.sourceId)
    },
    {
      name: 'get_exclusive_cards_by_method',
      description:
        'Retrieves cards that can ONLY be obtained through the specified method (exclusive to that source).',
      schema: GetExclusiveCardsSchema,
      inputSchema: {
        type: 'object',
        properties: {
          method: { type: 'string', enum: [...OBTENTION_METHODS] }
        },
        required: ['method']
      },
      execute: async (args) => obtentionPort.getExclusiveCardsByMethod(args.method)
    },
    {
      name: 'get_pack_cards',
      description:
        'Retrieves cards obtainable from booster packs (all packs or a specific packId).',
      schema: GetPackCardsSchema,
      inputSchema: {
        type: 'object',
        properties: {
          packId: { type: ['string', 'number'], description: 'Optional booster pack ID' }
        }
      },
      execute: async (args) => obtentionPort.getPackCards(args.packId)
    },
    {
      name: 'get_character_reward_cards',
      description:
        'Retrieves cards won by defeating duelists in Yu-Gi-Oh! GX Tag Force (all characters or a specific characterId).',
      schema: GetCharacterRewardCardsSchema,
      inputSchema: {
        type: 'object',
        properties: {
          characterId: { type: ['string', 'number'], description: 'Optional character ID' }
        }
      },
      execute: async (args) => obtentionPort.getCharacterCards(args.characterId)
    },
    {
      name: 'get_converter_cards',
      description:
        'Retrieves all cards obtainable via the Card Converter machine in Yu-Gi-Oh! GX Tag Force.',
      schema: EmptySchema,
      inputSchema: { type: 'object', properties: {} },
      execute: async () => obtentionPort.getConverterCards()
    },
    {
      name: 'get_tutorial_cards',
      description:
        'Retrieves cards rewarded for completing Duel Academy classes/tutorials (all days or a specific day).',
      schema: GetTutorialCardsSchema,
      inputSchema: {
        type: 'object',
        properties: {
          day: { type: ['string', 'number'], description: 'Optional tutorial day' }
        }
      },
      execute: async (args) => obtentionPort.getTutorialCards(args.day)
    },
    {
      name: 'get_initial_deck_cards',
      description: 'Retrieves all cards included in the player initial starter deck.',
      schema: EmptySchema,
      inputSchema: { type: 'object', properties: {} },
      execute: async () => obtentionPort.getInitialDeckCards()
    },
    {
      name: 'get_sandwich_cards',
      description: 'Retrieves all cards obtainable via the Plain Sandwich event.',
      schema: EmptySchema,
      inputSchema: { type: 'object', properties: {} },
      execute: async () => obtentionPort.getSandwichCards()
    }
  ];
}
