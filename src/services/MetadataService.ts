/**
 * MC:
 * Metadata Service
 * Fetches game metadata from backend and provides access to items, enemies, NPCs, and abilities.
 * Data is lazily loaded and cached after first fetch. (singleton)
 */

import { logger } from "./Logger";
import { ScalingMap } from "../utils/resolveScaling";

const TAG = "MetadataService";

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
    scaling?: ScalingMap;
};



export type QuestItemReward = {
    itemId: string;
    itemName: string;
    quantity: number;
};

export type QuestDefinition = {
    questId: string;
    name: string;
    description: string;
    questType: string;
    goldReward: number;
    xpReward: number;
    gemReward: number;
    itemReward: QuestItemReward[];
};

export type ClassTreeNode = {
    level: number;
    choices: string[]; // 1–3 abilityIds
};

export type ClassTreeDefinition = {
    classId: string;
    nodes: ClassTreeNode[];
};

type ItemSetEffect = {
    piecesRequired: number;
    name: string;
    description: string;
    scaling?: ScalingMap;
};

export type ItemSet = {
    name: string;
    description: string;
    effects: ItemSetEffect[];
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
    private itemSets: Record<string, ItemSet> | null = null;
    private quests: Record<string, QuestDefinition> | null = null;
    private classTrees: Record<string, ClassTreeDefinition> | null = null;
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
            logger.debug(TAG, "Fetch already in progress, reusing existing promise");
            return this.fetchPromise;
        }

        logger.info(TAG, `Fetching metadata from ${this.apiUrl}`);

        const itemSetsPromise = fetch(this.apiUrl + "/item-sets")
            .then(async (response) => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                this.itemSets = await response.json() as Record<string, ItemSet>;
                logger.info(TAG, "Item sets fetched successfully", { sets: Object.keys(this.itemSets).length });
            })
            .catch((err) => {
                logger.error(TAG, "Failed to fetch item sets", err);
            });

        const questsPromise = fetch(this.apiUrl + "/quests")
            .then(async (response) => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                this.quests = await response.json() as Record<string, QuestDefinition>;
                logger.info(TAG, "Quests fetched successfully", { quests: Object.keys(this.quests).length });
            })
            .catch((err) => {
                logger.error(TAG, "Failed to fetch quests", err);
            });

        const classTreesPromise = fetch(this.apiUrl + "/class-trees")
            .then(async (response) => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                this.classTrees = await response.json() as Record<string, ClassTreeDefinition>;
                logger.info(TAG, "Class trees fetched successfully", { classes: Object.keys(this.classTrees).length });
            })
            .catch((err) => {
                logger.error(TAG, "Failed to fetch class trees", err);
            });

        this.fetchPromise = Promise.all([
            fetch(this.apiUrl)
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json() as MetadataResponse;
                    this.data = data;
                    logger.info(TAG, "Metadata fetched successfully", {
                        items: Object.keys(data.items).length,
                        enemies: Object.keys(data.enemies).length,
                        npcs: Object.keys(data.npcs).length,
                        abilities: Object.keys(data.abilities).length,
                    });
                    return data;
                }),
            itemSetsPromise,
            questsPromise,
            classTreesPromise,
        ])
            .then(([data]) => data)
            .catch((err) => {
                logger.error(TAG, "Failed to fetch metadata", err);
                throw err;
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

    getItemSetSync(setId: string): ItemSet | undefined {
        return this.itemSets?.[setId];
    }

    getAllItemSetsSync(): Record<string, ItemSet> | undefined {
        return this.itemSets ?? undefined;
    }

    getQuestSync(questId: string): QuestDefinition | undefined {
        return this.quests?.[questId];
    }

    getAllQuestsSync(): Record<string, QuestDefinition> | undefined {
        return this.quests ?? undefined;
    }

    getClassTreeSync(classId: string): ClassTreeDefinition | undefined {
        return this.classTrees?.[classId];
    }

    getAllClassTreesSync(): Record<string, ClassTreeDefinition> | undefined {
        return this.classTrees ?? undefined;
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

