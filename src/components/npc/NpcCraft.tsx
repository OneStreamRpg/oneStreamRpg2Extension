import { useNpcActions } from "../../hooks/useNpcActions";
import { CraftListData } from "../../types/npcInteraction";
import { metadataService } from "../../services/MetadataService";
import { useSocketStore } from "../../store/socketStore";
import { CdnIcon } from "../ui/CdnIcon";

export const NpcCraft: React.FC<{ data: CraftListData }> = ({ data }) => {
  const socket = useSocketStore((state) => state.socket);
  const { craft } = useNpcActions(socket);

  const npcMeta = metadataService.getNpcSync(data.npcId);
  const npcName = npcMeta?.name ?? data.npcId;

  return (
    <div className="flex flex-col gap-2 min-w-64">
      <h2 className="text-lg font-bold text-center">{npcName} - Crafting</h2>
      <div className="grid grid-cols-1 gap-1 max-h-80 overflow-y-auto">
        {(data.recipes ?? []).map((recipe, index) => {
          const outputMeta = metadataService.getItemSync(recipe.output.itemId);
          const outputName = outputMeta?.name ?? recipe.output.itemId;

          return (
            <div key={index} className="p-2 bg-gray-700/50">
              <div className="flex items-center gap-2">
                <CdnIcon
                  type="items"
                  id={recipe.output.itemId}
                  className="size-10"
                  data-tooltip-id="npc-item-tooltip"
                  data-item-id={recipe.output.itemId}
                  data-item-qty={recipe.output.quantity}
                />
                <div className="flex-1 text-sm">
                  <p className="font-semibold">{recipe.name}</p>
                  {recipe.description && (
                    <p className="text-xs text-gray-400">{recipe.description}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    <span>Requires: </span>
                    {recipe.inputs.map((input, i) => {
                      const inputMeta = metadataService.getItemSync(input.itemId);
                      const inputName = inputMeta?.name ?? input.itemId;
                      return (
                        <span key={input.itemId} className="inline-flex items-center gap-0.5">
                          {i > 0 && ", "}
                          <CdnIcon
                            type="items"
                            id={input.itemId}
                            className="size-4 inline-block"
                            data-tooltip-id="npc-item-tooltip"
                            data-item-id={input.itemId}
                            data-item-qty={input.quantity}
                          />
                          {input.quantity}x {inputName}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Output: {recipe.output.quantity}x {outputName}
                  </p>
                </div>
                <button
                  onClick={() => craft(data.npcId, index + 1)}
                  className="px-3 py-1 bg-blue-700 hover:bg-blue-600 cursor-pointer text-xs"
                >
                  Craft
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
