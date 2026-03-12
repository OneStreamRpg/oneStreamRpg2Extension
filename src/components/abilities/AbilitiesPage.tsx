import { usePersonalChannelActions } from "../../hooks/usePersonalChannelActions";
import { AbilitySlotType, metadataService } from "../../services/MetadataService";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { useSocketStore } from "../../store/socketStore";
import { CdnIcon } from "../ui/CdnIcon";

const SLOT_TYPES: AbilitySlotType[] = ["main", "second", "ultimate"];

const SLOT_LABELS: Record<AbilitySlotType, string> = {
  main: "Main",
  second: "Second",
  ultimate: "Ultimate",
};

export const AbilitiesPage: React.FC = () => {
  const displayedState = usePersonalChannelStore(
    (state) => state.displayedState
  );
  const socket = useSocketStore((state) => state.socket);
  const { equipAbility, unequipAbility } = usePersonalChannelActions(socket);

  if (!displayedState) {
    return <div>Loading abilities...</div>;
  }

  const { abilities } = displayedState;
  const equipped = abilities?.equipped ?? [];
  const inventory: string[] = abilities?.inventory ?? [];

  // Find which ability is equipped in each slot
  const getEquippedAbilityId = (slot: AbilitySlotType): string | null => {
    const eq = equipped.find(
      (a: { slot: AbilitySlotType; abilityId: string }) => a.slot === slot
    );
    const id = eq?.abilityId;
    return id && id !== "empty" ? id : null;
  };

  // Group inventory abilities by slotType from metadata
  const abilitiesBySlot: Record<AbilitySlotType, string[]> = {
    main: [],
    second: [],
    ultimate: [],
  };

  for (const abilityId of inventory) {
    const meta = metadataService.getAbilitySync(abilityId);
    if (meta && meta.slotType) {
      abilitiesBySlot[meta.slotType].push(abilityId);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Abilities</h2>
      {SLOT_TYPES.map((slotType) => {
        const equippedId = getEquippedAbilityId(slotType);
        const abilityIds = abilitiesBySlot[slotType];

        return (
          <div key={slotType} className="mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-1">
              {SLOT_LABELS[slotType]}
            </h3>
            <div className="flex flex-wrap gap-2">
              {abilityIds.length === 0 && (
                <p className="text-xs text-gray-500">No abilities learned</p>
              )}
              {abilityIds.map((abilityId) => {
                const meta = metadataService.getAbilitySync(abilityId);
                const isEquipped = equippedId === abilityId;

                return (
                  <button
                    key={abilityId}
                    onClick={() =>
                      isEquipped
                        ? unequipAbility(slotType)
                        : equipAbility(abilityId)
                    }
                    className={`flex flex-col items-center p-1 w-16 cursor-pointer ${
                      isEquipped
                        ? "bg-blue-800 border border-blue-400"
                        : "bg-gray-800 hover:bg-gray-700 border border-gray-600"
                    }`}
                  >
                    <CdnIcon
                      type="abilities"
                      id={abilityId}
                      className="size-10"
                      alt={meta?.name}
                    />
                    <span className="text-xs mt-0.5 truncate w-full text-center">
                      {meta?.name ?? abilityId}
                    </span>
                    {isEquipped && (
                      <span className="text-xs text-blue-300">Equipped</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
