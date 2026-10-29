import axios, { AxiosInstance } from 'axios';
import {
  CardSearchParams,
  CharacterFilterParams,
  YugiohBackendPort
} from '../types.js';
import { McpLogger } from '../utils/mcp-logger.js';

export const DEFAULT_API_BASE_URL = 'http://localhost:3001/api';
const DEFAULT_HTTP_TIMEOUT_MS = 30000;
const HEALTH_CHECK_TIMEOUT_MS = 5000;

export function normalizeQueryParams(
  rawParams: Record<string, unknown>
): Record<string, string | number> {
  const normalized: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(rawParams)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    normalized[key] = Array.isArray(value) ? value.join(',') : (value as string | number);
  }

  return normalized;
}

export class YugiohApiClient implements YugiohBackendPort {
  private readonly client: AxiosInstance;

  constructor(baseUrl = DEFAULT_API_BASE_URL) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: DEFAULT_HTTP_TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/cards', {
        params: { pageSize: 1 },
        timeout: HEALTH_CHECK_TIMEOUT_MS
      });
      return response.status === 200 && response.data?.success === true;
    } catch (error) {
      McpLogger.logError('YugiohApiClient', 'API health check failed', error);
      return false;
    }
  }

  public async getCardById(cardId: string | number): Promise<unknown> {
    return this.requestData(`/cards/${encodeURIComponent(String(cardId))}`);
  }

  public async searchCards(params: CardSearchParams = {}): Promise<Record<string, any>> {
    const queryParams = normalizeQueryParams(params as Record<string, unknown>);
    return this.requestData<Record<string, any>>('/cards', queryParams);
  }

  public async getGenres(): Promise<unknown> {
    return this.requestData('/genres');
  }

  public async getArchetypes(): Promise<unknown> {
    return this.requestData('/archetypes');
  }

  public async getMonsterTypes(): Promise<unknown> {
    return this.requestData('/types');
  }

  public async getCardAllObtentionMethods(cardId: string | number): Promise<unknown> {
    return this.requestData(`/obtentions/cards/${encodeURIComponent(String(cardId))}/all`);
  }

  public async getAllObtentionMethods(): Promise<unknown> {
    return this.requestData('/obtentions/methods');
  }

  public async getCardsByMethod(method: string, sourceId?: string): Promise<unknown> {
    const params = sourceId ? { sourceId } : {};
    return this.requestData(`/obtentions/methods/${encodeURIComponent(method)}`, params);
  }

  public async getExclusiveCardsByMethod(method: string): Promise<unknown> {
    return this.requestData(`/obtentions/methods/${encodeURIComponent(method)}/exclusive`);
  }

  public async getPackCards(packId?: string | number): Promise<unknown> {
    const path = packId
      ? `/obtentions/packs/${encodeURIComponent(String(packId))}`
      : '/obtentions/packs';
    return this.requestData(path);
  }

  public async getCharacterCards(characterId?: string | number): Promise<unknown> {
    const path = characterId
      ? `/obtentions/characters/${encodeURIComponent(String(characterId))}`
      : '/obtentions/characters';
    return this.requestData(path);
  }

  public async getConverterCards(): Promise<unknown> {
    return this.requestData('/obtentions/converter');
  }

  public async getTutorialCards(day?: string | number): Promise<unknown> {
    const path = day
      ? `/obtentions/tutorials/${encodeURIComponent(String(day))}`
      : '/obtentions/tutorials';
    return this.requestData(path);
  }

  public async getInitialDeckCards(): Promise<unknown> {
    return this.requestData('/obtentions/initial-deck');
  }

  public async getSandwichCards(): Promise<unknown> {
    return this.requestData('/obtentions/sandwich');
  }

  public async searchByVisualDescription(query: string, limit = 20): Promise<unknown> {
    return this.requestData('/semantic-search', { query, limit });
  }

  public async findVisuallySimilarCards(
    cardId: string | number,
    limit = 12
  ): Promise<unknown> {
    return this.requestData(
      `/semantic-search/similar/${encodeURIComponent(String(cardId))}`,
      { limit }
    );
  }

  public async searchByVisualStyle(style: string, limit = 20): Promise<unknown> {
    return this.requestData('/semantic-search/style', { style, limit });
  }

  public async getSemanticSearchStats(): Promise<unknown> {
    return this.requestData('/semantic-search/stats');
  }

  public async getCharacters(filters: CharacterFilterParams = {}): Promise<unknown> {
    const queryParams = normalizeQueryParams(filters as Record<string, unknown>);
    return this.requestData('/characters', queryParams);
  }

  public async getCharacterDecks(
    characterId: string | number,
    limit = 20
  ): Promise<unknown> {
    return this.requestData(
      `/characters/${encodeURIComponent(String(characterId))}/decks`,
      { limit }
    );
  }

  public async getDeckById(deckId: string | number): Promise<unknown> {
    return this.requestData(`/decks/${encodeURIComponent(String(deckId))}`);
  }

  public async getAllLimitListsWithStats(): Promise<unknown> {
    return this.requestData('/limit-lists/stats');
  }

  public async getLimitListStatsByName(listName: string): Promise<unknown> {
    return this.requestData(`/limit-lists/${encodeURIComponent(listName)}/stats`);
  }

  public async getGameStatsCategory(
    category: 'bonus' | 'challenge' | 'high-score'
  ): Promise<unknown> {
    return this.requestData(`/game-stats/${category}`);
  }

  private async requestData<T = unknown>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    try {
      const response = await this.client.get(endpoint, { params });
      if (response.data?.success) {
        return response.data.data as T;
      }
      throw new Error(response.data?.error || `Unsuccessful API response from ${endpoint}`);
    } catch (error) {
      throw this.mapHttpError(endpoint, error);
    }
  }

  private mapHttpError(endpoint: string, error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data?.error || error.message;
      const status = error.response?.status;
      return new Error(`HTTP ${status ?? 'ERR'} on ${endpoint}: ${apiError}`);
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
