import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { LayoutDashboard, Package, Bell, Users, CheckSquare, FileText, Wallet, MapPin, Eye } from 'lucide-react';
import { KPICard, Pagination } from '../../../components';

// TypeScript types
type Status = "Received" | "Assigned" | "Confirmed" | "Invoiced" | "Dispatched" | "Verified" | "Paid";
type Order = { id: string; vendor: string; qty: number; status: Status };

type ViewMode = 'list' | 'board';

// Sample order data with mixed statuses
const initialOrders: Order[] = [
  { id: "ORD-001", vendor: "Green Valley Farms", qty: 250, status: "Received" },
  { id: "ORD-002", vendor: "Organic Harvest Co", qty: 180, status: "Assigned" },
  { id: "ORD-003", vendor: "Fresh Fields Ltd", qty: 320, status: "Confirmed" },
  { id: "ORD-004", vendor: "Nature's Best", qty: 95, status: "Invoiced" },
  { id: "ORD-005", vendor: "Farm Fresh Direct", qty: 210, status: "Dispatched" },
  { id: "ORD-006", vendor: "Golden Harvest", qty: 165, status: "Verified" },
  { id: "ORD-007", vendor: "Eco Greens", qty: 275, status: "Paid" },
  { id: "ORD-008", vendor: "Valley Organics", qty: 140, status: "Received" },
  { id: "ORD-009", vendor: "Sunrise Farms", qty: 190, status: "Assigned" },
  { id: "ORD-010", vendor: "Pure Harvest", qty: 300, status: "Confirmed" },
  { id: "ORD-011", vendor: "Green Earth Co", qty: 85, status: "Invoiced" },
  { id: "ORD-012", vendor: "Natural Foods Inc", qty: 225, status: "Dispatched" },
];

const statusColumns: Status[] = ["Received", "Assigned", "Confirmed", "Invoiced", "Dispatched", "Verified", "Paid"];

const getStatusIcon = (status: Status) => {
  const iconProps = { size: 16, className: "text-[var(--color-heading)]" };
  
  switch (status) {
    case "Received":
      return <Bell {...iconProps} />;
    case "Assigned":
      return <Users {...iconProps} />;
    case "Confirmed":
      return <CheckSquare {...iconProps} />;
    case "Invoiced":
      return <FileText {...iconProps} />;
    case "Dispatched":
      return <MapPin {...iconProps} />;
    case "Verified":
      return <Eye {...iconProps} />;
    case "Paid":
      return <Wallet {...iconProps} />;
    default:
      return <Package {...iconProps} />;
  }
};

const getStatusColor = (status: Status): string => {
  const statusColors: Record<Status, string> = {
    "Received": "bg-gray-100 text-gray-800 border-gray-200",
    "Assigned": "bg-blue-100 text-blue-800 border-blue-200",
    "Confirmed": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Invoiced": "bg-purple-100 text-purple-800 border-purple-200",
    "Dispatched": "bg-orange-100 text-orange-800 border-orange-200",
    "Verified": "bg-green-100 text-green-800 border-green-200",
    "Paid": "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return statusColors[status];
};

interface OrderCardProps {
  order: Order;
  index: number;
  isDragDisabled?: boolean;
  onOrderClick?: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, index, isDragDisabled = false, onOrderClick }) => (
  <Draggable draggableId={order.id} index={index} isDragDisabled={isDragDisabled}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        onClick={() => onOrderClick?.(order.id)}
        className={`
          bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mb-2 shadow-sm
          hover:shadow-md transition-shadow duration-200 active:shadow-lg
          ${snapshot.isDragging ? 'shadow-lg rotate-2' : ''}
          ${isDragDisabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing hover:cursor-pointer'}
          touch-manipulation
        `}
      >
        <div className="font-semibold text-[var(--color-heading)] text-sm sm:text-base mb-1">
          {order.id}
        </div>
        <div className="text-gray-600 text-sm mb-2 leading-relaxed">
          {order.vendor}
        </div>
        <div className="text-gray-500 text-xs sm:text-sm">
          Qty: {order.qty}
        </div>
      </div>
    )}
  </Draggable>
);

interface ListViewProps {
  orders: Order[];
  onOrderClick?: (orderId: string) => void;
}

const ListView: React.FC<ListViewProps> = ({ orders, onOrderClick }) => {
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  
  // Reset to first page when orders change
  React.useEffect(() => {
    setPage(1);
  }, [orders]);

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, orders.length);
  const pageOrders = orders.slice(startIndex, endIndex);

  return (
    <div className="bg-header-bg rounded-xl overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr style={{ background: 'var(--color-accent)' }}>
              <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                Order ID
              </th>
              <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                Vendor
              </th>
              <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                Quantity
              </th>
              <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {pageOrders.map((order) => (
              <tr
                key={order.id}
                onClick={() => onOrderClick?.(order.id)}
                className="border-b border-gray-100 hover:bg-gray-50 bg-white transition-colors cursor-pointer"
              >
                <td className="p-3 font-semibold text-secondary">
                  {order.id}
                </td>
                <td className="p-3 text-sm text-gray-700">
                  {order.vendor}
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {order.qty}
                </td>
                <td className="p-3">
                  <span className={`
                    inline-block px-2.5 py-1 rounded-full text-xs font-semibold border
                    ${getStatusColor(order.status)}
                  `}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Desktop Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={orders.length}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setPage}
          variant="desktop"
          itemLabel="orders"
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {pageOrders.map((order) => (
          <div
            key={order.id}
            onClick={() => onOrderClick?.(order.id)}
            className="rounded-xl p-4 border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="font-semibold text-secondary text-lg">
                {order.id}
              </div>
              <span className={`
                inline-block px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0
                ${getStatusColor(order.status)}
              `}>
                {order.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-3">
              {order.vendor}
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Quantity: </span>
                <span className="font-medium">{order.qty}</span>
              </div>
            </div>
          </div>
        ))}
        {/* Mobile Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={orders.length}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setPage}
          variant="mobile"
          itemLabel="orders"
        />
      </div>
    </div>
  );
};

interface BoardColumnProps {
  status: Status;
  orders: Order[];
  onOrderClick?: (orderId: string) => void;
}

const BoardColumn: React.FC<BoardColumnProps> = ({ status, orders, onOrderClick }) => (
  <div className="flex-shrink-0 w-64 sm:w-72 bg-[var(--color-happyplant-bg)] rounded-lg p-3 mr-3 sm:mr-4 last:mr-0">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-[var(--color-heading)] text-sm sm:text-base">
        {status}
      </h3>
      <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
        {orders.length}
      </span>
    </div>
    
    <Droppable droppableId={status}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            min-h-[200px] max-h-[60vh] overflow-y-auto space-y-2
            ${snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg' : ''}
            transition-colors duration-200
          `}
        >
          {orders.map((order, orderIndex) => (
            <OrderCard
              key={order.id}
              order={order}
              index={orderIndex}
              onOrderClick={onOrderClick}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </div>
);

interface BoardViewProps {
  orders: Order[];
  onOrderMove: (result: DropResult) => void;
  onOrderClick?: (orderId: string) => void;
}

const BoardView: React.FC<BoardViewProps> = ({ orders, onOrderMove, onOrderClick }) => {
  const ordersByStatus = statusColumns.reduce((acc, status) => {
    acc[status] = orders.filter(order => order.status === status);
    return acc;
  }, {} as Record<Status, Order[]>);

  return (
    <DragDropContext onDragEnd={onOrderMove}>
      <div className="overflow-x-auto pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="flex min-w-max">
          {statusColumns.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              orders={ordersByStatus[status]}
              onOrderClick={onOrderClick}
            />
          ))}
        </div>
      </div>
    </DragDropContext>
  );
};

const OrderTracking: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const navigate = useNavigate();

  const handleOrderClick = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleOrderMove = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If no destination, return early
    if (!destination) return;

    // If dropped in the same position, return early
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the order being moved
    const orderToMove = orders.find(order => order.id === draggableId);
    if (!orderToMove) return;

    // Update the order's status
    const newStatus = destination.droppableId as Status;
    const updatedOrders = orders.map(order =>
      order.id === draggableId
        ? { ...order, status: newStatus }
        : order
    );

    setOrders(updatedOrders);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-sharktank-bg)] min-h-screen font-sans w-full overflow-x-hidden">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-heading)] mb-6 font-[var(--font-heading)]">
          Order Tracking
        </h1>

        {/* View Toggle */}
        <div className="mb-4 sm:mb-6">
          <div className="relative w-full sm:w-auto">
            {/* Accent baseline under tabs */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--color-accent)] rounded-full opacity-80"></div>

            <div className="relative inline-flex gap-4">
              <button
                onClick={() => setViewMode('list')}
                className={`
                  flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-xl rounded-b-none transition-all duration-200
                  min-h-[44px]
                  ${viewMode === 'list'
                    ? 'bg-[var(--color-accent)] text-[var(--color-button-text)] shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
                    : 'bg-transparent text-[var(--color-secondary)] hover:text-[var(--color-heading)]'
                  }
                `}
              >
                <LayoutDashboard size={16} />
                <span className="text-xs sm:text-sm">List View</span>
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`
                  flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-xl rounded-b-none transition-all duration-200
                  min-h-[44px]
                  ${viewMode === 'board'
                    ? 'bg-[var(--color-accent)] text-[var(--color-button-text)] shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
                    : 'bg-transparent text-[var(--color-secondary)] hover:text-[var(--color-heading)]'
                  }
                `}
              >
                <Package size={16} />
                <span className="text-xs sm:text-sm">Board View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Orders Summary */}
        <div className="mt-10 sm:mt-12 mb-4 sm:mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {statusColumns.map(status => {
            const count = orders.filter(order => order.status === status).length;
            const icon = getStatusIcon(status);
            return (
              <KPICard
                key={status}
                title={status}
                value={count}
                icon={icon}
              />
            );
          })}
        </div>

        {/* Main Content */}
        <div className={`${viewMode === 'board' ? 'bg-[var(--color-sharktank-bg)]' : ''} rounded-lg`}>
          {viewMode === 'list' ? (
            <ListView orders={orders} onOrderClick={handleOrderClick} />
          ) : (
            <BoardView orders={orders} onOrderMove={handleOrderMove} onOrderClick={handleOrderClick} />
          )}
        </div>

        {/* Empty State (if no orders) */}
        {orders.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-400 text-lg sm:text-xl mb-2">No orders found</div>
            <div className="text-gray-500 text-sm sm:text-base">
              Orders will appear here once they are created
            </div>
          </div>
        )}
    </div>
  );
};

export default OrderTracking;
