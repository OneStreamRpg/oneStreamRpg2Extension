import { useEffect, useRef, useState } from "react";
import { usePersonalChannelActions } from "../hooks/usePersonalChannelActions";
import { AbilitySlotType, metadataService } from "../services/MetadataService";
import { useAimStore } from "../store/useAimStore";
import { useSocketStore } from "../store/socketStore";
import { CdnIcon } from "./ui/CdnIcon";

export type Ability = {
  slot: AbilitySlotType;
  abilityId: string;
  lastUsed?: number;
  cooldownMs?: number;
  effectiveCooldownMs?: number;
  charges?: number;
  maxCharges?: number;
  lastChargeRegenAt?: number;
};

const TICKS_PER_SECOND = 16;
const MS_PER_TICK = 1000 / TICKS_PER_SECOND;
const ticksToMs = (ticks: number) => ticks * MS_PER_TICK;
const DRAG_THRESHOLD = 8;

export const Ability: React.FC<{ ability: Ability }> = ({ ability }) => {
  const socket = useSocketStore((state) => state.socket);
  const { castAbility } = usePersonalChannelActions(socket);
  const abilityMetaData = metadataService.getAbilitySync(ability.abilityId)!;
  const metadataCooldownMs =
    abilityMetaData.cooldownMs + ticksToMs(abilityMetaData.castTime);

  const isChargeSystem = ability.maxCharges !== undefined;

  // --- Standard cooldown state ---
  const cooldownEndRef = useRef<number>(0);
  const [displayCooldownMs, setDisplayCooldownMs] = useState(0);

  // --- Charge system state ---
  const [localCharges, setLocalCharges] = useState(ability.charges ?? 0);
  const [regenProgress, setRegenProgress] = useState(0);

  const isAimable =
    abilityMetaData.type === "skillshot" || abilityMetaData.type === "aoeCircle" || abilityMetaData.type === "slash";

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const aimActivatedRef = useRef(false);
  const [suppressTooltip, setSuppressTooltip] = useState(false);
  const { startAim, stopAim, isAiming } = useAimStore();

  // Sync cooldown from server data whenever lastUsed/effectiveCooldownMs props update
  useEffect(() => {
    if (!isChargeSystem && ability.lastUsed !== undefined && ability.effectiveCooldownMs !== undefined) {
      const serverEnd = ability.lastUsed + ability.effectiveCooldownMs;
      const remaining = Math.max(0, serverEnd - Date.now());
      cooldownEndRef.current = remaining > 0 ? serverEnd : 0;
      setDisplayCooldownMs(remaining);
    }
  }, [isChargeSystem, ability.lastUsed, ability.effectiveCooldownMs]);

  // Sync charge count from server
  useEffect(() => {
    if (isChargeSystem && ability.charges !== undefined) {
      setLocalCharges(ability.charges);
    }
  }, [isChargeSystem, ability.charges]);

  const isOnCooldown = displayCooldownMs > 0;
  const canCast = isChargeSystem ? localCharges > 0 : !isOnCooldown;

  // Smooth 100ms countdown for standard cooldown
  useEffect(() => {
    if (!isOnCooldown) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, cooldownEndRef.current - Date.now());
      setDisplayCooldownMs(remaining);
      if (remaining <= 0) {
        cooldownEndRef.current = 0;
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isOnCooldown]);

  // Animate regen progress bar between server pushes
  useEffect(() => {
    if (!isChargeSystem || localCharges >= (ability.maxCharges ?? 0)) {
      setRegenProgress(0);
      return;
    }
    const cdMs = ability.cooldownMs ?? ability.effectiveCooldownMs ?? metadataCooldownMs;
    const regenStart = ability.lastChargeRegenAt ?? Date.now();
    const interval = setInterval(() => {
      setRegenProgress(Math.min((Date.now() - regenStart) / cdMs, 1.0));
    }, 100);
    return () => clearInterval(interval);
  }, [isChargeSystem, localCharges, ability.maxCharges, ability.lastChargeRegenAt, ability.cooldownMs, ability.effectiveCooldownMs, metadataCooldownMs]);

  const triggerCooldownOptimistic = () => {
    if (isChargeSystem) {
      setLocalCharges((prev) => Math.max(0, prev - 1));
    } else {
      const optimisticMs = ability.effectiveCooldownMs ?? metadataCooldownMs;
      cooldownEndRef.current = Date.now() + optimisticMs;
      setDisplayCooldownMs(optimisticMs);
    }
  };

  const handleAbilityClick = () => {
    if (isAimable) return; // aimable abilities are handled by mousedown
    castAbility(ability.slot);
    triggerCooldownOptimistic();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isAimable || !canCast) return;
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    aimActivatedRef.current = false;

    const onMouseMove = (ev: MouseEvent) => {
      if (aimActivatedRef.current || !dragStartRef.current) return;
      const dx = ev.clientX - dragStartRef.current!.x;
      const dy = ev.clientY - dragStartRef.current!.y;
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        aimActivatedRef.current = true;
        setSuppressTooltip(true);
        startAim(
          ability.slot,
          abilityMetaData.type as "skillshot" | "aoeCircle" | "slash",
          abilityMetaData.range ?? null,
          abilityMetaData.effectSize ?? null
        );
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      const cancelledByReturn =
        aimActivatedRef.current &&
        buttonRef.current &&
        (() => {
          const r = buttonRef.current!.getBoundingClientRect();
          return e.clientX >= r.left && e.clientX <= r.right &&
                 e.clientY >= r.top  && e.clientY <= r.bottom;
        })();

      if (cancelledByReturn) {
        stopAim();
      } else if (!aimActivatedRef.current) {
        // Regular click — aim never activated
        castAbility(ability.slot);
        triggerCooldownOptimistic();
      } else {
        // Drag cast — WorldInteractionLayer handles the actual cast
        triggerCooldownOptimistic();
      }

      dragStartRef.current = null;
      aimActivatedRef.current = false;
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const totalCooldownMs = ability.effectiveCooldownMs ?? metadataCooldownMs;
  const cooldownPercentage =
    totalCooldownMs > 0 ? (displayCooldownMs / totalCooldownMs) * 100 : 0;

  return (
    <button
      ref={buttonRef}
      key={ability.slot}
      onClick={() => handleAbilityClick()}
      onMouseDown={isAimable ? handleMouseDown : undefined}
      disabled={!canCast}
      data-tooltip-id={isAiming || suppressTooltip ? undefined : "ability-tooltip"}
      data-ability-id={ability.abilityId}
      data-tooltip-place="top"
      onMouseEnter={() => setSuppressTooltip(false)}
      className={`relative size-12 overflow-hidden ${!canCast ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:brightness-125"}`}
      style={{
        backgroundColor: "#231206",
        borderTop: "3px solid #9a7228",
        borderBottom: "3px solid #3d1a06",
        borderLeft: "3px solid #3d1a06",
        borderRight: "3px solid #3d1a06",
        boxShadow: [
          "inset 0 2px 0 rgba(255,220,120,0.12)",
          "inset 6px 0 0 #2d1a0a",
          "inset -6px 0 0 #2d1a0a",
          "inset 0 4px 0 rgba(255,220,120,0.08)",
          "inset 0 6px 0 #2d1a0a",
          "inset 0 -2px 0 #2d1a0a",
          "inset 0 -4px 0 rgba(0,0,0,0.3)",
          "inset 0 -6px 0 #2d1a0a",
          "inset 0px 0px 20px -5px #0a0502",
          "0px 0px 8px 0px rgba(0,0,0,0.8)",
        ].join(", "),
      }}
    >
      <CdnIcon
        type="abilities"
        id={ability.abilityId}
        className="size-full"
        alt={abilityMetaData.name}
      />

      {/* Standard cooldown overlay */}
      {!isChargeSystem && isOnCooldown && (
        <>
          <div
            className="absolute bottom-0 left-0 right-0 bg-black/70"
            style={{ height: `${cooldownPercentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {Math.ceil(displayCooldownMs / 1000)}s
            </span>
          </div>
        </>
      )}

      {/* Charge system: regen progress bar */}
      {isChargeSystem && localCharges < (ability.maxCharges ?? 0) && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-amber-400/50"
          style={{ height: `${regenProgress * 100}%` }}
        />
      )}

      {/* Charge system: pip indicators */}
      {isChargeSystem && (
        <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
          {Array.from({ length: ability.maxCharges! }).map((_, i) => (
            <div
              key={i}
              className={`size-1.5 rounded-full shadow-sm ${i < localCharges ? "bg-amber-300" : "bg-gray-700"}`}
            />
          ))}
        </div>
      )}
    </button>
  );
};
