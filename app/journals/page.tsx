"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Table, Input, Tag, Space, Button, Select, Card, Row, Col } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";

const { Search } = Input;

interface Journal {
  id: string;
  name: string;
  abbreviation: string;
  impactFactor: number;
  quartile: string;
  publisher: string;
  url: string;
  papersCount: number;
}

// Impact factor range type
interface ImpactRange {
  min: number;
  max: number | null;
  label: string;
}

export default function JournalsPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Filter state
  const [quartileFilter, setQuartileFilter] = useState<string>("");
  const [impactFilter, setImpactFilter] = useState<string>("");

  // Define impact factor ranges
  const impactRanges: ImpactRange[] = [
    { min: 0, max: 3, label: "0~3" },
    { min: 3, max: 5, label: "3~5" },
    { min: 5, max: 7, label: "5~7" },
    { min: 7, max: null, label: "7+" },
  ];

  const fetchJournals = async (
    page: number = 1,
    size: number = pageSize,
    quartileValue: string = quartileFilter,
    impactValue: string = impactFilter,
    searchValue: string = searchQuery
  ) => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Build query parameters
      let queryParams = `page=${page}&pageSize=${size}`;

      if (quartileValue) {
        queryParams += `&quartile=${encodeURIComponent(quartileValue)}`;
      }

      if (impactValue) {
        const selectedRange = impactRanges.find(
          (range) => range.label === impactValue
        );
        if (selectedRange) {
          queryParams += `&impactMin=${selectedRange.min}`;
          if (selectedRange.max !== null) {
            queryParams += `&impactMax=${selectedRange.max}`;
          }
        }
      }

      if (searchValue) {
        queryParams += `&search=${encodeURIComponent(searchValue)}`;
      }

      const response = await fetch(`${apiUrl}/api/journals/?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setJournals(data.results);
        setTotalItems(data.pagination.totalItems);
        setCurrentPage(data.pagination.page);
      }
    } catch (error) {
      console.error("Error fetching journals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals(1, pageSize, quartileFilter, impactFilter, searchQuery);
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    fetchJournals(1, pageSize, quartileFilter, impactFilter, value);
  };

  const handleQuartileChange = (quartile: string) => {
    const newQuartile = quartileFilter === quartile ? "" : quartile;
    setQuartileFilter(newQuartile);
    setCurrentPage(1);
    fetchJournals(1, pageSize, newQuartile, impactFilter, searchQuery);
  };

  const handleImpactChange = (impact: string) => {
    const newImpact = impactFilter === impact ? "" : impact;
    setImpactFilter(newImpact);
    setCurrentPage(1);
    fetchJournals(1, pageSize, quartileFilter, newImpact, searchQuery);
  };

  const clearFilters = () => {
    setQuartileFilter("");
    setImpactFilter("");
    setSearchQuery("");
    setCurrentPage(1);
    fetchJournals(1, pageSize, "", "", "");
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    const page = pagination.current || 1;
    const size = pagination.pageSize || 20;
    setCurrentPage(page);
    setPageSize(size);
    fetchJournals(page, size, quartileFilter, impactFilter, searchQuery);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getQuartileColor = (quartile: string) => {
    const colors: Record<string, string> = {
      Q1: "green",
      Q2: "blue",
      Q3: "orange",
      Q4: "red",
    };
    return colors[quartile] || "default";
  };

  const columns: ColumnsType<Journal> = [
    {
      title: "Journal",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Journal) => (
        <Link
          href={`/journals/${record.id}`}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {text}
        </Link>
      ),
    },
    {
      title: "Abbreviation",
      dataIndex: "abbreviation",
      key: "abbreviation",
      width: 150,
    },
    {
      title: "Impact Factor",
      dataIndex: "impactFactor",
      key: "impactFactor",
      width: 150,
      render: (value: number) => (value ? value.toFixed(2) : "N/A"),
      sorter: (a: Journal, b: Journal) =>
        (a.impactFactor || 0) - (b.impactFactor || 0),
    },
    {
      title: "Quartile",
      dataIndex: "quartile",
      key: "quartile",
      width: 120,
      render: (quartile: string) => (
        <Tag color={getQuartileColor(quartile)}>{quartile || "N/A"}</Tag>
      ),
    },
    {
      title: "Papers",
      dataIndex: "papersCount",
      key: "papersCount",
      width: 100,
      sorter: (a: Journal, b: Journal) => a.papersCount - b.papersCount,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Academic Journals
      </h1>

      <Card className="mb-6">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Search Bar */}
          <Search
            placeholder="Search journals..."
            allowClear
            size="large"
            onSearch={handleSearch}
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
            prefix={<SearchOutlined />}
            enterButton="Search"
          />

          {/* Filters */}
          <div>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div>
                <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                  <FilterOutlined className="mr-2" />
                  Filter by Quartile:
                </h3>
                <Space wrap>
                  {["Q1", "Q2", "Q3", "Q4"].map((quartile) => (
                    <Tag.CheckableTag
                      key={quartile}
                      checked={quartileFilter === quartile}
                      onChange={() => handleQuartileChange(quartile)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "14px",
                      }}
                    >
                      {quartile}
                    </Tag.CheckableTag>
                  ))}
                </Space>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                  <FilterOutlined className="mr-2" />
                  Filter by Impact Factor:
                </h3>
                <Space wrap>
                  {impactRanges.map((range) => (
                    <Tag.CheckableTag
                      key={range.label}
                      checked={impactFilter === range.label}
                      onChange={() => handleImpactChange(range.label)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "14px",
                      }}
                    >
                      {range.label}
                    </Tag.CheckableTag>
                  ))}
                  {(quartileFilter || impactFilter || searchQuery) && (
                    <Button
                      type="link"
                      icon={<ClearOutlined />}
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  )}
                </Space>
              </div>
            </Space>
          </div>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={journals}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalItems,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} journals`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: (
              <div className="py-8">
                <p className="text-lg text-gray-600 mb-4">
                  No journals found matching your criteria.
                </p>
                {(quartileFilter || impactFilter || searchQuery) && (
                  <Button type="primary" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
}
