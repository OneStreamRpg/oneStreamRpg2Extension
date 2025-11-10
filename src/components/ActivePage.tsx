import { useUIStore } from "../store/useUIStore";
import { Page } from "../types/ui";
import { Inventory } from "./inventory/Inventory";
import { InventoryChangeEvent } from "./inventory/types";
import { PageLayout } from "./PageLayout";
import { SkillTree } from "./SkillTree";

export const ActivePage: React.FC = () => {
  const activePage = useUIStore((state) => state.activePage);

  const handleInventoryUpdateExample = (event: InventoryChangeEvent) => {
    console.log("Inventory Updated!", event);
  };
  return (
    activePage !== null && (
      <PageLayout>
        {activePage === Page.Inventory && (
          <Inventory onInventoryChange={handleInventoryUpdateExample} />
        )}
        {activePage === Page.SkillTree && <SkillTree />}
      </PageLayout>
    )
  );
};
