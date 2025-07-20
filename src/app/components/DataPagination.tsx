/**
 * DataPagination - Reusable pagination component for data lists
 * 
 * Usage example:
 * ```tsx
 * <DataPagination
 *   current={currentPage}
 *   total={totalItems}
 *   pageSize={pageSize}
 *   onChange={(page, size) => {
 *     setCurrentPage(page);
 *     setPageSize(size);
 *     loadData(page, size);
 *   }}
 *   itemName="conferences" // or "papers", "journals", etc.
 *   loading={loading}
 * />
 * ```
 * 
 * Features:
 * - Automatic hiding when total items <= pageSize
 * - Consistent styling across all pages
 * - Mobile responsive
 * - Loading state support
 * - Customizable item names
 * - All Ant Design Pagination props supported
 */

import React from 'react';
import { Pagination, Typography } from 'antd';
import type { PaginationProps } from 'antd';

const { Text } = Typography;

interface DataPaginationProps extends Omit<PaginationProps, 'onChange' | 'onShowSizeChange'> {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number, pageSize: number) => void;
  onShowSizeChange?: (current: number, size: number) => void;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean | ((total: number, range: [number, number]) => string);
  pageSizeOptions?: string[];
  itemName?: string; // e.g., "conferences", "papers", "journals"
  loading?: boolean;
}

const DataPagination: React.FC<DataPaginationProps> = ({
  current,
  total,
  pageSize,
  onChange,
  onShowSizeChange,
  showSizeChanger = true,
  showQuickJumper = true,
  showTotal = true,
  pageSizeOptions = ['10', '20', '50', '100'],
  itemName = 'items',
  loading = false,
  ...rest
}) => {
  const handleChange = (page: number, size: number) => {
    onChange(page, size);
  };

  const handleShowSizeChange = (current: number, size: number) => {
    if (onShowSizeChange) {
      onShowSizeChange(current, size);
    } else {
      // Default behavior: reset to page 1 when changing page size
      onChange(1, size);
    }
  };

  const defaultShowTotal = (total: number, range: [number, number]) => {
    return `${range[0]}-${range[1]} of ${total} ${itemName}`;
  };

  const getShowTotal = () => {
    if (showTotal === false) return undefined;
    if (typeof showTotal === 'function') return showTotal;
    return defaultShowTotal;
  };

  // Don't render if there are no items or only one page
  if (total === 0 || total <= pageSize) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      <Text type="secondary">
        Total {total.toLocaleString()} {itemName}
      </Text>
      
      <Pagination
        current={current}
        total={total}
        pageSize={pageSize}
        showSizeChanger={showSizeChanger}
        showQuickJumper={showQuickJumper}
        showTotal={getShowTotal()}
        pageSizeOptions={pageSizeOptions}
        onChange={handleChange}
        onShowSizeChange={handleShowSizeChange}
        disabled={loading}
        showLessItems={typeof window !== 'undefined' && window.innerWidth < 768} // Show fewer page numbers on mobile
        {...rest}
      />
    </div>
  );
};

export default DataPagination; 