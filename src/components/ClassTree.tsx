import { useEffect, useState } from "react";
import { usePersonalChannelActions } from "../hooks/usePersonalChannelActions";
import { ClassTreeDefinition, ClassTreeNode, metadataService } from "../services/MetadataService";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useSocketStore } from "../store/socketStore";
import { PendingClassTreeChoice } from "../types/personalChannel";
import { CdnIcon } from "./ui/CdnIcon";

// Layout constants
const NODE_SIZE = 56;
const LABEL_H = 16;
const ROW_STRIDE = NODE_SIZE + LABEL_H + 36;
const CONTAINER_W = 280;
const FIRST_ROW_Y = 50;
const FORK_Y = 16;

/** Column centers for 1, 2, or 3 nodes inside CONTAINER_W. */
function getColumnCenters(count: number): number[] {
  if (count === 1) return [140];
  if (count === 2) return [80, 200];
  // 3: equal spacing — left margin = inter-gap = right margin = 28px, centers at 56/140/224
  return [56, 140, 224];
}

/** 0-based index of the chosen ability at this node, or null if none. */
function pickedIndex(node: ClassTreeNode, choices: Record<string, string>): number | null {
  const chosen = choices[String(node.level)];
  if (!chosen) return null;
  const idx = node.choices.indexOf(chosen);
  return idx >= 0 ? idx : null;
}

type NodeState = "locked" | "available" | "picked" | "notPicked";

function getNodeState(
  nodeLevel: number,
  abilityId: string,
  playerLevel: number,
  choices: Record<string, string>,
  pending: PendingClassTreeChoice | null
): NodeState {
  if (playerLevel < nodeLevel) return "locked";
  const chosen = choices[String(nodeLevel)];
  if (chosen === abilityId) return "picked";
  if (chosen) return "notPicked";
  if (pending?.level === nodeLevel) return "available";
  return "locked";
}

type NodeProps = {
  abilityId: string;
  name: string;
  state: NodeState;
  levelLabel: string;
  onClick: () => void;
};

const AbilityNode: React.FC<NodeProps> = ({ abilityId, name, state, levelLabel, onClick }) => {
  const isClickable = state === "available";

  const iconStyle: React.CSSProperties = {
    imageRendering: "pixelated",
    width: NODE_SIZE,
    height: NODE_SIZE,
    display: "block",
    filter: state === "locked" || state === "notPicked" ? "grayscale(1)" : "none",
    opacity: state === "locked" ? 0.35 : state === "notPicked" ? 0.3 : 1,
  };

  const outline: React.CSSProperties =
    state === "picked"
      ? { outline: "2px solid #c8a020", outlineOffset: "2px", borderRadius: "4px" }
      : {};

  return (
    <div
      className={`flex flex-col items-center ${isClickable ? "cursor-pointer" : ""} ${state === "available" ? "animate-pulse" : ""}`}
      style={{ width: NODE_SIZE, ...outline }}
      title={name}
      onClick={isClickable ? onClick : undefined}
    >
      <CdnIcon type="abilities" id={abilityId} className="block" style={iconStyle} />
      <span style={{ color: "#9a7850", fontSize: 10, lineHeight: `${LABEL_H}px`, whiteSpace: "nowrap" }}>
        {levelLabel}
      </span>
    </div>
  );
};

// ─── Guards ───────────────────────────────────────────────────────────────────

const TreeMessage: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <section>
    <h2 style={{ color: "#c8a020", fontSize: 14, fontWeight: "bold", textAlign: "center", marginBottom: 8 }}>
      {title}
    </h2>
    <p style={{ color: "#9a7850", textAlign: "center", fontSize: 12 }}>{message}</p>
  </section>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const ClassTree: React.FC = () => {
  const socket = useSocketStore((s) => s.socket);
  const { chooseClassTreeAbility } = usePersonalChannelActions(socket);

  const level       = usePersonalChannelStore((s) => s.displayedState?.stats.level ?? 0);
  const classId     = usePersonalChannelStore((s) => s.displayedState?.profile?.classId as string | undefined);
  const treeChoices = usePersonalChannelStore((s) => s.displayedState?.classTreeChoices) ?? {};
  const pending     = usePersonalChannelStore((s) => s.displayedState?.pendingClassTreeChoice) ?? null;

  const [classTrees, setClassTrees] = useState<Record<string, ClassTreeDefinition> | null>(null);

  useEffect(() => {
    let cancelled = false;
    metadataService.fetchMetadata().then(() => {
      if (!cancelled) setClassTrees(metadataService.getAllClassTreesSync() ?? null);
    });
    return () => { cancelled = true; };
  }, []);

  if (!classId || classId === "traveler") {
    return <TreeMessage title="Class Tree" message="You haven't chosen a class yet." />;
  }
  if (!classTrees) {
    return <TreeMessage title="Class Tree" message="Loading..." />;
  }
  const tree = classTrees[classId];
  if (!tree) {
    return <TreeMessage title="Class Tree" message="No class tree found." />;
  }

  const nodes = tree.nodes;
  const containerH = FIRST_ROW_Y + nodes.length * ROW_STRIDE + 10;
  const title = classId.charAt(0).toUpperCase() + classId.slice(1);

  // Column centers for the first tier (used for top fork)
  const firstCenters = getColumnCenters(nodes[0]?.choices.length ?? 2);

  return (
    <section>
      <h2 style={{ color: "#c8a020", fontSize: 14, fontWeight: "bold", textAlign: "center", marginBottom: 4 }}>
        {title} Tree
      </h2>

      <div className="relative mx-auto" style={{ width: CONTAINER_W, height: containerH }}>
        {/* SVG lines — behind nodes */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={CONTAINER_W}
          height={containerH}
          style={{ zIndex: 0 }}
        >
          {/* Top stem + fork to first tier:
              - picked: stem → single picked column
              - not yet picked: stem → all columns (shows the available choices) */}
          <line x1={CONTAINER_W / 2} y1={0} x2={CONTAINER_W / 2} y2={FORK_Y} stroke="#9a7228" strokeWidth={2} />
          {(() => {
            const tier0PickedIdx = nodes[0] ? pickedIndex(nodes[0], treeChoices) : null;
            const forkTargets = tier0PickedIdx != null
              ? [firstCenters[tier0PickedIdx]]
              : firstCenters;
            return forkTargets.map((cx) => (
              <line key={cx} x1={CONTAINER_W / 2} y1={FORK_Y} x2={cx} y2={FIRST_ROW_Y} stroke="#9a7228" strokeWidth={2} />
            ));
          })()}

          {/* Between tiers — only draw if tier i is already picked:
              - next tier also picked → single line (the chosen path)
              - next tier is pending  → fan from picked column to all next columns (next possible choice)
              - next tier is locked   → nothing */}
          {nodes.slice(0, -1).map((node, i) => {
            const yBottom  = FIRST_ROW_Y + i * ROW_STRIDE + NODE_SIZE;
            const yTop     = FIRST_ROW_Y + (i + 1) * ROW_STRIDE;
            const centersI = getColumnCenters(node.choices.length);
            const centersJ = getColumnCenters(nodes[i + 1].choices.length);
            const fromIdx  = pickedIndex(node, treeChoices);

            // If this tier has no pick yet, draw nothing leaving it
            if (fromIdx == null) return null;

            const fromCX  = centersI[fromIdx];
            const toIdx = pickedIndex(nodes[i + 1], treeChoices);

            // Always show lines forward from a picked node:
            // - next tier picked → single line to the chosen one
            // - next tier not yet picked → fan to all (pending or locked)
            const targets = toIdx != null ? [centersJ[toIdx]] : centersJ;

            return (
              <g key={i}>
                {targets.map((toCX) => (
                  <line key={toCX} x1={fromCX} y1={yBottom} x2={toCX} y2={yTop} stroke="#9a7228" strokeWidth={2} />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Ability nodes — on top of SVG */}
        {nodes.map((node, i) => {
          const y       = FIRST_ROW_Y + i * ROW_STRIDE;
          const centers = getColumnCenters(node.choices.length);

          return (
            <div key={node.level}>
              {node.choices.map((abilityId, ci) => {
                const cx    = centers[ci];
                const state = getNodeState(node.level, abilityId, level, treeChoices, pending);
                const name  = metadataService.getAbilitySync(abilityId)?.name ?? abilityId;
                const choiceIndex = (ci + 1) as 1 | 2 | 3;

                return (
                  <div
                    key={ci}
                    className="absolute"
                    style={{ left: cx - NODE_SIZE / 2, top: y, zIndex: 1 }}
                  >
                    <AbilityNode
                      abilityId={abilityId}
                      name={name}
                      state={state}
                      levelLabel={`Lv.${node.level}`}
                      onClick={() => chooseClassTreeAbility(choiceIndex)}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
};
