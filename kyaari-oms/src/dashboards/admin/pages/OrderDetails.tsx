import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, Calendar, Users, FileText } from 'lucide-react';
import { orderApi, type Order } from '../../../services/orderApi';
import toast from 'react-hot-toast';

type OrderStatus = 'RECEIVED' | 'ASSIGNED' | 'PROCESSING' | 'FULFILLED' | 'PARTIALLY_FULFILLED' | 'CLOSED' | 'CANCELLED';

const STATUS_STYLES: Record<OrderStatus, { label: string; bg: string; color: string; border: string }> = {
  RECEIVED: { label: 'Received', bg: '#E5E7EB', color: '#111827', border: '#D1D5DB' },
  ASSIGNED: { label: 'Assigned', bg: '#DBEAFE', color: '#1E3A8A', border: '#BFDBFE' },
  PROCESSING: { label: 'Processing', bg: '#FEF08A', color: '#92400E', border: '#FDE047' },
  FULFILLED: { label: 'Fulfilled', bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  PARTIALLY_FULFILLED: { label: 'Partial', bg: '#FFEDD5', color: '#9A3412', border: '#FED7AA' },
  CLOSED: { label: 'Closed', bg: '#E0ECE8', color: '#1D4D43', border: '#B7CEC6' },
  CANCELLED: { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
};

const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
};

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const orderData = await orderApi.getOrderById(id);
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order details:', error);
        toast.error('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-sharktank-bg)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-sharktank-bg)]">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/admin/orders')}
            className="bg-accent text-button-text px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[order.status as OrderStatus] || STATUS_STYLES.RECEIVED;

  return (
    <div className="min-h-screen p-4 sm:p-10 bg-[var(--color-sharktank-bg)]">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/orders')}
          className="flex items-center gap-2 text-accent hover:underline mb-4"
        >
          <ChevronLeft size={20} />
          <span>Back to Orders</span>
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-heading mb-2">Order Details</h1>
            <p className="text-sm sm:text-base text-gray-600">Order #{order.orderNumber}</p>
          </div>
          <span
            className="inline-block px-4 py-2 rounded-full text-sm font-semibold border w-fit"
            style={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.color,
              borderColor: statusStyle.border,
            }}
          >
            {statusStyle.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info Card */}
        <div className="lg:col-span-1 bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
            <FileText size={20} />
          Order Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Order Number</label>
              <p className="font-medium text-secondary">{order.orderNumber}</p>
          </div>
            <div>
              <label className="text-sm text-gray-500">Status</label>
              <p className="font-medium text-secondary">{statusStyle.label}</p>
          </div>
            <div>
              <label className="text-sm text-gray-500">Source</label>
              <p className="font-medium text-secondary">{order.source || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar size={14} />
                Created At
              </label>
              <p className="font-medium text-secondary">
                {new Date(order.createdAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </p>
          </div>
            <div>
              <label className="text-sm text-gray-500">Updated At</label>
              <p className="font-medium text-secondary">
                {new Date(order.updatedAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </p>
          </div>
        </div>
      </div>

        {/* Vendor Info Card */}
        <div className="lg:col-span-1 bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
            <Users size={20} />
          Vendor Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Company Name</label>
              <p className="font-medium text-secondary">{order.primaryVendor.companyName}</p>
            </div>
            {order.primaryVendor.contactPersonName && (
              <div>
                <label className="text-sm text-gray-500">Contact Person</label>
                <p className="font-medium text-secondary">{order.primaryVendor.contactPersonName}</p>
              </div>
            )}
            {order.primaryVendor.contactPhone && (
              <div>
                <label className="text-sm text-gray-500">Phone</label>
                <p className="font-medium text-secondary">{order.primaryVendor.contactPhone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="lg:col-span-1 bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
            <Package size={20} />
            Order Summary
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Total Items</label>
              <p className="font-medium text-secondary text-2xl">{order.items.length}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Total Quantity</label>
              <p className="font-medium text-secondary text-2xl">
                {order.items.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <label className="text-sm text-gray-500">Total Value</label>
              <p className="font-bold text-accent text-3xl">
                {formatINR(order.items.reduce((sum, item) => sum + item.totalPrice, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items Table */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-secondary flex items-center gap-2">
            <Package size={20} />
            Order Items ({order.items.length})
          </h3>
    </div>
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-secondary">#</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary">Product Name</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary">SKU</th>
                <th className="text-right p-4 text-sm font-semibold text-secondary">Quantity</th>
                <th className="text-right p-4 text-sm font-semibold text-secondary">Price/Unit</th>
                <th className="text-right p-4 text-sm font-semibold text-secondary">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-4 text-gray-600">{index + 1}</td>
                  <td className="p-4 font-medium text-secondary">{item.productName}</td>
                  <td className="p-4 text-gray-600">{item.sku || '-'}</td>
                  <td className="p-4 text-right font-medium">{item.quantity}</td>
                  <td className="p-4 text-right text-gray-600">{formatINR(item.pricePerUnit)}</td>
                  <td className="p-4 text-right font-semibold text-accent">{formatINR(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td colSpan={5} className="p-4 text-right font-semibold text-secondary">Grand Total:</td>
                <td className="p-4 text-right font-bold text-accent text-lg">
                  {formatINR(order.items.reduce((sum, item) => sum + item.totalPrice, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden p-4 space-y-4">
          {order.items.map((item, index) => (
            <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500">Item #{index + 1}</span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">Product</label>
                  <p className="font-medium text-secondary">{item.productName}</p>
                </div>
                {item.sku && (
                <div>
                    <label className="text-xs text-gray-500">SKU</label>
                    <p className="text-sm text-gray-600">{item.sku}</p>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 pt-2">
                <div>
                    <label className="text-xs text-gray-500">Qty</label>
                    <p className="font-medium">{item.quantity}</p>
                </div>
                <div>
                    <label className="text-xs text-gray-500">Price/Unit</label>
                    <p className="text-sm">{formatINR(item.pricePerUnit)}</p>
                </div>
                <div>
                    <label className="text-xs text-gray-500">Total</label>
                    <p className="font-semibold text-accent">{formatINR(item.totalPrice)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="bg-accent/10 rounded-lg p-4 border border-accent/30">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-secondary">Grand Total:</span>
              <span className="font-bold text-accent text-xl">
                {formatINR(order.items.reduce((sum, item) => sum + item.totalPrice, 0))}
                      </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
