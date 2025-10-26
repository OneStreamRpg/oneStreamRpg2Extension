import { Inventory } from "./Inventory";
import { PageLayout } from "./PageLayout";

export const ActivePage: React.FC = () => {
  const activePage = "inventory";

  return (
    <PageLayout>
      {activePage === "inventory" && <Inventory />}
      {/* {activePage === "skillTree" && <SkillTree />} */}
    </PageLayout>
  );
};
