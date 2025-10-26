import { useUIStore } from "../store/useUIStore";
import { Page } from "../types/ui";
import { Inventory } from "./Inventory";
import { PageLayout } from "./PageLayout";
import { SkillTree } from "./SkillTree";

export const ActivePage: React.FC = () => {
  const activePage = useUIStore((state) => state.activePage);
  const closeActivePage = useUIStore((state) => state.closeActivePage);

  return (
    activePage !== null && (
      <PageLayout>
        <button onClick={() => closeActivePage()}>Close</button>
        {activePage === Page.Inventory && <Inventory />}
        {activePage === Page.SkillTree && <SkillTree />}
      </PageLayout>
    )
  );
};
