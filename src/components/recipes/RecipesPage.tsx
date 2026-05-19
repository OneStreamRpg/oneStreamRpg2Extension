import { Tooltip } from "react-tooltip";
import { useNpcActions } from "../../hooks/useNpcActions";
import { metadataService } from "../../services/MetadataService";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { useSocketStore } from "../../store/socketStore";
import { CalcBreakdown } from "../ui/CalcBreakdown";
import { ResolvedToken } from "../../utils/resolveScaling";
import { InventoryTooltip } from "../inventory/InventoryTooltip";
import { Item } from "../inventory/types";

function makeItem(itemId: string, quantity: number): Item {
  return { id: itemId, itemId, quantity, tags: [] };
}

export const RecipesPage: React.FC = () => {
  const socket = useSocketStore((state) => state.socket);
  const { setTargetNpc } = useNpcActions(socket);
  const craftRecipes = usePersonalChannelStore(
    (state) => state.displayedState?.craftRecipes ?? []
  );

  const allRecipes = craftRecipes.flatMap((npc) =>
    npc.recipes.map((recipe) => ({ recipe, npc }))
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1 pb-1" style={{ borderBottom: "1px solid #3d2a0a" }}>
          <p className="text-xs" style={{ color: "#9a7850" }}>Craft recipes at the Crafting Table.</p>
          <button
            onClick={() => setTargetNpc("craftingTable")}
            className="text-xs px-2 py-1 rounded"
            style={{ backgroundColor: "#3d2a0a", color: "#f0d8a8", border: "1px solid #7a5520" }}
          >
            Go to Crafting Table
          </button>
        </div>

        {allRecipes.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-4">No recipes unlocked yet.</p>
        )}

        {allRecipes.map(({ recipe, npc }) => {
          const outputMeta = metadataService.getItemSync(recipe.output.itemId);
          return (
            <div
              key={`${npc.npcId}-${recipe.recipeId}`}
              className="rounded p-2"
              style={{ backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid #3d2a0a" }}
            >
              {/* Output */}
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={`https://cdn.onestreamrpg.com/images/items/${recipe.output.itemId}.png`}
                  alt={outputMeta?.name ?? recipe.output.itemId}
                  className="size-10"
                  style={{ imageRendering: "pixelated" }}
                  data-tooltip-id="recipes-tooltip"
                  data-item-id={recipe.output.itemId}
                  data-item-qty={recipe.output.quantity}
                />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#f0d8a8" }}>
                    {recipe.output.quantity > 1 ? `${recipe.output.quantity}× ` : ""}{outputMeta?.name ?? recipe.output.itemId}
                  </p>
                  {recipe.description && (
                    <p className="text-xs" style={{ color: "#9a7850" }}>{recipe.description}</p>
                  )}
                </div>
              </div>

              {/* Inputs */}
              <div className="flex flex-wrap gap-2">
                {recipe.inputs.map((input) => {
                  const inputMeta = metadataService.getItemSync(input.itemId);
                  return (
                    <div
                      key={input.itemId}
                      className="flex items-center gap-1 text-xs"
                      style={{ color: "#c8a878" }}
                      data-tooltip-id="recipes-tooltip"
                      data-item-id={input.itemId}
                      data-item-qty={input.quantity}
                    >
                      <img
                        src={`https://cdn.onestreamrpg.com/images/items/${input.itemId}.png`}
                        alt={inputMeta?.name ?? input.itemId}
                        className="size-6"
                        style={{ imageRendering: "pixelated" }}
                      />
                      <span>{input.quantity}× {inputMeta?.name ?? input.itemId}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Tooltip
        id="recipes-tooltip"
        place="right"
        clickable
        delayShow={600}
        render={({ activeAnchor }) => {
          const itemId = activeAnchor?.getAttribute("data-item-id");
          const qty = parseInt(activeAnchor?.getAttribute("data-item-qty") ?? "1", 10);
          if (!itemId) return null;
          return <InventoryTooltip item={makeItem(itemId, qty)} />;
        }}
      />

      <Tooltip
        id="inventory-calc-tooltip"
        place="right"
        delayShow={0}
        style={{ zIndex: 9999 }}
        render={({ activeAnchor }) => {
          const raw = activeAnchor?.getAttribute("data-breakdown");
          if (!raw) return null;
          try {
            return <CalcBreakdown resolved={JSON.parse(raw) as ResolvedToken} />;
          } catch {
            return null;
          }
        }}
      />
    </>
  );
};
