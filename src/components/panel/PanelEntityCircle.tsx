import { useState } from "react";
import { metadataService } from "../../services/MetadataService";
import type { GameObject } from "../../types/gameState";

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect width='32' height='32' fill='%23555'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' dominant-baseline='middle' fill='%23ccc' font-size='16'%3E%3F%3C/text%3E%3C/svg%3E";

const BORDER_COLORS: Record<string, string> = {
  npc: "#c8a020",
  enemy: "#e05050",
  jobSpace: "#78dc78",
};

function getEntityImageUrl(obj: GameObject): string {
  if (obj.type === "npc") {
    return `https://cdn.onestreamrpg.com/images/npc/${obj.npcId}.png`;
  }
  if (obj.type === "enemy") {
    return `https://cdn.onestreamrpg.com/images/enemies/${obj.enemyId}.png`;
  }
  if (obj.type === "jobSpace") {
    return `${import.meta.env.BASE_URL}media/img/icons/${obj.jobSpaceType.toLowerCase()}.png`;
  }
  return PLACEHOLDER_IMG;
}

function getEntityDisplayName(obj: GameObject): string | null {
  if (obj.type === "npc") {
    return metadataService.getNpcSync(obj.npcId)?.name ?? obj.npcId;
  }
  if (obj.type === "enemy") {
    return metadataService.getEnemySync(obj.enemyId)?.name ?? obj.enemyId;
  }
  if (obj.type === "jobSpace") {
    return obj.jobSpaceType;
  }
  return null;
}

interface PanelEntityCircleProps {
  obj: GameObject;
  hasQuest: boolean;
  onClickEnemy: (id: string) => void;
  onClickNpc: (npcId: string) => void;
  onClickJobSpace: (id: string) => void;
}

export const PanelEntityCircle: React.FC<PanelEntityCircleProps> = ({
  obj,
  hasQuest,
  onClickEnemy,
  onClickNpc,
  onClickJobSpace,
}) => {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);

  const centerX = (obj.hitbox.x / 1920) * 100;
  const centerY = (obj.hitbox.y / 1080) * 100;
  const borderColor = BORDER_COLORS[obj.type] ?? "#888";
  const displayName = getEntityDisplayName(obj);

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: `${centerX}%`,
        top: `${centerY}%`,
        transform: "translate(-50%, -50%)",
        width: "clamp(24px, 4vw, 40px)",
        height: "clamp(24px, 4vw, 40px)",
        zIndex: 1,
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (obj.type === "enemy") onClickEnemy(obj.id);
        else if (obj.type === "npc") onClickNpc(obj.npcId);
        else if (obj.type === "jobSpace") onClickJobSpace(obj.id);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Quest indicator */}
      {hasQuest && (
        <img
          src={`${import.meta.env.BASE_URL}media/img/icons/questionmark.png`}
          className="absolute pointer-events-none"
          style={{
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%) translateY(2px)",
            width: "12px",
            height: "auto",
          }}
          alt=""
        />
      )}

      {/* Circle with image */}
      <div
        className="w-full h-full rounded-full overflow-hidden"
        style={{
          border: `2px solid ${borderColor}`,
          boxShadow: "0 0 3px rgba(0,0,0,0.8)",
        }}
      >
        {imgError ? (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs">
            ?
          </div>
        ) : (
          <img
            src={getEntityImageUrl(obj)}
            alt={displayName ?? obj.id}
            className="w-full h-full object-cover"
            style={{ imageRendering: "pixelated" }}
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Tooltip on hover */}
      {hovered && displayName && (
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: "4px",
            whiteSpace: "nowrap",
            background: "rgba(0,0,0,0.85)",
            color: obj.type === "npc" ? "#c8a020" : obj.type === "jobSpace" ? "#78dc78" : "#e05050",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "10px",
            zIndex: 1000,
          }}
        >
          {displayName}
        </div>
      )}
    </div>
  );
};
