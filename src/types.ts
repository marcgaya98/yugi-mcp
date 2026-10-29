import { z } from 'zod';

export interface CardSearchParams {
  name?: string | undefined;
  code?: string | undefined;
  password?: string | undefined;
  rarity?: string | string[] | undefined;
  frame?: string | string[] | undefined;
  archetype?: string | string[] | undefined;
  cardType?: string | string[] | undefined;
  attribute?: string | string[] | undefined;
  type?: string | string[] | undefined;
  level?: number | number[] | undefined;
  levelMin?: number | undefined;
  levelMax?: number | undefined;
  attack?: number | undefined;
  attackMin?: number | undefined;
  attackMax?: number | undefined;
  defense?: number | undefined;
  defenseMin?: number | undefined;
  defenseMax?: number | undefined;
  spellType?: string | string[] | undefined;
  trapType?: string | string[] | undefined;
  genres?: string | string[] | undefined;
  limitList?: string | undefined;
  limitFilter?: string | string[] | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export interface CharacterFilterParams {
  tier?: string | undefined;
  pack?: string | undefined;
  search?: string | undefined;
}

export interface CatalogApiPort {
  getCardById(cardId: string | number): Promise<unknown>;
  searchCards(params?: CardSearchParams): Promise<Record<string, any>>;
  getGenres(): Promise<unknown>;
  getArchetypes(): Promise<unknown>;
  getMonsterTypes(): Promise<unknown>;
}

export interface ObtentionApiPort {
  getCardAllObtentionMethods(cardId: string | number): Promise<unknown>;
  getAllObtentionMethods(): Promise<unknown>;
  getCardsByMethod(method: string, sourceId?: string): Promise<unknown>;
  getExclusiveCardsByMethod(method: string): Promise<unknown>;
  getPackCards(packId?: string | number): Promise<unknown>;
  getCharacterCards(characterId?: string | number): Promise<unknown>;
  getConverterCards(): Promise<unknown>;
  getTutorialCards(day?: string | number): Promise<unknown>;
  getInitialDeckCards(): Promise<unknown>;
  getSandwichCards(): Promise<unknown>;
}

export interface SemanticSearchApiPort {
  searchByVisualDescription(query: string, limit?: number): Promise<unknown>;
  findVisuallySimilarCards(cardId: string | number, limit?: number): Promise<unknown>;
  searchByVisualStyle(style: string, limit?: number): Promise<unknown>;
  getSemanticSearchStats(): Promise<unknown>;
}

export interface DuelistApiPort {
  getCharacters(filters?: CharacterFilterParams): Promise<unknown>;
  getCharacterDecks(characterId: string | number, limit?: number): Promise<unknown>;
  getDeckById(deckId: string | number): Promise<unknown>;
}

export interface LimitListAndStatsApiPort {
  getAllLimitListsWithStats(): Promise<unknown>;
  getLimitListStatsByName(listName: string): Promise<unknown>;
  getGameStatsCategory(category: 'bonus' | 'challenge' | 'high-score'): Promise<unknown>;
}

export interface YugiohBackendPort
  extends CatalogApiPort,
    ObtentionApiPort,
    SemanticSearchApiPort,
    DuelistApiPort,
    LimitListAndStatsApiPort {
  healthCheck(): Promise<boolean>;
}

export interface McpToolResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface McpToolInputSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
}

export interface McpToolDefinition<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  schema: TSchema;
  inputSchema: McpToolInputSchema;
  execute(args: z.infer<TSchema>): Promise<unknown>;
}
