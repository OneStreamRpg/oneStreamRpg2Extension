/**
 * MC:
 * Metadata Service
 * Fetches game metadata from backend and provides access to items, enemies, NPCs, and abilities.
 * Data is lazily loaded and cached after first fetch. (singleton)
 */

export type AbilitySlotType = "main" | "second" | "ultimate";
export type CastAnimationPosition = "caster" | "target" | "effect";

type Item = any
type Enemy = any
type NPC = any
type Ability = {
    abilityId: string;
    name: string;
    description: string;
    cooldownMs: number;
    effectId: string;
    type: string;
    castTime: number; // in ticks
    slotType: AbilitySlotType;
    castAnimationId?: string;
    castAnimationPosition?: CastAnimationPosition; // Where the cast animation appears: "caster" (default), "target", or "effect"
};



type MetadataResponse = {
    items: Record<string, Item>;
    enemies: Record<string, Enemy>;
    npcs: Record<string, NPC>;
    abilities: Record<string, Ability>;
    xpRequirements: Record<number, number>;
}

// Service Implementation
class MetadataService {
    private static instance: MetadataService;
    private data: MetadataResponse | null = null;
    private fetchPromise: Promise<MetadataResponse> | null = null;
    private readonly apiUrl = import.meta.env.VITE_SOCKET_URL + "/api/metadata";

    private constructor() { }

    static getInstance(): MetadataService {
        if (!MetadataService.instance) {
            MetadataService.instance = new MetadataService();
        }
        return MetadataService.instance;
    }

    async fetchMetadata(): Promise<MetadataResponse> {
        if (this.data) {
            return this.data;
        }

        // Prevent multiple concurrent fetches
        if (this.fetchPromise) {
            return this.fetchPromise;
        }

        this.fetchPromise = fetch(this.apiUrl)
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json() as MetadataResponse;
                this.data = data;
                return data;
            })
            .finally(() => {
                this.fetchPromise = null;
            });

        return this.fetchPromise;
    }

    private async ensureData(): Promise<MetadataResponse> {
        if (!this.data) {
            await this.fetchMetadata();
        }
        return this.data!;
    }

    async getAllItems(): Promise<Record<string, Item>> {
        const data = await this.ensureData();
        return data.items;
    }


    async getItem(itemId: string): Promise<Item | undefined> {
        const data = await this.ensureData();
        return data.items[itemId];
    }

    async getAllEnemies(): Promise<Record<string, Enemy>> {
        const data = await this.ensureData();
        return data.enemies;
    }

    async getEnemy(enemyId: string): Promise<Enemy | undefined> {
        const data = await this.ensureData();
        return data.enemies[enemyId];
    }

    async getAllNpcs(): Promise<Record<string, NPC>> {
        const data = await this.ensureData();
        return data.npcs;
    }

    async getNpc(npcId: string): Promise<NPC | undefined> {
        const data = await this.ensureData();
        return data.npcs[npcId];
    }


    async getAllAbilities(): Promise<Record<string, Ability>> {
        const data = await this.ensureData();
        return data.abilities;
    }

    async getAbility(abilityId: string): Promise<Ability | undefined> {
        const data = await this.ensureData();
        return data.abilities[abilityId];
    }

    async getXpRequirements(): Promise<Record<number, number>> {
        const data = await this.ensureData();
        return data.xpRequirements;
    }

    // Synchronous getters

    getItemSync(itemId: string): Item | undefined {
        return this.data?.items[itemId];
    }

    getEnemySync(enemyId: string): Enemy | undefined {
        return this.data?.enemies[enemyId];
    }

    getNpcSync(npcId: string): NPC | undefined {
        return this.data?.npcs[npcId];
    }

    getAbilitySync(abilityId: string): Ability | undefined {
        return this.data?.abilities[abilityId];
    }

    getAllItemsSync(): Record<string, Item> | undefined {
        return this.data?.items;
    }

    getAllEnemiesSync(): Record<string, Enemy> | undefined {
        return this.data?.enemies;
    }

    getAllNpcsSync(): Record<string, NPC> | undefined {
        return this.data?.npcs;
    }

    getAllAbilitiesSync(): Record<string, Ability> | undefined {
        return this.data?.abilities;
    }

    getXpRequirementsSync(): Record<number, number> | undefined {
        return this.data?.xpRequirements;
    }

    // Special getters
    getXpForNextLevelSync(level: number): number | undefined {
        const xpRequirements = this.data?.xpRequirements;
        if (!xpRequirements) return undefined;

        const currentXp = xpRequirements[level];
        const nextXp = xpRequirements[level + 1];

        if (nextXp === undefined) return 0;  // max level
        if (currentXp === undefined) return undefined;  // invalid level

        return nextXp - currentXp;
    }
}
// Access over this singleton
export const metadataService = MetadataService.getInstance();

