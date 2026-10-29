# Catálogo de Herramientas MCP (`yugi-mcp` v2.0)

El servidor expone **22 herramientas en inglés** organizadas en 4 dominios cohesivos.

---

## 1. Catálogo y Metadatos (`src/tools/card-tools.ts`)

| Herramienta | Endpoint Backend | Descripción |
| :--- | :--- | :--- |
| `get_card_details` | `GET /api/cards/:cardId` | Detalle completo de una carta por su ID numérico (datos de monstruo/magia/trampa, géneros e imágenes). |
| `search_cards` | `GET /api/cards` | Búsqueda avanzada con más de 20 filtros (`name`, `code`, `password`, `cardType`, `attribute`, `type`, `levelMin/Max`, `attackMin/Max`, `defenseMin/Max`, `rarity`, `archetype`, `genres`, `limitList`, `limitFilter`, `page`, `pageSize`, `sortBy`, `sortOrder`). |
| `get_catalog_metadata` | `GET /api/genres`, `/archetypes`, `/types` | Lista los valores disponibles para `genres`, `archetypes` o `types`. |

---

## 2. Métodos de Obtención (`src/tools/obtention-tools.ts`)

| Herramienta | Endpoint Backend | Descripción |
| :--- | :--- | :--- |
| `get_card_obtention_methods` | `GET /api/obtentions/cards/:cardId/all` | **Herramienta principal**: devuelve todas las vías para conseguir una carta en *Yu-Gi-Oh! GX Tag Force*. |
| `list_obtention_methods` | `GET /api/obtentions/methods` | Resumen de todos los métodos de obtención y cantidad de cartas por método. |
| `get_cards_by_method` | `GET /api/obtentions/methods/:method` | Filtra cartas por método (`pack`, `victory`, `converter`, `tutorial`, `initial`, `sandwich`) y `sourceId` opcional. |
| `get_exclusive_cards_by_method` | `GET /api/obtentions/methods/:method/exclusive` | Cartas que **solo** se pueden conseguir mediante ese método específico. |
| `get_pack_cards` | `GET /api/obtentions/packs[/:packId]` | Cartas disponibles en sobres/packs (todos o un `packId` específico). |
| `get_character_reward_cards` | `GET /api/obtentions/characters[/:characterId]` | Cartas obtenidas al derrotar duelistas (todos o un `characterId`). |
| `get_converter_cards` | `GET /api/obtentions/converter` | Cartas obtenibles en la máquina recicladora (*Card Converter*). |
| `get_tutorial_cards` | `GET /api/obtentions/tutorials[/:day]` | Cartas entregadas en clases/tutoriales de la Academia de Duelos. |
| `get_initial_deck_cards` | `GET /api/obtentions/initial-deck` | Cartas incluidas en el mazo inicial del jugador. |
| `get_sandwich_cards` | `GET /api/obtentions/sandwich` | Cartas obtenibles mediante el evento *Plain Sandwich*. |

---

## 3. Búsqueda Semántica Visual con CLIP (`src/tools/semantic-search-tools.ts`)

| Herramienta | Endpoint Backend | Descripción |
| :--- | :--- | :--- |
| `search_cards_by_visual_description` | `GET /api/semantic-search?query=...` | Busca cartas por descripción visual del arte en español o inglés usando `clip_embedding` (ej. `"guerrero con espada y armadura"`, `"dragón azul con alas"`). |
| `find_visually_similar_cards` | `GET /api/semantic-search/similar/:cardId` | Encuentra las cartas con arte visualmente más parecido a `cardId` mediante similitud coseno de `clip_embedding`. |
| `search_cards_by_visual_style` | `GET /api/semantic-search/style?style=...` | Busca cartas por estilo estético predefinido (`dark-magician`, `blue-dragon`, `ghost-rare`). |
| `get_clip_search_stats` | `GET /api/semantic-search/stats` | Estadísticas y estado de cobertura del motor CLIP (`clip_embedding`). |

---

## 4. Duelistas, Decks, Banlists y Estadísticas (`src/tools/duelist-and-stats-tools.ts`)

| Herramienta | Endpoint Backend | Descripción |
| :--- | :--- | :--- |
| `list_characters` | `GET /api/characters` | Lista los personajes del juego con filtros opcionales por `tier`, `pack` o `search`. |
| `get_character_decks` | `GET /api/characters/:characterId/decks` | Obtiene los mazos asociados a un personaje específico. |
| `get_deck_details` | `GET /api/decks/:deckId` | Obtiene el detalle completo y lista de cartas de un mazo (`main`, `side`, `fusion`). |
| `get_limit_list_stats` | `GET /api/limit-lists[/stats \| /:listName/stats]` | Estadísticas y cartas Prohibidas/Limitadas/Semi-Limitadas por lista (`Game Original`, etc.). |
| `get_game_stats` | `GET /api/game-stats/:category` | Estadísticas del juego por categoría (`bonus`, `challenge`, `high-score`). |
