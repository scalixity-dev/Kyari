import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { LayoutDashboard, Package, Bell, Users, CheckSquare, FileText, Wallet, MapPin, Eye, Filter } from 'lucide-react';
import { KPICard, CustomDropdown, CSVPDFExportButton } from '../../../components';
import { OrderTrackingApi } from '../../../services/orderTrackingApi';
import type { OrderTrackingItem, OrderTrackingSummary, OrderTrackingFilters } from '../../../services/orderTrackingApi';

// TypeScript types
type Status = "Received" | "Assigned" | "Confirmed" | "Invoiced" | "Dispatched" | "Verified" | "Paid";
type ViewMode = 'list' | 'board';

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
  order: OrderTrackingItem;
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
          {order.orderNumber}
        </div>
        <div className="text-gray-600 text-sm mb-2 leading-relaxed">
          {order.vendor.companyName}
        </div>
        <div className="text-gray-500 text-xs sm:text-sm">
          Qty: {order.quantity}
        </div>
      </div>
    )}
  </Draggable>
);

interface ListViewProps {
  orders: OrderTrackingItem[];
  onOrderClick?: (orderId: string) => void;
  showFilters: boolean;
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onResetFilters: () => void;
  loading?: boolean;
}

interface FilterState {
  vendor: string;
  status: string;
  qtyMin: string;
  qtyMax: string;
  search: string;
}

interface ListViewProps {
  orders: OrderTrackingItem[];
  onOrderClick?: (orderId: string) => void;
  showFilters: boolean;
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onResetFilters: () => void;
}

const ListView: React.FC<ListViewProps> = ({ 
  orders, 
  onOrderClick, 
  showFilters, 
  filters, 
  onFilterChange, 
  onResetFilters
}) => {

  // Get unique vendors for dropdown
  const uniqueVendors = Array.from(new Set((orders || []).map(o => o.vendor.companyName))).sort();

  return (
    <div>
      {/* Filter Section */}
      {showFilters && (
        <div className="bg-white border border-secondary/20 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              placeholder="Search by order number..."
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200"
            />
            <CustomDropdown
              value={filters.status}
              onChange={(value) => onFilterChange('status', value)}
              options={[
                { value: '', label: 'All Status' },
                ...statusColumns.map(s => ({ value: s, label: s }))
              ]}
              placeholder="All Status"
            />
            <CustomDropdown
              value={filters.vendor}
              onChange={(value) => onFilterChange('vendor', value)}
              options={[
                { value: '', label: 'All Vendors' },
                ...uniqueVendors.map(v => ({ value: v, label: v }))
              ]}
              placeholder="All Vendors"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={filters.qtyMin}
                  onChange={(e) => onFilterChange('qtyMin', e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px]"
                />
                <input
                  type="number"
                  value={filters.qtyMax}
                  onChange={(e) => onFilterChange('qtyMax', e.target.value)}
                  placeholder="Max"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px]"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-center sm:justify-end">
            <button 
              onClick={onResetFilters} 
              className="bg-white text-secondary border border-secondary rounded-lg px-6 py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      <div className="bg-header-bg rounded-xl overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
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
            {(orders || []).map((order) => (
              <tr
                key={order.id}
                onClick={() => onOrderClick?.(order.id)}
                className="border-b border-gray-100 hover:bg-gray-50 bg-white transition-colors cursor-pointer"
              >
                <td className="p-3 font-semibold text-secondary">
                  {order.orderNumber}
                </td>
                <td className="p-3 text-sm text-gray-700">
                  {order.vendor.companyName}
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {order.quantity}
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
          </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {(orders || []).map((order) => (
          <div
            key={order.id}
            onClick={() => onOrderClick?.(order.id)}
            className="rounded-xl p-4 border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="font-semibold text-secondary text-lg">
                {order.orderNumber}
              </div>
              <span className={`
                inline-block px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0
                ${getStatusColor(order.status)}
              `}>
                {order.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-3">
              {order.vendor.companyName}
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Quantity: </span>
                <span className="font-medium">{order.quantity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

interface BoardColumnProps {
  status: Status;
  orders: OrderTrackingItem[];
  onOrderClick?: (orderId: string) => void;
}

const BoardColumn: React.FC<BoardColumnProps> = ({ status, orders, onOrderClick }) => (
  <div className="flex-shrink-0 w-64 sm:w-72 bg-[var(--color-happyplant-bg)] rounded-lg p-3 mr-3 sm:mr-4 last:mr-0">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-[var(--color-heading)] text-sm sm:text-base">
        {status}
      </h3>
      <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
        {orders?.length || 0}
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
          {(orders || []).map((order, orderIndex) => (
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
  orders: OrderTrackingItem[];
  onOrderMove: (result: DropResult) => void;
  onOrderClick?: (orderId: string) => void;
}

const BoardView: React.FC<BoardViewProps> = ({ orders, onOrderMove, onOrderClick }) => {
  const ordersByStatus = statusColumns.reduce((acc, status) => {
    acc[status] = (orders || []).filter(order => order.status === status);
    return acc;
  }, {} as Record<Status, OrderTrackingItem[]>);

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
  const [orders, setOrders] = useState<OrderTrackingItem[]>([]);
  const [summary, setSummary] = useState<OrderTrackingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    vendor: '',
    status: '',
    qtyMin: '',
    qtyMax: '',
    search: ''
  });
  const navigate = useNavigate();

  // Load all data once on component mount
  useEffect(() => {
    loadOrderTrackingData();
  }, []);

  const loadOrderTrackingData = async () => {
    try {
      setLoading(true);
      
      // Fetch all orders without filters (like PaymentRelease does)
      const response = await OrderTrackingApi.getOrderTracking({
        page: 1,
        limit: 100,
        filters: undefined // No filters - get all data
      });

      if (response.success) {
        // Store all orders (like PaymentRelease does)
        const allOrders = response.data.orders && response.data.orders.length > 0 
          ? response.data.orders 
          : response.data.summary?.recentOrders || [];
        
        setOrders(allOrders);
        
        // Set summary data from the main response
        if (response.data.summary) {
          setSummary(response.data.summary);
        }
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering with useMemo (like PaymentRelease)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Status filter
      if (filters.status && order.status !== filters.status) return false;
      
      // Vendor filter
      if (filters.vendor && !order.vendor.companyName.toLowerCase().includes(filters.vendor.toLowerCase())) return false;
      
      // Search filter
      if (filters.search && !order.orderNumber.toLowerCase().includes(filters.search.toLowerCase())) return false;
      
      // Quantity range filters
      if (filters.qtyMin && order.quantity < parseInt(filters.qtyMin)) return false;
      if (filters.qtyMax && order.quantity > parseInt(filters.qtyMax)) return false;
      
      return true;
    });
  }, [orders, filters]);


  const handleOrderClick = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleOrderMove = async (result: DropResult) => {
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
    const orderToMove = (orders || []).find(order => order.id === draggableId);
    if (!orderToMove) return;

    const newStatus = destination.droppableId as Status;

    try {
      // Update the order's status via API
      const response = await OrderTrackingApi.updateOrderStatus(draggableId, {
        orderItemId: draggableId,
        newStatus,
        remarks: `Status changed from ${orderToMove.status} to ${newStatus}`
      });

      if (response.success) {
        // Update local state
        const updatedOrders = (orders || []).map(order =>
          order.id === draggableId
            ? { ...order, status: newStatus }
            : order
        );
        setOrders(updatedOrders);
        
        // Reload order tracking data to update summary counts
        loadOrderTrackingData();
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      vendor: '',
      status: '',
      qtyMin: '',
      qtyMax: '',
      search: ''
    });
  };


  const handleExportCSV = async () => {
    try {
      // Export with current filters
      const apiFilters: OrderTrackingFilters = {};
      
      if (filters.vendor) apiFilters.vendor = filters.vendor;
      if (filters.qtyMin) apiFilters.qtyMin = parseInt(filters.qtyMin);
      if (filters.qtyMax) apiFilters.qtyMax = parseInt(filters.qtyMax);
      if (filters.search) apiFilters.search = filters.search;
      // Note: status filter is applied client-side, so we don't send it to API

      const blob = await OrderTrackingApi.exportToCSV(
        Object.keys(apiFilters).length > 0 ? apiFilters : undefined
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-tracking-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Handle error silently
    }
  };

  const handleExportPDF = async () => {
    try {
      // Export with current filters
      const apiFilters: OrderTrackingFilters = {};
      
      if (filters.vendor) apiFilters.vendor = filters.vendor;
      if (filters.qtyMin) apiFilters.qtyMin = parseInt(filters.qtyMin);
      if (filters.qtyMax) apiFilters.qtyMax = parseInt(filters.qtyMax);
      if (filters.search) apiFilters.search = filters.search;
      // Note: status filter is applied client-side, so we don't send it to API

      const blob = await OrderTrackingApi.exportToPDF(
        Object.keys(apiFilters).length > 0 ? apiFilters : undefined
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-tracking-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Handle error silently
    }
  };



  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-sharktank-bg)] min-h-screen font-sans w-full overflow-x-hidden">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-heading mb-2">Order Tracking</h1>
          <p className="text-sm sm:text-base text-gray-600">Track and monitor order status in real-time</p>
        </div>

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
            const statusCounts = summary?.statusCounts || {};
            const count = statusCounts[status] || 0;
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

        {/* Filter and Export Buttons - Only for List View */}
        {viewMode === 'list' && (
          <div className="flex flex-col sm:flex-row justify-end gap-2 mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors min-h-[44px] sm:min-h-auto w-full sm:w-auto"
            >
              <Filter size={16} className="flex-shrink-0" />
              <span className="text-sm">Filter</span>
            </button>
            <CSVPDFExportButton
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
            />
          </div>
        )}

        {/* Main Content */}
        <div className={`${viewMode === 'board' ? 'bg-[var(--color-sharktank-bg)]' : ''} rounded-lg`}>
          {loading ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : viewMode === 'list' ? (
            <ListView 
              orders={filteredOrders} 
              onOrderClick={handleOrderClick}
              showFilters={showFilters}
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
            />
          ) : (
            <BoardView orders={filteredOrders} onOrderMove={handleOrderMove} onOrderClick={handleOrderClick} />
          )}
        </div>

        {/* Empty State (if no orders) */}
        {!loading && (!filteredOrders || filteredOrders.length === 0) && (
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
