// src/components/ui/InventorySlot.tsx
import { useDroppable } from "@dnd-kit/core";
import React from "react";
import styles from "./InventorySlot.module.css";

type Props = {
  id: string;
  children?: React.ReactNode;
};

const InventorySlot = ({ id, children }: Props) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={styles.slot}
      style={{
        backgroundColor: isOver ? "#f00" : undefined,
      }}
    >
      {children}
    </div>
  );
};

export default InventorySlot;
