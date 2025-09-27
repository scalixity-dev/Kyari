import { useState } from 'react'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Extended type definitions for our specific use case
interface OrderCard {
  id: string
  orderId: string
  vendor: string
  qty: number
}

interface OrderColumn {
  id: string
  title: string
  cards: OrderCard[]
}

interface OrderBoard {
  columns: OrderColumn[]
}

const initialBoard: OrderBoard = {
  columns: [
    { 
      id: 'received', 
      title: 'Received', 
      cards: [ 
        { id: 'card-1', orderId: 'INV-2001', vendor: 'GreenLeaf Farms', qty: 12 }, 
        { id: 'card-2', orderId: 'INV-2002', vendor: 'HappyPlant Co', qty: 8 } 
      ] 
    },
    { 
      id: 'assigned', 
      title: 'Assigned', 
      cards: [ 
        { id: 'card-3', orderId: 'INV-2003', vendor: 'BloomWorks', qty: 20 } 
      ] 
    },
    { 
      id: 'confirmed', 
      title: 'Confirmed', 
      cards: [] 
    },
    { 
      id: 'invoiced', 
      title: 'Invoiced', 
      cards: [ 
        { id: 'card-4', orderId: 'INV-2004', vendor: 'SharkTank Ltd', qty: 5 } 
      ] 
    },
    { 
      id: 'dispatched', 
      title: 'Dispatched', 
      cards: [] 
    },
    { 
      id: 'verified', 
      title: 'Verified', 
      cards: [] 
    },
    { 
      id: 'paid', 
      title: 'Paid', 
      cards: [] 
    }
  ]
}

// Sortable Card Component
function SortableCard({ card }: { card: OrderCard }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="kanban-card"
    >
      <div className="order-id">{card.orderId}</div>
      <div className="vendor-name" title={card.vendor}>{card.vendor}</div>
      <div className="quantity">Qty: {card.qty}</div>
    </div>
  )
}

// Column Component
function Column({ column }: { column: OrderColumn }) {
  const cardIds = column.cards.map(card => card.id)

  return (
    <div className="kanban-column">
      <div className="kanban-column-header">{column.title}</div>
      <div className="kanban-column-body">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <SortableCard key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export default function OrderTracking() {
  const [board, setBoard] = useState<OrderBoard>(initialBoard)
  const [activeCard, setActiveCard] = useState<OrderCard | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const card = findCardById(active.id as string)
    setActiveCard(card || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeCard = findCardById(active.id as string)
    const overId = over.id as string

    // If dropping on another card, find the column of that card
    const overCard = findCardById(overId)
    const targetColumnId = overCard ? findColumnByCardId(overId)?.id : overId

    if (!activeCard || !targetColumnId) return

    // Don't do anything if dropping on the same card
    if (activeCard.id === overId) return

    setBoard((prevBoard) => {
      const newBoard = { ...prevBoard }
      const sourceColumn = findColumnByCardId(activeCard.id)
      
      if (!sourceColumn) return prevBoard

      const targetColumn = newBoard.columns.find(col => col.id === targetColumnId)
      if (!targetColumn) return prevBoard

      // Remove card from source column
      sourceColumn.cards = sourceColumn.cards.filter(card => card.id !== activeCard.id)
      
      // Add card to target column
      if (overCard) {
        // Insert after the card we're hovering over
        const overIndex = targetColumn.cards.findIndex(card => card.id === overCard.id)
        targetColumn.cards.splice(overIndex + 1, 0, activeCard)
      } else {
        // Add to the end of the column
        targetColumn.cards.push(activeCard)
      }

      return newBoard
    })
  }

  const findCardById = (cardId: string): OrderCard | undefined => {
    for (const column of board.columns) {
      const card = column.cards.find(card => card.id === cardId)
      if (card) return card
    }
    return undefined
  }

  const findColumnByCardId = (cardId: string): OrderColumn | undefined => {
    return board.columns.find(column => 
      column.cards.some(card => card.id === cardId)
    )
  }

  return (
    <div className="p-4 h-screen overflow-hidden">
      <h1 className="text-2xl font-semibold mb-4">Order Tracking</h1>
      
      <div className="h-[calc(100vh-120px)] overflow-auto">
        <style dangerouslySetInnerHTML={{__html: `
          .kanban-board {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 16px;
            padding: 16px;
            min-height: 100%;
          }
          
          .kanban-column {
            background: #f8fafc;
            border-radius: 12px;
            padding: 16px;
            min-height: 400px;
            max-height: 600px;
            display: flex;
            flex-direction: column;
          }
          
          .kanban-column-header {
            font-weight: 600;
            font-size: 14px;
            color: #374151;
            margin-bottom: 12px;
            padding: 8px 12px;
            background: white;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .kanban-column-body {
            flex: 1;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
          }
          
          .kanban-column-body::-webkit-scrollbar {
            width: 4px;
          }
          
          .kanban-column-body::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .kanban-column-body::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 2px;
          }
          
          .kanban-card {
            background: white;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border: 1px solid #e5e7eb;
            cursor: grab;
            transition: all 0.2s ease;
          }
          
          .kanban-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateY(-1px);
          }
          
          .kanban-card:active {
            cursor: grabbing;
          }
          
          .order-id {
            font-weight: 600;
            color: #1f2937;
            font-size: 14px;
            margin-bottom: 4px;
          }
          
          .vendor-name {
            color: #6b7280;
            font-size: 12px;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .quantity {
            color: #9ca3af;
            font-size: 11px;
            font-weight: 500;
          }
          
          @media (max-width: 1024px) {
            .kanban-board {
              grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            }
            .kanban-column {
              min-height: 300px;
              max-height: 400px;
            }
          }
          
          @media (max-width: 768px) {
            .kanban-board {
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 12px;
              padding: 12px;
            }
            .kanban-column {
              min-height: 250px;
              max-height: 350px;
              padding: 12px;
            }
          }
        `}} />
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board">
            <SortableContext items={board.columns.map(col => col.id)}>
              {board.columns.map((column) => (
                <Column key={column.id} column={column} />
              ))}
            </SortableContext>
          </div>
          
          <DragOverlay>
            {activeCard ? (
              <div className="kanban-card">
                <div className="order-id">{activeCard.orderId}</div>
                <div className="vendor-name" title={activeCard.vendor}>{activeCard.vendor}</div>
                <div className="quantity">Qty: {activeCard.qty}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}