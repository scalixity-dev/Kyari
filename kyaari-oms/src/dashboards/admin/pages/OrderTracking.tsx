import React from 'react'
import Board from '@lourenci/react-kanban'
import '@lourenci/react-kanban/dist/styles.css'

const initialBoard = {
  columns: [
    { id: 1, title: 'Received', cards: [ { id: 'INV-2001', orderId: 'INV-2001', vendor: 'GreenLeaf Farms', qty: 12 }, { id: 'INV-2002', orderId: 'INV-2002', vendor: 'HappyPlant Co', qty: 8 } ] },
    { id: 2, title: 'Assigned', cards: [ { id: 'INV-2003', orderId: 'INV-2003', vendor: 'BloomWorks', qty: 20 } ] },
    { id: 3, title: 'Confirmed', cards: [] },
    { id: 4, title: 'Invoiced', cards: [ { id: 'INV-2004', orderId: 'INV-2004', vendor: 'SharkTank Ltd', qty: 5 } ] },
    { id: 5, title: 'Dispatched', cards: [] },
    { id: 6, title: 'Verified', cards: [] },
    { id: 7, title: 'Paid', cards: [] }
  ]
}

export default function OrderTracking() {
  const [board, setBoard] = React.useState<any>(initialBoard)

  const handleCardDragEnd = (newBoard: any) => {
    setBoard(newBoard)
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
        
        <Board
          allowRemoveCard
          onCardDragEnd={handleCardDragEnd}
          initialBoard={board}
        >
          {board.columns.map((col: any) => (
            <div key={col.id} className="kanban-column">
              <div className="kanban-column-header">{col.title}</div>
              <div className="kanban-column-body">
                {col.cards.map((card: any) => (
                  <div key={card.id} className="kanban-card">
                    <div className="order-id">{card.orderId}</div>
                    <div className="vendor-name" title={card.vendor}>{card.vendor}</div>
                    <div className="quantity">Qty: {card.qty}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Board>
      </div>
    </div>
  )
}