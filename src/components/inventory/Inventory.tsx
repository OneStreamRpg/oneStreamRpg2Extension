// src/components/inventory/Inventory.tsx
import React, { useState } from 'react'
import { DndContext } from '@dnd-kit/core'
import InventorySlot from '../ui/InventorySlot'
import DraggableItem from '../ui/DraggableItem'

const Inventory = () => {
  const [itemIndex, setItemIndex] = useState(13)

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (over) {
      const index = parseInt(over.id)
      setItemIndex(index)
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 24px)',
          gap: 4,
          padding: 10,
        }}
      >
        {[...Array(36)].map((_, i) => (
          <InventorySlot key={i} id={String(i)}>
            {i === itemIndex && <DraggableItem id="sword" />}
          </InventorySlot>
        ))}
      </div>
    </DndContext>
  )
}

export default Inventory
