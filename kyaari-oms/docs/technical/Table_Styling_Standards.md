# Table Styling Standards - Kyari OMS

## Overview
This document defines the consistent styling patterns for all tables across the Kyari OMS admin dashboard to ensure visual consistency and maintainability.

---

## 🎨 Table Container

### Desktop View
```tsx
// Container with rounded corners and background
<div className="hidden lg:block bg-header-bg rounded-xl overflow-hidden">
  // OR
<div className="hidden lg:block overflow-x-auto">
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
```

### Mobile View
```tsx
// Card-based layout for mobile
<div className="lg:hidden space-y-3">
  // Individual cards for each row
</div>
```

---

## 📊 Table Structure

### Complete Table with Pagination (Recommended Pattern)
```tsx
{/* Desktop Table Container - includes both table AND pagination */}
<div className="hidden lg:block bg-header-bg rounded-xl overflow-hidden">
  <table className="w-full border-separate border-spacing-0">
    <thead>
      {/* table header */}
    </thead>
    <tbody>
      {/* table body */}
    </tbody>
  </table>
  
  {/* Pagination attached to table - NOT in separate div */}
  {total > 0 && (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={total}
      startIndex={startIndex}
      endIndex={endIndex}
      onPageChange={setCurrentPage}
      variant="desktop"
    />
  )}
</div>

{/* Mobile Cards Container */}
<div className="lg:hidden space-y-3">
  {/* mobile cards */}
  
  {/* Mobile pagination */}
  <Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    totalItems={total}
    startIndex={startIndex}
    endIndex={endIndex}
    onPageChange={setCurrentPage}
    variant="mobile"
  />
</div>
```

### Base Table Options
```tsx
<table className="w-full border-separate border-spacing-0">
  // OR
<table className="w-full min-w-[800px]">
  // OR
<table className="min-w-full divide-y divide-gray-200">
```

**Key Properties:**
- `w-full` or `min-w-full` - Full width
- `border-separate border-spacing-0` - For custom borders
- `divide-y divide-gray-200` - Alternative divider approach
- `min-w-[800px]` - Minimum width for horizontal scroll on smaller screens

---

## 🏷️ Table Header (thead)

### Primary Style (Most Common)
```tsx
<thead>
  <tr className="" style={{ background: 'var(--color-accent)' }}>
    <th className="text-left p-3 font-heading font-normal" 
        style={{ color: 'var(--color-button-text)' }}>
      Header Text
    </th>
  </tr>
</thead>
```

### Alternative Style (AuditLogs)
```tsx
<thead style={{ backgroundColor: 'var(--color-accent)', 
                borderTopLeftRadius: '0.5rem', 
                borderTopRightRadius: '0.5rem' }} 
       className="rounded-t-lg">
  <tr>
    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
      HEADER TEXT
    </th>
  </tr>
</thead>
```

### Alternative Style 2 (Dashboard Tasks)
```tsx
<thead className="bg-[var(--color-accent)]">
  <tr>
    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--color-button-text)] uppercase tracking-wider">
      HEADER TEXT
    </th>
  </tr>
</thead>
```

**Header Cell Properties:**
- **Background:** `var(--color-accent)` (CSS variable)
- **Text Color:** `var(--color-button-text)` or `text-white`
- **Font:** `font-heading` (custom font family)
- **Font Weight:** `font-normal` or `font-medium`
- **Font Size:** `text-xs` (0.75rem / 12px) when uppercase
- **Text Transform:** `uppercase` (for alternative styles)
- **Letter Spacing:** `tracking-wider` (0.05em)
- **Text Align:** `text-left`
- **Padding:** 
  - Simple: `p-3` (0.75rem / 12px all sides)
  - Responsive: `px-4 sm:px-6 py-3` (horizontal: 1-1.5rem, vertical: 0.75rem)

---

## 📄 Table Body (tbody)

### Primary Style
```tsx
<tbody>
  <tr className="border-b border-gray-100 hover:bg-gray-50 bg-white">
    <td className="p-3">Cell Content</td>
  </tr>
</tbody>
```

### Alternative Style (AuditLogs)
```tsx
<tbody className="bg-white divide-y divide-gray-200">
  <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">
      Cell Content
    </td>
  </tr>
</tbody>
```

**Body Properties:**
- **Background:** `bg-white`
- **Row Dividers:** 
  - `border-b border-gray-100` (bottom border per row)
  - OR `divide-y divide-gray-200` (on tbody)
- **Hover State:** `hover:bg-gray-50`
- **Transition:** `transition-colors` (optional but recommended)

---

## 📝 Table Cells (td)

### Text Sizing & Colors
```tsx
// Primary text (Order Number, User Name, etc.)
<td className="p-3 font-semibold text-secondary">{content}</td>

// Regular text
<td className="p-3">{content}</td>
<td className="p-3 text-sm text-gray-900">{content}</td>

// Secondary/descriptive text
<td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{content}</td>

// Medium emphasis
<td className="p-3 text-sm font-medium text-secondary">{content}</td>
```

**Cell Properties:**
- **Padding:** 
  - Simple: `p-3` (0.75rem / 12px all sides)
  - Responsive: `px-4 sm:px-6 py-4` (horizontal: 1-1.5rem, vertical: 1rem)
- **Font Sizes:**
  - Default: base (1rem / 16px) - no class needed
  - Small: `text-sm` (0.875rem / 14px)
  - Extra Small: `text-xs` (0.75rem / 12px)
- **Font Weights:**
  - Normal: no class (400)
  - Medium: `font-medium` (500)
  - Semibold: `font-semibold` (600)
  - Bold: `font-bold` (700)
- **Text Colors:**
  - Primary: `text-secondary` (CSS variable - #1D4D43)
  - Dark: `text-gray-900` (#111827)
  - Medium: `text-gray-700` (#374151)
  - Light: `text-gray-600` (#4B5563)
  - Muted: `text-gray-500` (#6B7280)

---

## 🏷️ Status Badges

### Standard Badge Pattern
```tsx
<span 
  className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border"
  style={{
    backgroundColor: st.bg,
    color: st.color,
    borderColor: st.border,
  }}
>
  {st.label}
</span>
```

### Alternative Badge Patterns
```tsx
// Simple colored badge
<span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
  {role}
</span>

// Module/category badge
<span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
  {module}
</span>
```

**Badge Properties:**
- **Display:** `inline-block` or `inline-flex`
- **Padding:** `px-2` to `px-2.5` (horizontal), `py-1` (vertical)
- **Border Radius:** `rounded-full` (9999px)
- **Font Size:** `text-xs` (0.75rem / 12px)
- **Font Weight:** `font-semibold` (600) or `font-medium` (500)
- **Border:** `border` with dynamic color
- **Colors:** Dynamic via inline styles or Tailwind utility classes

---

## 🔘 Action Buttons in Tables

### Primary Action Button
```tsx
<button 
  className="bg-[var(--color-accent)] text-[var(--color-button-text)] rounded-md px-2.5 py-1.5 text-xs hover:brightness-95"
>
  View
</button>
```

### Secondary Action Buttons
```tsx
// Edit
<button 
  className="bg-blue-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-blue-600 flex items-center gap-1"
>
  <Edit size={12} />
  Edit
</button>

// Delete
<button 
  className="bg-red-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-red-600 flex items-center gap-1"
>
  <Trash2 size={12} />
</button>

// Assign/Other
<button 
  className="bg-purple-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-purple-600"
>
  Assign
</button>
```

### Button Container
```tsx
<div className="flex items-center gap-1.5">
  {/* Multiple action buttons */}
</div>
```

**Button Properties:**
- **Padding:** `px-2.5 py-1.5` (horizontal: 0.625rem, vertical: 0.375rem)
- **Border Radius:** `rounded-md` (0.375rem / 6px)
- **Font Size:** `text-xs` (0.75rem / 12px)
- **Icon Size:** `12px` (when using Lucide icons)
- **Gap between buttons:** `gap-1.5` (0.375rem / 6px)
- **Hover Effects:**
  - Color buttons: `hover:bg-{color}-600`
  - Accent button: `hover:brightness-95`

---

## 📱 Mobile Cards (Responsive Alternative)

### Card Container
```tsx
<div className="lg:hidden space-y-3">
  <div className="rounded-xl p-4 border border-gray-200 bg-white">
    {/* Card content */}
  </div>
</div>
```

### Card Structure
```tsx
<div className="rounded-xl p-4 border border-gray-200 bg-white">
  {/* Header Section */}
  <div className="flex items-start justify-between mb-3">
    <h3 className="font-semibold text-secondary text-lg">{title}</h3>
    <span className="badge">{status}</span>
  </div>
  
  {/* Info Grid */}
  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
    <div>
      <span className="text-gray-500 block">Label</span>
      <span className="font-medium">Value</span>
    </div>
  </div>
  
  {/* Actions */}
  <div className="flex flex-wrap gap-2">
    {/* Action buttons */}
  </div>
</div>
```

**Card Properties:**
- **Border Radius:** `rounded-xl` (0.75rem / 12px)
- **Padding:** `p-4` (1rem / 16px)
- **Border:** `border border-gray-200`
- **Background:** `bg-white`
- **Spacing between cards:** `space-y-3` (0.75rem / 12px)
- **Label Text:** `text-gray-500 text-sm`
- **Value Text:** `font-medium`

---

## 🔍 Expanded/Nested Tables

### Nested Table Structure
```tsx
{isExpanded && (
  <tr className="bg-gray-50">
    <td colSpan={8} className="p-0">
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="bg-white rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left p-3 text-sm font-semibold text-secondary">Header</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b border-gray-100">
                <td className="p-3 text-sm font-medium text-secondary">{content}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </td>
  </tr>
)}
```

**Nested Table Properties:**
- **Parent Row Background:** `bg-gray-50`
- **Nested Header Background:** `bg-gray-100`
- **Nested Cell Background:** Alternating `bg-white` and `bg-gray-50`
- **Font Size:** `text-sm` (smaller than parent table)
- **Border:** `border-b border-gray-200` (between nested header and body)

---

## 🔢 Pagination Component

### Reusable Pagination Component
We have a standardized `Pagination` component to ensure uniform pagination styling across all pages.

**Location:** `src/components/Pagination/Pagination.tsx`

### Important: Pagination Placement
⚠️ **The pagination MUST be attached directly to the table container, not in a separate div.**

**Correct Structure:**
```tsx
<div className="hidden lg:block bg-header-bg rounded-xl overflow-hidden">
  <table className="w-full border-separate border-spacing-0">
    {/* table content */}
  </table>
  <Pagination {...props} />
</div>
```

**Incorrect Structure (DO NOT USE):**
```tsx
<div className="hidden lg:block bg-header-bg rounded-xl overflow-hidden">
  <table className="w-full border-separate border-spacing-0">
    {/* table content */}
  </table>
</div>

{/* ❌ Separate div - WRONG! */}
<div className="mt-6 bg-white border border-secondary/20 rounded-xl">
  <Pagination {...props} />
</div>
```

### Usage

```tsx
import { Pagination } from '../../../components'

// Desktop pagination (inside table container)
<Pagination
  currentPage={page}
  totalPages={totalPages}
  totalItems={filteredItems.length}
  startIndex={startIndex}
  endIndex={endIndex}
  onPageChange={setPage}
  itemLabel="transactions" // optional: "orders", "vendors", etc.
  variant="desktop"
/>

// Mobile pagination (inside mobile card container)
<Pagination
  currentPage={page}
  totalPages={totalPages}
  totalItems={filteredItems.length}
  startIndex={startIndex}
  endIndex={endIndex}
  onPageChange={setPage}
  variant="mobile"
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `currentPage` | `number` | Current active page (1-indexed) |
| `totalPages` | `number` | Total number of pages |
| `totalItems` | `number` | Total number of items in the filtered dataset |
| `startIndex` | `number` | 0-indexed start position of current page items |
| `endIndex` | `number` | 0-indexed end position of current page items |
| `onPageChange` | `(page: number) => void` | Callback when page changes |
| `itemLabel` | `string` (optional) | Label for items (e.g., "transactions", "orders") |
| `variant` | `'desktop' \| 'mobile'` | Display variant (default: 'desktop') |

### Styling Properties

**Desktop Variant:**
- Container: `flex items-center justify-between px-3 md:px-4 lg:px-6 py-3 bg-white border-t border-gray-100`
- Info text: `text-xs text-gray-500`
- Navigation buttons: `h-7 w-7 md:h-8 md:w-8` with SVG arrows
- Page buttons: `min-w-7 h-7 md:min-w-8 md:h-8 px-1.5 md:px-2`
- Active page: `bg-[var(--color-accent)] text-white border-[var(--color-accent)]`
- Inactive page: `border-gray-200 text-gray-700 bg-white hover:bg-gray-50`
- Hover effects: `hover:bg-gray-50 transition-colors`

**Mobile Variant:**
- Container: `flex items-center justify-between px-1 py-2`
- Info text: `text-xs text-gray-500`
- Navigation buttons: `h-8 px-3` with text "Prev" and "Next"
- Font: `text-sm font-medium`

### Benefits
- **Consistency:** Uniform pagination styling across all pages
- **Maintainability:** Single source of truth for pagination logic
- **Accessibility:** Proper ARIA labels and disabled states
- **Responsive:** Separate mobile and desktop variants
- **Theming:** Uses CSS variables for accent color

### Migration Example

**Before:**
```tsx
<div className="flex items-center justify-between px-3 md:px-4 lg:px-6 py-3 bg-white border-t border-gray-100">
  <div className="text-xs text-gray-500">Showing {startIndex + 1}-{endIndex} of {total}</div>
  <div className="flex items-center gap-1 md:gap-2">
    <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>...</button>
    {/* page buttons */}
    <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>...</button>
  </div>
</div>
```

**After:**
```tsx
<Pagination
  currentPage={page}
  totalPages={totalPages}
  totalItems={filteredItems.length}
  startIndex={startIndex}
  endIndex={endIndex}
  onPageChange={setPage}
  variant="desktop"
/>
```

---

## 🎯 Loading & Empty States

### Loading State
```tsx
<div className="bg-white rounded-xl p-12 text-center">
  <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
  <p className="text-gray-500">Loading orders...</p>
</div>
```

### Empty State
```tsx
<tr>
  <td colSpan={8} className="p-6 text-center text-gray-500">
    No orders found. Create your first order to get started!
  </td>
</tr>
```

**Properties:**
- **Padding:** `p-6` to `p-12` (1.5rem - 3rem)
- **Text Alignment:** `text-center`
- **Text Color:** `text-gray-500`
- **Spinner:** `w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin`

---

## 📐 Spacing & Layout

### Consistent Spacing Values
- **Table Cell Padding:** `p-3` (0.75rem / 12px)
- **Responsive Cell Padding:** `px-4 sm:px-6 py-3` to `py-4`
- **Button Gap:** `gap-1.5` to `gap-2` (0.375rem - 0.5rem)
- **Card Spacing:** `space-y-3` (0.75rem)
- **Section Margins:** `mb-4` to `mb-6` (1rem - 1.5rem)

### Border Styles
- **Table Container:** `border border-gray-200`
- **Table Rows:** `border-b border-gray-100` or `divide-y divide-gray-200`
- **Nested Content:** `border-t border-gray-200`

### Rounded Corners
- **Table Container:** `rounded-xl` (0.75rem / 12px) or `rounded-lg` (0.5rem / 8px)
- **Buttons:** `rounded-md` (0.375rem / 6px)
- **Badges:** `rounded-full` (9999px)
- **Cards:** `rounded-xl` (0.75rem / 12px)

---

## 🎨 CSS Variables Used

```css
--color-accent: /* Primary accent color (typically #C3754C) */
--color-button-text: /* Button text color (typically #F5F3E7) */
--color-secondary: /* Secondary text color (typically #1D4D43) */
--color-heading: /* Heading color */
--font-heading: /* Heading font family */
--color-sharktank-bg: /* Page background */
--color-happyplant-bg: /* Card background */
```

---

## ✅ Checklist for New Tables

When creating a new table, ensure:

- [ ] Desktop table uses `hidden lg:block`
- [ ] Mobile cards use `lg:hidden`
- [ ] Header uses `var(--color-accent)` background
- [ ] Header text uses `var(--color-button-text)` or `text-white`
- [ ] Header font size is `text-xs` with `uppercase tracking-wider` OR normal with `font-heading`
- [ ] Body rows have `hover:bg-gray-50`
- [ ] Cell padding is consistent (`p-3` or responsive variant)
- [ ] Status badges use `rounded-full text-xs font-semibold`
- [ ] Action buttons use `text-xs px-2.5 py-1.5 rounded-md`
- [ ] Icons in buttons are `size={12}`
- [ ] **Pagination uses the `<Pagination>` component** (both desktop and mobile variants)
- [ ] **Pagination is inside the table container, NOT in a separate div**
- [ ] Pagination active button uses `var(--color-accent)` background
- [ ] Loading and empty states are implemented
- [ ] Table has proper overflow handling (`overflow-hidden` or `overflow-x-auto`)
- [ ] Border radius is consistent (`rounded-xl` for containers)
- [ ] Text colors follow hierarchy (gray-900 > gray-700 > gray-600 > gray-500)

---

## 📋 Quick Reference Table

| Element | Class Pattern | Font Size | Padding | Color |
|---------|--------------|-----------|---------|-------|
| **Table Header** | `text-xs uppercase tracking-wider` | 12px | `p-3` or `px-4 py-3` | `var(--color-button-text)` |
| **Body Cell** | `text-sm` or default | 14px or 16px | `p-3` or `px-4 py-4` | `text-gray-900` |
| **Primary Text** | `font-semibold text-secondary` | 16px | `p-3` | `var(--color-secondary)` |
| **Status Badge** | `text-xs font-semibold rounded-full` | 12px | `px-2.5 py-1` | Dynamic |
| **Action Button** | `text-xs rounded-md` | 12px | `px-2.5 py-1.5` | Various |
| **Card Title** | `font-semibold text-secondary text-lg` | 18px | - | `var(--color-secondary)` |
| **Card Label** | `text-gray-500 text-sm` | 14px | - | `#6B7280` |
| **Pagination (Active)** | `text-xs md:text-sm` | 12-14px | `px-1.5 md:px-2` | `var(--color-accent)` |
| **Pagination (Inactive)** | `text-xs md:text-sm` | 12-14px | `px-1.5 md:px-2` | `text-gray-700` |

---

## 🔗 Related Files

- `/src/components/Pagination/Pagination.tsx` - Reusable pagination component
- `/src/dashboards/admin/pages/Orders.tsx` - Reference implementation
- `/src/dashboards/admin/pages/MoneyFlow.tsx` - Pagination component example
- `/src/dashboards/admin/pages/AuditLogs.tsx` - Alternative styling
- `/src/dashboards/admin/pages/Dashboard.tsx` - Simple table example
- `/src/components/ui/export-button.tsx` - Reusable export component

---

**Last Updated:** October 14, 2025  
**Version:** 1.0  
**Maintainer:** Development Team
