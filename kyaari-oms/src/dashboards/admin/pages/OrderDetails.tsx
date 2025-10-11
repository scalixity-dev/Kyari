import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronUp, Package, Clock, Wallet, Users } from 'lucide-react';
import { orderApi, type Order } from '../../../services/orderApi';
import toast from 'react-hot-toast';

type OrderStatus = 'RECEIVED' | 'ASSIGNED' | 'PROCESSING' | 'FULFILLED' | 'PARTIALLY_FULFILLED' | 'CLOSED' | 'CANCELLED';

const getStatusColor = (status: string): string => {
  const statusColors: Record<OrderStatus, string> = {
    'RECEIVED': "bg-gray-100 text-gray-800 border-gray-200",
    'ASSIGNED': "bg-blue-100 text-blue-800 border-blue-200",
    'PROCESSING': "bg-yellow-100 text-yellow-800 border-yellow-200",
    'FULFILLED': "bg-green-100 text-green-800 border-green-200",
    'PARTIALLY_FULFILLED': "bg-orange-100 text-orange-800 border-orange-200",
    'CLOSED': "bg-emerald-100 text-emerald-800 border-emerald-200",
    'CANCELLED': "bg-red-100 text-red-800 border-red-200",
  };
  return statusColors[status as OrderStatus] || "bg-gray-100 text-gray-800 border-gray-200";
};

const formatINR = (value: number) => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
  } catch {
    // Fallback
    return `₹${Number(value).toLocaleString('en-IN')}`;
  }
};

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const data = await orderApi.getOrderById(id);
        setOrderDetails(data);
      } catch (error) {
        toast.error('Failed to load order details');
        console.error('Error fetching order details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-6 bg-[var(--color-happyplant-bg)] min-h-screen">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/admin/tracking/orders')}
            className="flex items-center gap-2 mb-6 text-[var(--color-heading)] hover:text-[var(--color-accent)] transition-colors"
          >
            <ChevronUp size={20} className="rotate-90" />
            Back to Orders
          </button>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-sharktank-bg)] min-h-screen font-sans w-full overflow-x-hidden">
        <div>
          <button
            onClick={() => navigate('/admin/tracking/orders')}
            className="flex items-center gap-2 mb-6 text-[var(--color-heading)] hover:text-[var(--color-accent)] transition-colors"
          >
            <ChevronUp size={20} className="rotate-90" />
            Back to Orders
          </button>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-lg mb-2">Order not found</div>
            <div className="text-gray-500 text-sm">
              The order with ID "{id}" could not be found.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalPrice = orderDetails.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalQuantity = orderDetails.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-sharktank-bg)] min-h-screen font-sans w-full overflow-x-hidden">
      <div >
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/tracking/orders')}
            className="flex items-center gap-2 mb-4 text-[var(--color-heading)] hover:text-[var(--color-accent)] transition-colors"
          >
            <ChevronUp size={20} className="rotate-90" />
            Back to Orders
          </button>
          <h1 className="text-2xl font-bold text-[var(--color-heading)] mb-2">
            Order Details
          </h1>
          <p className="text-gray-600">
            Detailed information for order {orderDetails.orderNumber}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Order Summary - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--color-heading)] flex items-center gap-2">
                  <Package size={20} />
                  Order Information
                </h2>
                <span className={`
                  inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
                  ${getStatusColor(orderDetails.status)}
                `}>
                  {orderDetails.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
                  <div className="text-[var(--color-heading)] font-semibold">{orderDetails.orderNumber}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <div className="text-gray-700">{orderDetails.source}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <div className="text-gray-700 flex items-center gap-2">
                    <Users size={16} />
                    {orderDetails.primaryVendor.companyName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <div className="text-gray-700">{orderDetails.primaryVendor.contactPersonName}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <div className="text-gray-700">{orderDetails.primaryVendor.contactPhone}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label>
                  <div className="text-gray-700">{totalQuantity} items</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Price</label>
                  <div className="text-[var(--color-heading)] font-semibold flex items-center gap-2">
                    <Wallet size={16} />
                    {formatINR(totalPrice)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                  <div className="text-gray-700 flex items-center gap-2">
                    <Clock size={16} />
                    {new Date(orderDetails.createdAt).toLocaleDateString('en-GB')}
                  </div>
                </div>
                {orderDetails.createdBy && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                    <div className="text-gray-700">{orderDetails.createdBy.name}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Items - Right Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[var(--color-heading)] mb-4">
                Order Items ({orderDetails.items.length})
              </h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {orderDetails.items.map((item) => (
                  <div key={item.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="font-medium text-[var(--color-heading)] text-sm mb-1">
                      {item.productName}
                    </div>
                    {item.sku && (
                      <div className="text-xs text-gray-500 mb-1">SKU: {item.sku}</div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        Qty: {item.quantity}
                      </span>
                      <span className="text-gray-600">
                        {formatINR(item.pricePerUnit)}/unit
                      </span>
                    </div>
                    <div className="text-right text-sm font-medium text-[var(--color-heading)] mt-1">
                      {formatINR(item.totalPrice)}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[var(--color-heading)]">Total</span>
                  <span className="font-bold text-lg text-[var(--color-heading)]">
                    {formatINR(totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button className="bg-[var(--color-accent)] text-[var(--color-button-text)] px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Update Status
          </button>
          <button className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Print Details
          </button>
          <button className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Send Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;