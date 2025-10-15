import { useDroppable } from "@dnd-kit/core";
import React from "react";

type Props = {
  id: string;
  children?: React.ReactNode;
  onClick?: () => void;
};

const InventorySlot = ({ id, children, onClick }: Props) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      style={{
        backgroundColor: isOver ? "#f00" : undefined,
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      {children}
    </div>
  );
};

export default InventorySlot;
