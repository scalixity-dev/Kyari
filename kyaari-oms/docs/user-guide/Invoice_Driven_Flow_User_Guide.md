# Kyari OMS - Invoice-Driven Order Flow User Guide

## Overview

This user guide provides step-by-step instructions for using the enhanced Kyari Order Management System with invoice-driven workflows, mandatory pricing, automated invoice generation, and GRN auto-ticketing features.

## Table of Contents

- [Getting Started](#getting-started)
- [Order Management (Enhanced)](#order-management-enhanced)
- [Invoice Generation & Management](#invoice-generation--management)
- [Invoice Upload System](#invoice-upload-system)
- [GRN Verification & Auto-Ticketing](#grn-verification--auto-ticketing)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Getting Started

### User Roles & Permissions

The system supports four main user roles with specific permissions:

| Feature | Admin | Vendor | Accounts | Operations |
|---------|-------|--------|----------|------------|
| Create Orders | ✅ | ❌ | ✅ | ✅ |
| View All Orders | ✅ | Own Only | ✅ | ✅ |
| Generate Invoices | ✅ | ❌ | ✅ | ❌ |
| Upload Invoices | ✅ | Own Only | ✅ | ❌ |
| GRN Verification | ✅ | ❌ | ❌ | ✅ |
| Ticket Management | ✅ | View Own | ✅ | ✅ |

### Login Process

1. Navigate to your assigned login page:
   - **Admin**: `/admin/signin`
   - **Vendor**: `/vendors/signin`
   - **Accounts**: `/accounts/signin`
   - **Operations**: `/operations/signin`

2. Enter your credentials and click "Sign In"

3. You'll be redirected to your role-specific dashboard

---

## Order Management (Enhanced)

### Creating Orders with Mandatory Pricing

**⚠️ IMPORTANT**: All order items must include pricing information.

#### Step 1: Navigate to Order Creation
- Go to your dashboard
- Click "Create New Order"

#### Step 2: Fill Customer Information
```
Customer Name: [Required]
Email: [Required - valid email format]
Phone: [Required - with country code]
```

#### Step 3: Add Delivery Address
```
Street Address: [Required]
City: [Required]
State: [Required]
Pincode: [Required - 6 digits]
Landmark: [Optional]
```

#### Step 4: Add Order Items (Enhanced)
For each item, you must provide:

```
Product Name: [Required]
SKU: [Optional]
Quantity: [Required - minimum 1]
Price Per Unit: [⚠️ MANDATORY - must be greater than 0]
```

**Example:**
- Product Name: "Organic Tomatoes"
- SKU: "ORG-TOM-001"
- Quantity: 50
- Price Per Unit: ₹45.00

The system will automatically calculate:
- **Total Price per Item**: Quantity × Price Per Unit = ₹2,250.00
- **Order Total**: Sum of all item totals

#### Step 5: Review & Submit
- Review all information
- Check calculated totals
- Add any special notes
- Click "Create Order"

**Success Indicators:**
- ✅ Order number generated (e.g., ORD-2024-001)
- ✅ Total amount calculated automatically
- ✅ Order status set to "RECEIVED"

### Viewing Orders

#### Order List View
- Click "Orders" in the navigation
- Use filters to find specific orders:
  - **Status**: Filter by order status
  - **Date Range**: Select start and end dates
  - **Customer**: Search by customer name

#### Order Details View
- Click on any order number to view details
- Information displayed:
  - Customer information
  - Delivery address
  - Item list with pricing
  - Current status
  - Assigned vendors (if any)
  - Related invoices and GRNs

---

## Invoice Generation & Management

### Automated Invoice Generation (Accounts Team)

#### Step 1: Access Invoice Generation
- Navigate to "Invoices" → "Generate New"
- Or from Purchase Order details, click "Generate Invoice"

#### Step 2: Select Purchase Order
- Choose the PO for which to generate invoice
- System validates that PO is ready for invoicing

#### Step 3: Review Generated Invoice
The system automatically:
- ✅ Creates sequential invoice number (INV-VEN001-2024-001)
- ✅ Populates vendor and PO details
- ✅ Calculates totals with taxes
- ✅ Generates JSON invoice file
- ✅ Stores file in AWS S3

#### Step 4: Download & Verify
- Click "Download Invoice" to get the JSON file
- Review invoice details for accuracy
- Status automatically set to "PENDING_VERIFICATION"

**Generated Invoice Structure:**
```json
{
  "invoice": {
    "number": "INV-VEN001-2024-001",
    "date": "2024-10-08",
    "vendor": {
      "name": "Vendor Name",
      "email": "vendor@example.com"
    },
    "items": [
      {
        "description": "Organic Tomatoes",
        "quantity": 50,
        "unitPrice": 45.00,
        "totalPrice": 2250.00
      }
    ],
    "summary": {
      "subtotal": 2250.00,
      "tax": 405.00,
      "total": 2655.00
    }
  }
}
```

### Invoice List Management

#### Viewing Invoices
- Go to "Invoices" → "All Invoices"
- Use filters:
  - **Status**: Pending, Verified, Rejected, Paid
  - **Vendor**: Filter by specific vendor
  - **Date Range**: Select invoice date range

#### Invoice Actions
- **View Details**: Click invoice number
- **Download**: Click download icon
- **Verify**: Change status to verified
- **Add Notes**: Add verification notes

---

## Invoice Upload System

### For Vendors: Upload Your Invoice

#### Step 1: Access Upload
- Go to "Invoices" → "Upload Invoice"
- Or from PO details, click "Upload Invoice"

#### Step 2: Choose Upload Method

**Option A: Upload to Existing Invoice**
- Select existing system-generated invoice
- Upload your invoice file (PDF/Image)

**Option B: Upload and Link to PO**
- Select the relevant Purchase Order
- Provide your invoice number
- Upload your invoice file

#### Step 3: File Upload
**Supported Formats:**
- ✅ PDF files
- ✅ Images (JPEG, PNG, WebP)
- ✅ Word documents (DOC, DOCX)

**File Requirements:**
- Maximum size: 10MB
- Must be readable and clear
- Should match PO details

#### Step 4: Add Details
```
Invoice Type: Vendor Upload
Your Invoice Number: [Your reference number]
Notes: [Optional additional information]
```

#### Step 5: Submit Upload
- Click "Upload Invoice"
- Wait for success confirmation
- Status set to "PENDING_VERIFICATION"

**Important Notes for Vendors:**
- 🔒 You can only upload invoices for your own orders
- 📝 Invoice details should match the PO exactly
- 🕐 Uploads are immediately visible to accounts team

### For Accounts Team: Upload Vendor Invoices

#### When to Use
- Vendor sent invoice via email
- Physical invoice received
- Need to digitize paper invoices

#### Upload Process
1. Go to "Invoices" → "Upload Received Invoice"
2. Select "Accounts Upload" as type
3. Choose relevant PO or existing invoice record
4. Upload file and add processing notes
5. Submit for verification

**Access Permissions:**
- ✅ Can upload invoices for any vendor
- ✅ Can see all uploaded invoices
- ✅ Can manage invoice verification process

---

## GRN Verification & Auto-Ticketing

### For Operations Team: GRN Verification Process

#### Step 1: Access Pending GRNs
- Go to "Operations" → "GRN Verification"
- View list of pending goods receipts
- Click on GRN number to start verification

#### Step 2: Review GRN Details
Information displayed:
- GRN Number and received date
- Dispatch details and vendor info
- Expected vs. received quantities
- Item details from original order

#### Step 3: Verify Each Item

For each item, record:
```
Expected Quantity: [Auto-filled from dispatch]
Received Quantity: [Enter actual received amount]
Item Status: [Select from dropdown]
  - ✅ Verified OK
  - ⚠️ Quantity Mismatch
  - 🔴 Damage Reported
  - 📉 Shortage Reported
  - 📈 Excess Received

Item Remarks: [Describe any issues]
Damage Reported: [Yes/No checkbox]
Damage Description: [If damage reported]
```

#### Step 4: Complete Verification

**If No Issues Found:**
- All items marked "Verified OK"
- Status becomes "VERIFIED_OK"
- No tickets created
- Process complete

**If Mismatches Found:**
- Status becomes "VERIFIED_MISMATCH"
- System automatically creates support ticket
- Ticket priority assigned based on severity

#### Step 5: Auto-Ticket Creation

When mismatches are detected, the system:

**✅ Automatically Creates Ticket:**
- Unique ticket number (TKT-202410-001)
- Descriptive title with GRN and PO numbers
- Detailed description of all mismatches
- Priority assigned based on severity

**📊 Priority Assignment:**
- **🔴 URGENT**: Damage reported OR >100 units discrepancy
- **🟠 HIGH**: >50 units discrepancy
- **🟡 MEDIUM**: Standard quantity mismatches
- **🟢 LOW**: Excess items only

**📧 Automatic Notifications:**
- Email sent to vendor about discrepancies
- Accounts team alerted for resolution
- Operations team gets ticket assignment

#### Example Auto-Generated Ticket:

```
Ticket: TKT-202410-001
Title: GRN Mismatch - GRN-2024-001 (PO-2024-001)
Priority: HIGH
Status: OPEN

Description:
AUTOMATED TICKET: GRN Verification Mismatch Detected

GRN Details:
- GRN Number: GRN-2024-001
- PO Number: PO-2024-001
- Vendor: vendor@example.com
- Verified At: 2024-10-08T10:30:00Z

Mismatches Identified:
1. Organic Tomatoes:
   - Expected: 100
   - Received: 95
   - Discrepancy: -5
   - Status: QUANTITY_MISMATCH
   - Remarks: 5 units missing from shipment

Action Required:
- Vendor coordination for discrepancies
- Update inventory records if needed
- Consider credit note or adjustment invoice
- Document resolution for audit trail
```

### Ticket Management

#### Viewing Tickets
- Go to "Support" → "Tickets"
- Filter by status, priority, or assignment
- Click ticket number for details

#### Working with Tickets

**Update Status:**
```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
```

**Add Comments:**
- Document investigation steps
- Record vendor communications
- Note resolution actions taken

**Assign Ticket:**
- Assign to team member
- Add priority notes
- Set follow-up reminders

#### Resolution Process

1. **Investigation**
   - Contact vendor for clarification
   - Check dispatch records
   - Review transportation logs

2. **Vendor Coordination**
   - Send mismatch details to vendor
   - Request explanation or corrective action
   - Negotiate resolution (replacement, credit, etc.)

3. **Documentation**
   - Record all communications
   - Document agreed resolution
   - Update inventory records if needed

4. **Closure**
   - Mark ticket as resolved
   - Add final resolution notes
   - Close ticket after confirmation

---

## Troubleshooting

### Common Issues & Solutions

#### Order Creation Issues

**❌ "Price per unit is required"**
- **Cause**: Missing pricing for order items
- **Solution**: Ensure all items have pricePerUnit > 0
- **Prevention**: Double-check all items before submission

**❌ "Invalid email format"**
- **Cause**: Customer email not in valid format
- **Solution**: Use format like user@company.com
- **Prevention**: Validate email before entry

#### Invoice Upload Issues

**❌ "Invalid file type"**
- **Cause**: Unsupported file format
- **Solution**: Use PDF, JPEG, PNG, or DOC files only
- **Check**: File extension matches content type

**❌ "File too large"**
- **Cause**: File exceeds 10MB limit
- **Solution**: Compress or resize file
- **Alternative**: Split large documents

**❌ "You can only upload invoices for your own orders"**
- **Cause**: Vendor trying to upload for another vendor's PO
- **Solution**: Verify PO belongs to your vendor account
- **Contact**: Reach out to accounts team if error persists

#### GRN Verification Issues

**❌ "GRN already verified"**
- **Cause**: Attempting to verify already processed GRN
- **Solution**: Check GRN status before verification
- **Alternative**: Contact supervisor for re-verification if needed

**❌ "Invalid quantity values"**
- **Cause**: Received quantity less than 0 or impossible values
- **Solution**: Enter realistic quantity values
- **Double-check**: Physically count items again

### System Performance

#### Slow Loading
- **Check**: Internet connection stability
- **Clear**: Browser cache and cookies
- **Try**: Refresh page or restart browser
- **Contact**: IT support if issues persist

#### File Upload Delays
- **Normal**: Large files may take longer
- **Check**: File size and format
- **Retry**: After stable connection
- **Alternative**: Try smaller file sizes

### Getting Help

#### Contact Information
- **Technical Support**: support@kyari.com
- **Accounts Team**: accounts@kyari.com
- **Operations Team**: ops@kyari.com
- **System Admin**: admin@kyari.com

#### Escalation Process
1. **First**: Try troubleshooting steps above
2. **Second**: Contact your team lead
3. **Third**: Submit support ticket through system
4. **Emergency**: Call support hotline

---

## FAQ

### General Questions

**Q: What's new in the enhanced system?**
A: The system now requires mandatory pricing for all order items, has automated invoice generation, supports file uploads, and automatically creates tickets for GRN mismatches.

**Q: Who can access what features?**
A: Access is role-based. Vendors can only see/upload their own invoices, while accounts and operations teams have broader access.

**Q: Is training required for the new features?**
A: Basic training is recommended. This user guide covers all essential functions.

### Order Management

**Q: Why is pricing now mandatory?**
A: Mandatory pricing ensures accurate cost tracking, proper invoice generation, and better financial control.

**Q: Can I create an order without prices?**
A: No, the system requires pricePerUnit for all items. This ensures complete order information from the start.

**Q: What happens if I enter wrong pricing?**
A: You can update order items before vendor assignment. After assignment, changes require supervisor approval.

### Invoice System

**Q: Who can generate invoices?**
A: Only accounts team and admins can generate system invoices using the automated tool.

**Q: Can vendors edit generated invoices?**
A: No, vendors cannot edit system-generated invoices but can upload their own invoice files.

**Q: What file formats are supported for upload?**
A: PDF, JPEG, PNG, WebP, DOC, and DOCX files up to 10MB in size.

**Q: How long are invoices stored?**
A: All invoices are stored permanently in secure cloud storage for audit and compliance.

### GRN & Ticketing

**Q: What triggers automatic ticket creation?**
A: Any mismatch during GRN verification (quantity differences, damage, shortages) automatically creates a support ticket.

**Q: Can I modify auto-generated tickets?**
A: Yes, you can add comments, update status, assign to team members, and attach additional files.

**Q: How are ticket priorities determined?**
A: Priority is based on mismatch severity: damage or large discrepancies get URGENT/HIGH priority.

**Q: Who gets notified about tickets?**
A: Relevant vendors, accounts team, and operations staff receive automatic email notifications.

### Technical Questions

**Q: Is data secure?**
A: Yes, all data is encrypted, access is role-based, and we maintain comprehensive audit logs.

**Q: Can I access the system from mobile?**
A: The web interface is mobile-responsive, but full functionality is best on desktop/tablet.

**Q: What browsers are supported?**
A: Chrome, Firefox, Safari, and Edge (latest versions recommended).

**Q: Is there an API for integration?**
A: Yes, comprehensive REST API is available for system integration. Contact IT for API documentation.

---

This user guide provides comprehensive instructions for using all features of the enhanced invoice-driven order flow system. For additional support or feature requests, please contact your system administrator.