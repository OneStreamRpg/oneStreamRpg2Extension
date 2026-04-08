import { useUIStore } from "../store/useUIStore";
import { Page } from "../types/ui";
import { AbilitiesPage } from "./abilities/AbilitiesPage";
import { ClassTree } from "./ClassTree";
import { Inventory } from "./inventory/Inventory";
import { PageLayout } from "./PageLayout";
import { RecipesPage } from "./recipes/RecipesPage";
import { SkillTree } from "./SkillTree";

export const ActivePage: React.FC = () => {
  const activePage = useUIStore((state) => state.activePage);

  return (
    activePage !== null && (
      <PageLayout>
        {activePage === Page.Inventory && <Inventory />}
        {activePage === Page.SkillTree && <SkillTree />}
        {activePage === Page.Abilities && <AbilitiesPage />}
        {activePage === Page.Recipes && <RecipesPage />}
        {activePage === Page.ClassTree && <ClassTree />}
      </PageLayout>
    )
  );
};
