import * as XLSX from 'xlsx';
import { logger } from '../utils/logger';

export interface ExcelOrderRow {
  orderNumber: string;
  sku?: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  vendorId?: string;
}

export interface ParsedOrderData {
  orderNumber: string;
  vendorId?: string;
  items: {
    productName: string;
    sku?: string;
    quantity: number;
    pricePerUnit: number;
  }[];
}

export class ExcelService {
  
  /**
   * Parse Excel file buffer and extract order data
   */
  parseOrdersExcel(fileBuffer: Buffer): ParsedOrderData[] {
    try {
      // Read the Excel file from buffer
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      // Get the first worksheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false,
        defval: ''
      });

      if (rawData.length === 0) {
        throw new Error('Excel file is empty');
      }

      // Validate headers
      this.validateHeaders(Object.keys(rawData[0]));

      // Parse and group data by order number
      const ordersMap = new Map<string, ParsedOrderData>();

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNum = i + 2; // Excel row number (header is row 1)

        try {
          const parsedRow = this.parseRow(row, rowNum);
          
          // Group items by order number
          if (!ordersMap.has(parsedRow.orderNumber)) {
            ordersMap.set(parsedRow.orderNumber, {
              orderNumber: parsedRow.orderNumber,
              vendorId: parsedRow.vendorId,
              items: []
            });
          }

          const order = ordersMap.get(parsedRow.orderNumber)!;
          
          // Validate vendor consistency for the same order (only if vendorId is provided)
          if (parsedRow.vendorId && order.vendorId && order.vendorId !== parsedRow.vendorId) {
            throw new Error(`Row ${rowNum}: Order ${parsedRow.orderNumber} has inconsistent vendor IDs`);
          }
          
          // Update vendorId if this row has one and order doesn't yet
          if (parsedRow.vendorId && !order.vendorId) {
            order.vendorId = parsedRow.vendorId;
          }

          order.items.push({
            productName: parsedRow.productName,
            sku: parsedRow.sku || undefined,
            quantity: parsedRow.quantity,
            pricePerUnit: parsedRow.pricePerUnit
          });
        } catch (error) {
          logger.error(`Error parsing row ${rowNum}`, { error, row });
          throw error;
        }
      }

      const orders = Array.from(ordersMap.values());
      
      logger.info('Excel file parsed successfully', { 
        totalRows: rawData.length,
        ordersCount: orders.length 
      });

      return orders;
    } catch (error) {
      logger.error('Failed to parse Excel file', { error });
      throw error;
    }
  }

  /**
   * Validate Excel headers
   */
  private validateHeaders(headers: string[]): void {
    const requiredHeaders = [
      'Order Number',
      'Product Name', 
      'Quantity',
      'Price Per Unit'
    ];

    const optionalHeaders = ['SKU', 'Vendor ID'];

    const normalizedHeaders = headers.map(h => h.trim());

    const missingHeaders = requiredHeaders.filter(
      required => !normalizedHeaders.includes(required)
    );

    if (missingHeaders.length > 0) {
      throw new Error(
        `Missing required columns: ${missingHeaders.join(', ')}. ` +
        `Required columns are: ${requiredHeaders.join(', ')}. ` +
        `Optional columns: ${optionalHeaders.join(', ')}`
      );
    }
  }

  /**
   * Parse a single Excel row
   */
  private parseRow(row: any, rowNum: number): ExcelOrderRow {
    const orderNumber = this.getStringValue(row, 'Order Number', rowNum, true);
    const productName = this.getStringValue(row, 'Product Name', rowNum, true);
    const sku = this.getStringValue(row, 'SKU', rowNum, false);
    const vendorId = this.getStringValue(row, 'Vendor ID', rowNum, false);
    
    const quantity = this.getNumberValue(row, 'Quantity', rowNum, true);
    const pricePerUnit = this.getNumberValue(row, 'Price Per Unit', rowNum, true);

    // Validate values
    if (quantity <= 0) {
      throw new Error(`Row ${rowNum}: Quantity must be greater than 0`);
    }

    if (pricePerUnit < 0) {
      throw new Error(`Row ${rowNum}: Price Per Unit cannot be negative`);
    }

    return {
      orderNumber,
      productName,
      sku: sku || undefined,
      quantity,
      pricePerUnit,
      vendorId: vendorId || undefined
    };
  }

  /**
   * Get string value from row
   */
  private getStringValue(
    row: any, 
    columnName: string, 
    rowNum: number, 
    required: boolean
  ): string {
    const value = row[columnName];
    
    if (!value || value.toString().trim() === '') {
      if (required) {
        throw new Error(`Row ${rowNum}: ${columnName} is required`);
      }
      return '';
    }

    return value.toString().trim();
  }

  /**
   * Get number value from row
   */
  private getNumberValue(
    row: any, 
    columnName: string, 
    rowNum: number, 
    required: boolean
  ): number {
    const value = row[columnName];
    
    if (value === undefined || value === null || value === '') {
      if (required) {
        throw new Error(`Row ${rowNum}: ${columnName} is required`);
      }
      return 0;
    }

    const numValue = typeof value === 'number' 
      ? value 
      : parseFloat(value.toString().replace(/[^0-9.-]/g, ''));

    if (isNaN(numValue)) {
      throw new Error(`Row ${rowNum}: ${columnName} must be a valid number`);
    }

    return numValue;
  }

  /**
   * Generate sample Excel template
   */
  generateSampleTemplate(): Buffer {
    const sampleData = [
      {
        'Order Number': 'ORD-250110-001',
        'SKU': 'KY-ROSE-001',
        'Product Name': 'Red Rose',
        'Quantity': 100,
        'Price Per Unit': 25.50,
        'Vendor ID': 'vendor-id-here (optional)'
      },
      {
        'Order Number': 'ORD-250110-001',
        'SKU': 'KY-LILY-002',
        'Product Name': 'White Lily',
        'Quantity': 50,
        'Price Per Unit': 30.00,
        'Vendor ID': 'vendor-id-here (optional)'
      },
      {
        'Order Number': 'ORD-250110-002',
        'SKU': '',
        'Product Name': 'Tulip Mix',
        'Quantity': 200,
        'Price Per Unit': 15.75,
        'Vendor ID': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Order Number
      { wch: 15 }, // SKU
      { wch: 25 }, // Product Name
      { wch: 10 }, // Quantity
      { wch: 15 }, // Price Per Unit
      { wch: 25 }  // Vendor ID
    ];

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

export const excelService = new ExcelService();

