import { useUIStore } from "../store/useUIStore";
import { Page } from "../types/ui";
import { WindowId } from "../types/windows";
import { AbilitiesPage } from "./abilities/AbilitiesPage";
import { Inventory } from "./inventory/Inventory";
import { PageLayout } from "./PageLayout";
import { RecipesPage } from "./recipes/RecipesPage";
import { SettingsPage } from "./settings/SettingsPage";
import { SkillTree } from "./SkillTree";
import { DraggableWindow } from "./ui/DraggableWindow";

const PAGE_WINDOW_IDS: Record<Page, WindowId> = {
  [Page.Inventory]: WindowId.Inventory,
  [Page.SkillTree]: WindowId.SkillTree,
  [Page.Abilities]: WindowId.Abilities,
  [Page.Recipes]: WindowId.Recipes,
  [Page.Settings]: WindowId.Settings,
};

export const ActivePage: React.FC = () => {
  const activePage = useUIStore((state) => state.activePage);
  const closeActivePage = useUIStore((state) => state.closeActivePage);

  return (
    activePage !== null && (
      // Keyed so switching pages remounts rather than sliding the open window
      // over — each page owns its own remembered spot.
      <DraggableWindow
        key={activePage}
        id={PAGE_WINDOW_IDS[activePage]}
        onClose={closeActivePage}
      >
        <PageLayout>
          {activePage === Page.Inventory && <Inventory />}
          {activePage === Page.SkillTree && <SkillTree />}
          {activePage === Page.Abilities && <AbilitiesPage />}
          {activePage === Page.Recipes && <RecipesPage />}
          {activePage === Page.Settings && <SettingsPage />}
        </PageLayout>
      </DraggableWindow>
    )
  );
};
