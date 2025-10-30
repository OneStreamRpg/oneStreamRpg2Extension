import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from '@dnd-kit/utilities';

export const Inventory: React.FC = () => {

  return <DndContext>
    <Slot />
    <div className="grid gap-2 mt-5">
      <Item id="RedHelmet" />
      <Item id="BlueHelmet" />
    </div>

  </DndContext>
}

const Slot = () => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'droppable',
  });

  return (
    <div ref={setNodeRef} className={`${isOver && "bg-green-500/50"} size-32 bg-blue-500/50`}>
      Slot
    </div>
  );
}


const Item: React.FC<{ id: string }> = ({ id }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
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
