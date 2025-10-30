import { DndContext, DragCancelEvent, DragEndEvent, DragStartEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from '@dnd-kit/utilities';
import { useState } from "react";

export const Inventory: React.FC = () => {

  const [targetId, setTargetId] = useState<string>("")
  const [activeHelmet, setActiveHelmet] = useState<string>("")
  const [activeChest, setActiveChest] = useState<string>("")

  return <DndContext onDragStart={(event: DragStartEvent) => {
    const targetId = event.active.data.current?.targetId;
    if (targetId) {
      setTargetId(targetId)
    }
  }} onDragEnd={(event: DragEndEvent) => {
    setTargetId("")
    if (event.over && event.over.id) {
      if (event.over.id === "helmet" && event.active.data.current?.targetId === "helmet") {
        setActiveHelmet(event.active.id as string)
      } else if (event.over.id === "chest" && event.active.data.current?.targetId === "chest") {
        setActiveChest(event.active.id as string)
      }
    }
  }}
    onDragCancel={(event: DragCancelEvent) => {
      setTargetId("")
    }}
  >
    <section className="grid gap-2 grid-cols-2 mb-4">
      <Slot id="helmet" canDrop={targetId === "helmet"} >{activeHelmet}</Slot>
      <Slot id="chest" canDrop={targetId === "chest"} >{activeChest}</Slot>
    </section>
    <section className="grid gap-2 grid-cols-2">
      <Item id="RedHelmet" targetId="helmet" />
      <Item id="NiceHelmet" targetId="helmet" />
      <Item id="BlueHelmet" targetId="helmet" />
      <Item id="SupremeJacket" targetId="chest" />
      <Item id="T-Shirt" targetId="chest" />

    </section>
  </DndContext>
}

const Slot: React.FC<{ id: string, canDrop: boolean, children: React.ReactNode }> = ({ id, canDrop, children }) => {
  const { isOver, setNodeRef, active } = useDroppable({
    id
  });

  const isPossibleToDrop = isOver && active?.data.current?.targetId === id;

  return (
    <div ref={setNodeRef} className={`${isPossibleToDrop ? "bg-green-500" : ""} ${canDrop ? "outline-10 outline-green-500" : ""} size-32 bg-blue-500/50`}>
      {id}: {children}
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
