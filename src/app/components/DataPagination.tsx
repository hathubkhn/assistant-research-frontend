import React from 'react';
import { Pagination, Space, Typography } from 'antd';

const { Text } = Typography;

interface DataPaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number, pageSize: number) => void;
  onShowSizeChange?: (current: number, size: number) => void;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean | ((total: number, range: [number, number]) => string);
  pageSizeOptions?: string[];
  itemName?: string;
  loading?: boolean;
  size?: 'default' | 'small';
  simple?: boolean;
  hideOnSinglePage?: boolean;
  disabled?: boolean;
  responsive?: boolean;
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
  size = 'default',
  simple = false,
  hideOnSinglePage = false,
  disabled = false,
  responsive = true,
  ...rest
}) => {
  const handleChange = (page: number, size: number) => {
    onChange(page, size);
  };

  const handleShowSizeChange = (current: number, size: number) => {
    if (onShowSizeChange) {
      onShowSizeChange(current, size);
    } else {
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

  if (total === 0 || (hideOnSinglePage && total <= pageSize)) {
    return null;
  }

  return (
    <Space 
      direction='vertical' 
      size='middle' 
      style={{ 
        width: '100%', 
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >      
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
        disabled={loading || disabled}
        size={size}
        simple={simple}
        responsive={responsive}
        showLessItems={responsive && typeof window !== 'undefined' && window.innerWidth < 768}
        {...rest}
      />
    </Space>
  );
};

export default DataPagination; 