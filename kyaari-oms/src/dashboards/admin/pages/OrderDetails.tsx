import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronUp, Package, MapPin, Clock, Wallet, Users } from 'lucide-react';

// Extended types for order details
export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
}

export interface OrderDetails {
  id: string;
  vendor: string;
  qty: number;
  status: Status;
  orderDate: string;
  totalPrice: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: OrderItem[];
  estimatedDelivery?: string;
  trackingNumber?: string;
}

type Status = "Received" | "Assigned" | "Confirmed" | "Invoiced" | "Dispatched" | "Verified" | "Paid";

// Mock data for order details
const mockOrderDetails: Record<string, OrderDetails> = {
  'ORD-001': {
    id: 'ORD-001',
    vendor: 'Green Valley Farms',
    qty: 250,
    status: 'Received',
    orderDate: '2025-09-20',
    totalPrice: 1250.00,
    shippingAddress: {
      street: '123 Warehouse Blvd',
      city: 'Distribution City',
      state: 'CA',
      zipCode: '90210'
    },
    items: [
      { id: 'ITEM-001', productName: 'Organic Carrots', quantity: 100, pricePerUnit: 2.50 },
      { id: 'ITEM-002', productName: 'Fresh Lettuce', quantity: 150, pricePerUnit: 5.00 }
    ],
    estimatedDelivery: '2025-09-27',
    trackingNumber: 'TRK-GVF-001'
  },
  'ORD-002': {
    id: 'ORD-002',
    vendor: 'Organic Harvest Co',
    qty: 180,
    status: 'Assigned',
    orderDate: '2025-09-19',
    totalPrice: 2160.00,
    shippingAddress: {
      street: '456 Storage Ave',
      city: 'Logistics Hub',
      state: 'TX',
      zipCode: '75001'
    },
    items: [
      { id: 'ITEM-003', productName: 'Organic Tomatoes', quantity: 80, pricePerUnit: 8.00 },
      { id: 'ITEM-004', productName: 'Bell Peppers', quantity: 100, pricePerUnit: 6.40 }
    ],
    estimatedDelivery: '2025-09-28',
    trackingNumber: 'TRK-OHC-002'
  },
  'ORD-003': {
    id: 'ORD-003',
    vendor: 'Fresh Fields Ltd',
    qty: 320,
    status: 'Confirmed',
    orderDate: '2025-09-18',
    totalPrice: 4800.00,
    shippingAddress: {
      street: '789 Depot Lane',
      city: 'Supply Center',
      state: 'FL',
      zipCode: '33101'
    },
    items: [
      { id: 'ITEM-005', productName: 'Sweet Corn', quantity: 200, pricePerUnit: 3.00 },
      { id: 'ITEM-006', productName: 'Green Beans', quantity: 120, pricePerUnit: 15.00 }
    ],
    estimatedDelivery: '2025-09-29',
    trackingNumber: 'TRK-FFL-003'
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

const formatINR = (value: number) => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
  } catch {
    // Fallback
    return `₹${Number(value).toLocaleString('en-IN')}`;
  }
};

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const orderDetails = id ? mockOrderDetails[id] : null;

  if (!orderDetails) {
    return (
      <div className="p-6 bg-[var(--color-happyplant-bg)] min-h-screen">
        <div className="max-w-4xl mx-auto">
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

  return (
    <div className="p-6 bg-[var(--color-happyplant-bg)] min-h-screen">
      <div className="max-w-6xl mx-auto">
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
            Detailed information for order {orderDetails.id}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                  <div className="text-[var(--color-heading)] font-semibold">{orderDetails.id}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <div className="text-gray-700 flex items-center gap-2">
                    <Users size={16} />
                    {orderDetails.vendor}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label>
                  <div className="text-gray-700">{orderDetails.qty} items</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Price</label>
                  <div className="text-[var(--color-heading)] font-semibold flex items-center gap-2">
                    <Wallet size={16} />
                    {formatINR(orderDetails.totalPrice)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
                  <div className="text-gray-700 flex items-center gap-2">
                    <Clock size={16} />
                    {new Date(orderDetails.orderDate).toLocaleDateString('en-GB')}
                  </div>
                </div>
                {orderDetails.estimatedDelivery && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Est. Delivery</label>
                    <div className="text-gray-700 flex items-center gap-2">
                      <Clock size={16} />
                      {new Date(orderDetails.estimatedDelivery).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[var(--color-heading)] mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Shipping Address
              </h2>
              <div className="text-gray-700">
                <div>{orderDetails.shippingAddress.street}</div>
                <div>
                  {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.zipCode}
                </div>
              </div>
              {orderDetails.trackingNumber && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                  <div className="text-[var(--color-accent)] font-mono text-sm">
                    {orderDetails.trackingNumber}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Items - Right Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[var(--color-heading)] mb-4">
                Order Items ({orderDetails.items.length})
              </h2>
              <div className="space-y-3">
                {orderDetails.items.map((item) => (
                  <div key={item.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="font-medium text-[var(--color-heading)] text-sm mb-1">
                      {item.productName}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        Qty: {item.quantity}
                      </span>
                      <span className="text-gray-600">
                        {formatINR(item.pricePerUnit)}/unit
                      </span>
                    </div>
                    <div className="text-right text-sm font-medium text-[var(--color-heading)] mt-1">
                      {formatINR(item.quantity * item.pricePerUnit)}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[var(--color-heading)]">Total</span>
                  <span className="font-bold text-lg text-[var(--color-heading)]">
                    {formatINR(orderDetails.totalPrice)}
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