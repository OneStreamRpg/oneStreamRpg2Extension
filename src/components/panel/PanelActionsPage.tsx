import { AbilitiesNav } from "../AbilitiesNav";

export const PanelActionsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 p-4">
      <section>
        <h2 className="text-sm font-bold mb-3" style={{ color: "#c8a020" }}>
          Abilities
        </h2>
        <div className="flex flex-wrap gap-3 justify-center">
          <AbilitiesNav />
        </div>
      </section>
    </div>
  );
};
