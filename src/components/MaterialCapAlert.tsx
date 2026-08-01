import { useEffect } from "react";
import { MaterialIcon } from "./inventory/MaterialIcon";
import { MaterialAlert, useMaterialAlertStore } from "../store/useMaterialAlertStore";

const ALERT_DURATION_MS = 6000;

const MATERIAL_LABELS: Record<MaterialAlert["category"], string> = {
  wood: "Wood",
  stone: "Stone",
  fish: "Fish",
};

const AlertRow: React.FC<{ alert: MaterialAlert }> = ({ alert }) => {
  const dismiss = useMaterialAlertStore((state) => state.dismiss);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(alert.id), ALERT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [alert.id, dismiss]);

  return (
    <button
      onClick={() => dismiss(alert.id)}
      title="Dismiss"
      className="pointer-events-auto cursor-pointer flex items-center gap-2 px-3 py-1.5"
      style={{
        color: "#f0d8a8",
        backgroundColor: "rgba(0,0,0,0.88)",
        border: "3px solid #c05050",
        boxShadow: "0 0 12px rgba(192,80,80,0.45), 0 2px 8px rgba(0,0,0,0.8)",
        animation: "materialCapEnter 300ms ease-out both",
      }}
    >
      <MaterialIcon category={alert.category} size={20} />
      <span className="text-xs font-bold" style={{ color: "#e88080" }}>
        {MATERIAL_LABELS[alert.category]} storage full
      </span>
      {/* Deliberately not "keep gathering": the server raises this from
          receiveItem, so mob loot and NPC rewards hit it too. */}
      <span className="text-xs" style={{ color: "#a89070" }}>
        — sell or craft to free up space
      </span>
    </button>
  );
};

/**
 * On-screen notice when a material hits its cap.
 *
 * The inventory already flags it, but gathering happens with the inventory
 * closed, so people were filling up without noticing and carrying on.
 */
export const MaterialCapAlert: React.FC = () => {
  const alerts = useMaterialAlertStore((state) => state.alerts);

  if (alerts.length === 0) return null;

  return (
    <div className="absolute inset-x-0 top-0 flex flex-col items-center gap-1 pointer-events-none">
      {alerts.map((alert) => (
        <AlertRow key={alert.id} alert={alert} />
      ))}
    </div>
  );
};
