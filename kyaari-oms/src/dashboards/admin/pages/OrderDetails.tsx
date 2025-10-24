import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronUp, Package, Clock, Wallet, Users, FileText } from 'lucide-react';
import { OrderTrackingApi, type OrderTrackingItem } from '../../../services/orderTrackingApi';
import toast from 'react-hot-toast';

type OrderTrackingStatus = 'Received' | 'Assigned' | 'Confirmed' | 'Invoiced' | 'Dispatched' | 'Verified' | 'Paid';

const getStatusColor = (status: string): string => {
  const statusColors: Record<OrderTrackingStatus, string> = {
    'Received': "bg-gray-100 text-gray-800 border-gray-200",
    'Assigned': "bg-blue-100 text-blue-800 border-blue-200",
    'Confirmed': "bg-yellow-100 text-yellow-800 border-yellow-200",
    'Invoiced': "bg-purple-100 text-purple-800 border-purple-200",
    'Dispatched': "bg-orange-100 text-orange-800 border-orange-200",
    'Verified': "bg-green-100 text-green-800 border-green-200",
    'Paid': "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return statusColors[status as OrderTrackingStatus] || "bg-gray-100 text-gray-800 border-gray-200";
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
  const [orderDetails, setOrderDetails] = useState<OrderTrackingItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await OrderTrackingApi.getOrderById(id);
        if (response.success) {
          console.log('Order details response:', response.data);
          // The actual order data is nested inside response.data.data
          setOrderDetails((response.data as any).data);
        } else {
          toast.error('Failed to load order details');
        }
      } catch (error) {
        toast.error('Failed to load order details');
        console.error('Error fetching order details:', error);
        console.error('Error details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-sharktank-bg)] min-h-screen font-sans w-full overflow-x-hidden">
        <div>
          <div className="mb-6">
            <button
              onClick={() => navigate('/admin/order-tracking')}
              className="flex items-center gap-2 mb-4 text-[var(--color-heading)] hover:text-[var(--color-accent)] transition-colors"
            >
              <ChevronUp size={20} className="rotate-90" />
              Back to Order Tracking
            </button>
            <h1 className="text-2xl font-bold text-[var(--color-heading)] mb-2">Order Details</h1>
            <p className="text-gray-600">Loading order information</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
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
            onClick={() => navigate('/admin/order-tracking')}
            className="flex items-center gap-2 mb-6 text-[var(--color-heading)] hover:text-[var(--color-accent)] transition-colors"
          >
            <ChevronUp size={20} className="rotate-90" />
            Back to Order Tracking
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

  // Debug log to check data structure
  console.log('OrderDetails render - orderDetails:', orderDetails);
  console.log('OrderDetails render - vendor:', orderDetails.vendor);

  const totalPrice = orderDetails.totalPrice || 0;
  const totalQuantity = orderDetails.quantity;

  // Custom Print Component
  const PrintComponent = () => (
    <div ref={printRef} className="print-container p-8 bg-white text-black">
      <style>
        {`
          @media print {
            body { margin: 0; }
            .print-container { 
              width: 100%; 
              font-family: Arial, sans-serif; 
              color: black;
              background: white;
            }
            .print-header { 
              border-bottom: 2px solid #000; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .print-section { 
              margin-bottom: 25px; 
              page-break-inside: avoid;
            }
            .print-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
            }
            .print-field { 
              margin-bottom: 10px; 
            }
            .print-label { 
              font-weight: bold; 
              color: #333; 
              font-size: 12px; 
            }
            .print-value { 
              font-size: 14px; 
              margin-top: 2px; 
            }
            .print-status { 
              display: inline-block; 
              padding: 4px 8px; 
              border-radius: 4px; 
              font-size: 12px; 
              font-weight: bold; 
              border: 1px solid #000; 
            }
            .print-footer { 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 1px solid #ccc; 
              text-align: center; 
              font-size: 10px; 
              color: #666; 
            }
          }
        `}
      </style>
      
      {/* Header */}
      <div className="print-header">
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
          Order Details Report
        </h1>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Generated on: {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB')}
        </div>
      </div>

      {/* Order Information */}
      <div className="print-section">
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
          Order Information
        </h2>
        <div className="print-grid">
          <div className="print-field">
            <div className="print-label">Order Number:</div>
            <div className="print-value">{orderDetails.orderNumber || 'N/A'}</div>
          </div>
          <div className="print-field">
            <div className="print-label">Client Order ID:</div>
            <div className="print-value">{orderDetails.clientOrderId || 'N/A'}</div>
          </div>
          <div className="print-field">
            <div className="print-label">Status:</div>
            <div className="print-value">
              <span className="print-status" style={{ backgroundColor: '#f3f4f6', color: '#000' }}>
                {orderDetails.status}
              </span>
            </div>
          </div>
          <div className="print-field">
            <div className="print-label">Product Name:</div>
            <div className="print-value">{orderDetails.productName || 'N/A'}</div>
          </div>
          <div className="print-field">
            <div className="print-label">SKU:</div>
            <div className="print-value">{orderDetails.sku || 'N/A'}</div>
          </div>
          <div className="print-field">
            <div className="print-label">Quantity:</div>
            <div className="print-value">{totalQuantity || 0} items</div>
          </div>
          <div className="print-field">
            <div className="print-label">Price Per Unit:</div>
            <div className="print-value">{orderDetails.pricePerUnit ? formatINR(orderDetails.pricePerUnit) : 'N/A'}</div>
          </div>
          <div className="print-field">
            <div className="print-label">Total Price:</div>
            <div className="print-value" style={{ fontWeight: 'bold', fontSize: '16px' }}>
              {totalPrice ? formatINR(totalPrice) : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Information */}
      <div className="print-section">
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
          Vendor Information
        </h2>
        <div className="print-grid">
          <div className="print-field">
            <div className="print-label">Company Name:</div>
            <div className="print-value">{orderDetails.vendor?.companyName || 'N/A'}</div>
          </div>
          <div className="print-field">
            <div className="print-label">Contact Person:</div>
            <div className="print-value">{orderDetails.vendor?.contactPersonName || 'N/A'}</div>
          </div>
          <div className="print-field">
            <div className="print-label">Contact Phone:</div>
            <div className="print-value">{orderDetails.vendor?.contactPhone || 'N/A'}</div>
          </div>
          <div className="print-field">
            <div className="print-label">Vendor ID:</div>
            <div className="print-value">{orderDetails.vendor?.id || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Tracking Information */}
      <div className="print-section">
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
          Tracking Information
        </h2>
        <div className="print-grid">
          <div className="print-field">
            <div className="print-label">Created Date:</div>
            <div className="print-value">{orderDetails.createdAt ? new Date(orderDetails.createdAt).toLocaleDateString('en-GB') : 'N/A'}</div>
          </div>
          <div className="print-field">
            <div className="print-label">Updated Date:</div>
            <div className="print-value">{orderDetails.updatedAt ? new Date(orderDetails.updatedAt).toLocaleDateString('en-GB') : 'N/A'}</div>
          </div>
          {orderDetails.assignedAt && (
            <div className="print-field">
              <div className="print-label">Assigned Date:</div>
              <div className="print-value">{new Date(orderDetails.assignedAt).toLocaleDateString('en-GB')}</div>
            </div>
          )}
          {orderDetails.vendorActionAt && (
            <div className="print-field">
              <div className="print-label">Vendor Action Date:</div>
              <div className="print-value">{new Date(orderDetails.vendorActionAt).toLocaleDateString('en-GB')}</div>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Details */}
      {(orderDetails.assignedQuantity || orderDetails.confirmedQuantity || orderDetails.vendorRemarks) && (
        <div className="print-section">
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
            Assignment Details
          </h2>
          <div className="print-grid">
            {orderDetails.assignedQuantity && (
              <div className="print-field">
                <div className="print-label">Assigned Quantity:</div>
                <div className="print-value">{orderDetails.assignedQuantity}</div>
              </div>
            )}
            {orderDetails.confirmedQuantity && (
              <div className="print-field">
                <div className="print-label">Confirmed Quantity:</div>
                <div className="print-value">{orderDetails.confirmedQuantity}</div>
              </div>
            )}
            {orderDetails.vendorRemarks && (
              <div className="print-field" style={{ gridColumn: '1 / -1' }}>
                <div className="print-label">Vendor Remarks:</div>
                <div className="print-value" style={{ backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                  {orderDetails.vendorRemarks}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="print-footer">
        <div>This document was generated automatically from the Order Management System</div>
        <div>For any queries, please contact the system administrator</div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-sharktank-bg)] min-h-screen font-sans w-full overflow-x-hidden">
      <div >
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/order-tracking')}
            className="flex items-center gap-2 mb-4 text-[var(--color-heading)] hover:text-[var(--color-accent)] transition-colors"
          >
            <ChevronUp size={20} className="rotate-90" />
            Back to Order Tracking
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
                  <div className="text-[var(--color-heading)] font-semibold">{orderDetails.orderNumber || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Order ID</label>
                  <div className="text-gray-700">{orderDetails.clientOrderId || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <div className="text-gray-700 flex items-center gap-2">
                    <Users size={16} />
                    {orderDetails.vendor?.companyName || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <div className="text-gray-700">{orderDetails.vendor?.contactPersonName || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <div className="text-gray-700">{orderDetails.vendor?.contactPhone || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <div className="text-gray-700">{orderDetails.productName || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <div className="text-gray-700">{orderDetails.sku || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <div className="text-gray-700">{totalQuantity || 0} items</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Unit</label>
                  <div className="text-gray-700">{orderDetails.pricePerUnit ? formatINR(orderDetails.pricePerUnit) : 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Price</label>
                  <div className="text-[var(--color-heading)] font-semibold flex items-center gap-2">
                    <Wallet size={16} />
                    {totalPrice ? formatINR(totalPrice) : 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                  <div className="text-gray-700 flex items-center gap-2">
                    <Clock size={16} />
                    {orderDetails.createdAt ? new Date(orderDetails.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Updated Date</label>
                  <div className="text-gray-700 flex items-center gap-2">
                    <Clock size={16} />
                    {orderDetails.updatedAt ? new Date(orderDetails.updatedAt).toLocaleDateString('en-GB') : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Tracking Details - Right Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[var(--color-heading)] mb-4">
                Tracking Information
              </h2>
              <div className="space-y-4">
                {/* Status Information */}
                <div className="border border-gray-100 rounded-lg p-4">
                  <h3 className="font-medium text-[var(--color-heading)] text-sm mb-2">Current Status</h3>
                  <div className="flex items-center gap-2">
                    <span className={`
                      inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
                      ${getStatusColor(orderDetails.status)}
                    `}>
                      {orderDetails.status}
                    </span>
                  </div>
                </div>

                {/* Assignment Details */}
                {orderDetails.assignedQuantity && (
                  <div className="border border-gray-100 rounded-lg p-4">
                    <h3 className="font-medium text-[var(--color-heading)] text-sm mb-2">Assignment Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assigned Quantity:</span>
                        <span className="font-medium">{orderDetails.assignedQuantity}</span>
                      </div>
                      {orderDetails.confirmedQuantity && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Confirmed Quantity:</span>
                          <span className="font-medium">{orderDetails.confirmedQuantity}</span>
                        </div>
                      )}
                      {orderDetails.assignedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assigned At:</span>
                          <span className="font-medium">{orderDetails.assignedAt ? new Date(orderDetails.assignedAt).toLocaleDateString('en-GB') : 'N/A'}</span>
                        </div>
                      )}
                      {orderDetails.vendorActionAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Vendor Action At:</span>
                          <span className="font-medium">{orderDetails.vendorActionAt ? new Date(orderDetails.vendorActionAt).toLocaleDateString('en-GB') : 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Vendor Remarks */}
                {orderDetails.vendorRemarks && (
                  <div className="border border-gray-100 rounded-lg p-4">
                    <h3 className="font-medium text-[var(--color-heading)] text-sm mb-2">Vendor Remarks</h3>
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {orderDetails.vendorRemarks}
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="border border-gray-100 rounded-lg p-4">
                  <h3 className="font-medium text-[var(--color-heading)] text-sm mb-2">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product:</span>
                      <span className="font-medium text-right">{orderDetails.productName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{totalQuantity || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price Per Unit:</span>
                      <span className="font-medium">{orderDetails.pricePerUnit ? formatINR(orderDetails.pricePerUnit) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-semibold text-[var(--color-heading)]">Total:</span>
                      <span className="font-bold text-[var(--color-heading)]">
                        {totalPrice ? formatINR(totalPrice) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button className="bg-[var(--color-accent)] text-[var(--color-button-text)] px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Update Tracking Status
          </button>
          <button 
            onClick={() => {
              if (printRef.current) {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Order Details - ${orderDetails.orderNumber}</title>
                        <style>
                          body { font-family: Arial, sans-serif; margin: 20px; color: black; }
                          .print-header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                          .print-section { margin-bottom: 25px; }
                          .print-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                          .print-field { margin-bottom: 10px; }
                          .print-label { font-weight: bold; color: #333; font-size: 12px; }
                          .print-value { font-size: 14px; margin-top: 2px; }
                          .print-status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; border: 1px solid #000; background: #f3f4f6; }
                          .print-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; font-size: 10px; color: #666; }
                        </style>
                      </head>
                      <body>
                        ${printRef.current.innerHTML}
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.print();
                  printWindow.close();
                }
              }
            }}
            className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <FileText size={16} />
            Print Details
          </button>
          <button 
            onClick={() => navigate('/admin/support/vendors')}
            className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Contact Vendor
          </button>
        </div>
      </div>

      {/* Hidden Print Component */}
      <div style={{ display: 'none' }}>
        <PrintComponent />
      </div>
    </div>
  );
};

export default OrderDetails;