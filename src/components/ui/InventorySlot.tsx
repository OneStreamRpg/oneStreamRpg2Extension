import { useDroppable } from "@dnd-kit/core";
import React from "react";

type Props = {
  id: string;
  children?: React.ReactNode;
};

const InventorySlot = ({ id, children }: Props) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        backgroundColor: isOver ? "#f00" : undefined,
      }}
    >
      {children}
    </div>
  );
};

export default InventorySlot;
