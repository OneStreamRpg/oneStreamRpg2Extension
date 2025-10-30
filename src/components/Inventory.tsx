import { DndContext, DragCancelEvent, DragEndEvent, DragStartEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from '@dnd-kit/utilities';
import { useState } from "react";

export const Inventory: React.FC = () => {

  const [targetId, setTargetId] = useState<string>("")

  return <DndContext onDragStart={(event: DragStartEvent) => {
    const targetId = event.active.data.current?.targetId;
    if (targetId) {
      setTargetId(targetId)
    }
  }} onDragEnd={(event: DragEndEvent) => {
    setTargetId("")
  }}
    onDragCancel={(event: DragCancelEvent) => {
      setTargetId("")
    }}
  >
    <section>
      <Slot id="helmet" canDrop={targetId === "helmet"} />
      <Slot id="chest" canDrop={targetId === "chest"} />

    </section>
    <section className="grid gap-2 mt-5 grid-cols-2">
      <Item id="RedHelmet" targetId="helmet" />
      <Item id="NiceHelmet" targetId="helmet" />
      <Item id="BlueHelmet" targetId="helmet" />
      <Item id="SupremeJacket" targetId="chest" />
      <Item id="T-Shirt" targetId="chest" />

    </section>
  </DndContext>
}

const Slot: React.FC<{ id: string, canDrop: boolean }> = ({ id, canDrop }) => {
  const { isOver, setNodeRef } = useDroppable({
    id
  });

  return (
    <div ref={setNodeRef} className={`${isOver ? "bg-green-500" : ""} ${canDrop ? "outline-10 outline-green-500" : ""} size-32 bg-blue-500/50`}>
      Slot {id}
    </div>
  );
}


const Item: React.FC<{ id: string; targetId: string }> = ({ id, targetId }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data: {
      targetId
    }
  });
  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;


  return (
    <button ref={setNodeRef} style={style} className="size-22 bg-red-900/50" {...listeners} {...attributes}>
      {id}
    </button>
  );
}
