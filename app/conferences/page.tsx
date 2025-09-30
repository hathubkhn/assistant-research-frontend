"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Table, Input, Tag, Space, Button, Card } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";

const { Search } = Input;

interface Conference {
  id: string;
  name: string;
  abbreviation: string;
  rank: string;
  location: string;
  url: string;
  papersCount: number;
}

export default function ConferencesPage() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Filter state
  const [rankFilter, setRankFilter] = useState<string>("");

  const fetchConferences = async (
    page: number = 1,
    size: number = pageSize
  ) => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Build query parameters
      let queryParams = `page=${page}&pageSize=${size}`;

      if (rankFilter) {
        if (rankFilter === "Not ranked") {
          queryParams += "&rank=null";
        } else {
          queryParams += `&rank=${encodeURIComponent(rankFilter)}`;
        }
      }

      if (searchQuery) {
        queryParams += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(`${apiUrl}/api/conferences/?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setConferences(data.results);
        setTotalItems(data.pagination.totalItems);
        setCurrentPage(data.pagination.page);
      }
    } catch (error) {
      console.error("Error fetching conferences:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConferences(1);
  }, [rankFilter, searchQuery]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleRankChange = (rank: string) => {
    const newRank = rankFilter === rank ? "" : rank;
    setRankFilter(newRank);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setRankFilter("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    const page = pagination.current || 1;
    const size = pagination.pageSize || 20;
    setCurrentPage(page);
    setPageSize(size);
    fetchConferences(page, size);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      "A*": "purple",
      A: "green",
      B: "blue",
      C: "orange",
    };
    return colors[rank] || "default";
  };

  const columns: ColumnsType<Conference> = [
    {
      title: "Conference",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Conference) => (
        <Link
          href={`/conferences/${record.id}`}
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
      title: "Rank",
      dataIndex: "rank",
      key: "rank",
      width: 120,
      render: (rank: string) => (
        <Tag
          color={getRankColor(rank)}
          icon={rank === "A*" ? <TrophyOutlined /> : undefined}
        >
          {rank || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      width: 200,
      render: (location: string) => location || "N/A",
    },
    {
      title: "Papers",
      dataIndex: "papersCount",
      key: "papersCount",
      width: 100,
      sorter: (a: Conference, b: Conference) => a.papersCount - b.papersCount,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Academic Conferences
      </h1>

      <Card className="mb-6">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Search Bar */}
          <Search
            placeholder="Search conferences..."
            allowClear
            size="large"
            onSearch={handleSearch}
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
            prefix={<SearchOutlined />}
            enterButton="Search"
          />

          {/* Rank Filter */}
          <div>
            <h3 className="font-medium text-gray-700 mb-2 flex items-center">
              <FilterOutlined className="mr-2" />
              Filter by Rank:
            </h3>
            <Space wrap>
              {["A*", "A", "B", "C", "Not ranked"].map((rank) => (
                <Tag.CheckableTag
                  key={rank}
                  checked={rankFilter === rank}
                  onChange={() => handleRankChange(rank)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "16px",
                    fontSize: "14px",
                  }}
                >
                  {rank}
                </Tag.CheckableTag>
              ))}
              {(rankFilter || searchQuery) && (
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
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={conferences}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalItems,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} conferences`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: (
              <div className="py-8">
                <p className="text-lg text-gray-600 mb-4">
                  No conferences found matching your criteria.
                </p>
                {(rankFilter || searchQuery) && (
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
