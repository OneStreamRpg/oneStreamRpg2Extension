import { useNpcActions } from "../../hooks/useNpcActions";
import { RecipesData } from "../../types/npcInteraction";
import { metadataService } from "../../services/MetadataService";
import { useSocketStore } from "../../store/socketStore";

export const NpcRecipes: React.FC<{ data: RecipesData }> = ({ data }) => {
  const socket = useSocketStore((state) => state.socket);
  const { buyRecipe } = useNpcActions(socket);

  const npcMeta = metadataService.getNpcSync(data.npcId);
  const npcName = npcMeta?.name ?? data.npcId;

  return (
    <div className="flex flex-col gap-2 min-w-64">
      <h2 className="text-lg font-bold text-center">{npcName} - Recipes</h2>
      <div className="grid grid-cols-1 gap-1 max-h-80 overflow-y-auto">
        {(data.recipes ?? []).map((recipe, index) => {
          const recipeName = recipe.recipeId;

          return (
            <div key={index} className="p-2 bg-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-semibold">{recipeName}</p>
                  {recipe.goldPrice !== undefined && (
                    <p className="text-xs text-gray-400">
                      {recipe.goldPrice} gold
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => buyRecipe(data.npcId, index + 1)}
                    className="px-2 py-1 bg-yellow-700 hover:bg-yellow-600 cursor-pointer text-xs"
                  >
                    Buy
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
