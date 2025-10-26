import { useUIStore } from "../store/useUIStore";
import { Page } from "../types/ui";
import { Inventory } from "./Inventory";
import { PageLayout } from "./PageLayout";
import { SkillTree } from "./SkillTree";

export const ActivePage: React.FC = () => {
  const activePage = useUIStore((state) => state.activePage);

  return (
    activePage !== null && (
      <PageLayout>
        {activePage === Page.Inventory && <Inventory />}
        {activePage === Page.SkillTree && <SkillTree />}
      </PageLayout>
    )
  );
};
