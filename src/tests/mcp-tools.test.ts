import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQueryParams, YugiohApiClient } from '../api/api-client.js';
import { buildDefaultToolRegistry } from '../server.js';
import { YugiohBackendPort } from '../types.js';

function createMockBackendPort(): YugiohBackendPort {
  return {
    healthCheck: async () => true,
    getCardById: async (cardId) => ({ id: Number(cardId), name: 'Blue-Eyes White Dragon' }),
    searchCards: async () => ({
      items: [{ id: 1, name: 'Dark Magician' }],
      pagination: { total: 1, page: 1, pageSize: 24, totalPages: 1, hasNext: false, hasPrev: false }
    }),
    getGenres: async () => [{ id: 1, name: 'Special Summon' }],
    getArchetypes: async () => ['Blue-Eyes', 'Dark Magician'],
    getMonsterTypes: async () => ['Dragon', 'Spellcaster'],
    getCardAllObtentionMethods: async (cardId) => ({
      card: { id: Number(cardId) },
      methods: { packs: [{ id: 'P1' }] }
    }),
    getAllObtentionMethods: async () => [{ method: 'pack', count: 100 }],
    getCardsByMethod: async (method) => ({ method, cards: [] }),
    getExclusiveCardsByMethod: async (method) => ({ method, totalExclusive: 5 }),
    getPackCards: async () => [{ id: 'pack-1' }],
    getCharacterCards: async () => [{ id: 'char-1' }],
    getConverterCards: async () => [{ id: 10 }],
    getTutorialCards: async () => [{ day: 1 }],
    getInitialDeckCards: async () => ({ totalCards: 40 }),
    getSandwichCards: async () => [{ id: 20 }],
    searchByVisualDescription: async (query) => [{ name: 'Headless Knight', searchQuery: query }],
    findVisuallySimilarCards: async (cardId) => ({
      referenceCardId: String(cardId),
      results: [{ cardId: '2', similarityScore: 95 }]
    }),
    searchByVisualStyle: async (style) => ({ style, results: [] }),
    getSemanticSearchStats: async () => ({
      cardsWithClipEmbedding: 2449,
      status: 'available'
    }),
    getCharacters: async () => [{ id: 'jaden', name: 'Jaden Yuki' }],
    getCharacterDecks: async () => [{ id: 'deck-1', name: 'Elemental Hero' }],
    getDeckById: async (deckId) => ({ id: String(deckId), cards: [] }),
    getAllLimitListsWithStats: async () => ({ lists: [{ listName: 'Game Original' }] }),
    getLimitListStatsByName: async (listName) => ({ listName, forbiddenCount: 40 }),
    getGameStatsCategory: async (category) => ({ category, entries: [] })
  };
}

describe('yugi-mcp Tool Registry & Unit Tests', () => {
  it('registers all 22 English MCP tools across Catalog, Obtention, CLIP Search, Duelists & Stats', () => {
    const registry = buildDefaultToolRegistry(createMockBackendPort());
    const descriptors = registry.listToolDescriptors();
    const names = descriptors.map((tool) => tool.name);

    assert.equal(descriptors.length, 22);
    assert.ok(names.includes('get_card_details'));
    assert.ok(names.includes('search_cards'));
    assert.ok(names.includes('get_catalog_metadata'));
    assert.ok(names.includes('get_card_obtention_methods'));
    assert.ok(names.includes('search_cards_by_visual_description'));
    assert.ok(names.includes('find_visually_similar_cards'));
    assert.ok(names.includes('search_cards_by_visual_style'));
    assert.ok(names.includes('get_clip_search_stats'));
    assert.ok(names.includes('list_characters'));
    assert.ok(names.includes('get_character_decks'));
    assert.ok(names.includes('get_deck_details'));
    assert.ok(names.includes('get_limit_list_stats'));
    assert.ok(names.includes('get_game_stats'));
  });

  it('normalizes array query parameters into comma-separated strings', () => {
    const normalized = normalizeQueryParams({
      attribute: ['DARK', 'LIGHT'],
      levelMin: 4,
      empty: undefined,
      blank: ''
    });

    assert.deepEqual(normalized, {
      attribute: 'DARK,LIGHT',
      levelMin: 4
    });
  });

  it('executes tools and validates Zod arguments cleanly', async () => {
    const registry = buildDefaultToolRegistry(createMockBackendPort());

    const visualRes = await registry.executeToolCall(
      'search_cards_by_visual_description',
      { query: 'guerrero con espada y armadura', limit: 5 }
    );
    assert.equal(visualRes.isError, undefined);
    const parsedVisual = JSON.parse(visualRes.content[0]?.text ?? '[]');
    assert.equal(parsedVisual[0].name, 'Headless Knight');

    const invalidRes = await registry.executeToolCall('get_card_details', {});
    assert.equal(invalidRes.isError, true);

    const unknownToolRes = await registry.executeToolCall('non_existent_tool', {});
    assert.equal(unknownToolRes.isError, true);
  });
});

describe('yugi-mcp Live Integration against yugioh-ts-ddd (:3001)', () => {
  const client = new YugiohApiClient('http://localhost:3001/api');
  const registry = buildDefaultToolRegistry(client);

  it('verifies healthCheck and executes Catalog, Obtention, CLIP, Duelist and Stats tools against :3001', async (t) => {
    const healthy = await client.healthCheck();
    if (!healthy) {
      t.skip('Skipping live E2E test: yugioh-ts-ddd backend on :3001 is not reachable');
      return;
    }

    const searchRes = await registry.executeToolCall('search_cards', {
      cardType: 'Monster',
      attribute: ['LIGHT', 'DARK'],
      pageSize: 3
    });
    assert.equal(searchRes.isError, undefined);
    const searchData = JSON.parse(searchRes.content[0]?.text ?? '{}');
    assert.ok(searchData.total > 0);
    const sampleCardId = searchData.items[0].id;

    const obtentionRes = await registry.executeToolCall('get_card_obtention_methods', {
      cardId: sampleCardId
    });
    assert.equal(obtentionRes.isError, undefined);

    const clipRes = await registry.executeToolCall('search_cards_by_visual_description', {
      query: 'guerrero con espada y armadura',
      limit: 3
    });
    assert.equal(clipRes.isError, undefined);
    const clipItems = JSON.parse(clipRes.content[0]?.text ?? '[]');
    assert.equal(clipItems.length, 3);
    assert.ok(clipItems[0].similarityScore >= 90);

    const banlistRes = await registry.executeToolCall('get_limit_list_stats', {
      listName: 'Game Original'
    });
    assert.equal(banlistRes.isError, undefined);

    const statsRes = await registry.executeToolCall('get_game_stats', {
      category: 'bonus'
    });
    assert.equal(statsRes.isError, undefined);
  });
});

