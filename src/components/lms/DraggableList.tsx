'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface DraggableItem {
  id: string;
  [key: string]: any;
}

export interface DraggableListProps<T extends DraggableItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T) => string;
  className?: string;
  itemClassName?: string;
  showDragHandle?: boolean;
  disabled?: boolean;
}

// ============================================================================
// SORTABLE ITEM COMPONENT
// ============================================================================

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  showDragHandle?: boolean;
  disabled?: boolean;
}

function SortableItem({
  id,
  children,
  className,
  showDragHandle = true,
  disabled = false,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative flex items-center gap-2',
        isDragging && 'opacity-50',
        className
      )}
    >
      {showDragHandle && !disabled && (
        <button
          type="button"
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded cursor-grab active:cursor-grabbing',
            'hover:bg-accent transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring'
          )}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ============================================================================
// DRAGGABLE LIST COMPONENT
// ============================================================================

export function DraggableList<T extends DraggableItem>({
  items,
  onReorder,
  renderItem,
  keyExtractor = (item) => item.id,
  className,
  itemClassName,
  showDragHandle = true,
  disabled = false,
}: DraggableListProps<T>) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => keyExtractor(item) === active.id);
      const newIndex = items.findIndex((item) => keyExtractor(item) === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeItem = React.useMemo(
    () => items.find((item) => keyExtractor(item) === activeId),
    [activeId, items, keyExtractor]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={items.map(keyExtractor)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn('space-y-2', className)}>
          {items.map((item, index) => (
            <SortableItem
              key={keyExtractor(item)}
              id={keyExtractor(item)}
              className={itemClassName}
              showDragHandle={showDragHandle}
              disabled={disabled}
            >
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem && (
          <div className="bg-background border rounded-lg shadow-lg p-4">
            {renderItem(activeItem, items.indexOf(activeItem))}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default DraggableList;
