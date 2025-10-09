export interface CreateInvoiceDto {
  purchaseOrderId: string;
  invoiceNumber?: string; // Optional - will be auto-generated if not provided
  invoiceDate?: Date;     // Optional - defaults to current date
}

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceAmount: number;
  status: string;
  purchaseOrder: {
    id: string;
    poNumber: string;
    vendor: {
      id: string;
      companyName: string;
      contactPersonName: string;
    };
  };
  attachment: {
    id: string;
    fileName: string;
    s3Url: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceTemplateData {
  vendor: {
    id: string;
    companyName: string;
    contactPersonName: string;
    contactPhone: string;
    warehouseLocation: string;
    gstNumber: string | null;
    panNumber: string | null;
  };
  purchaseOrder: {
    id: string;
    poNumber: string;
    status: string;
    totalAmount: number;
    issuedAt: Date | null;
  };
  items: Array<{
    id: string;
    productName: string;
    sku: string | null;
    orderedQuantity: number;
    confirmedQuantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totals: {
    subtotal: number;
    totalAmount: number;
  };
}

export interface InvoiceListQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  vendorId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface InvoiceListResponseDto {
  invoices: InvoiceDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}