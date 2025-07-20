"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/utils/useTranslation";
import axios from 'axios';
import {
  BarChart, Bar, XAxis,
  YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from "recharts";
import { Button, Card, Col, Row, Space, Typography, Select, DatePicker, Tag } from "antd";
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

const COLORS = ['#d9363e', '#ff474c', '#f87171', '#fca5a5', '#ef4444', '#b91c1c', '#dc2626', '#991b1b', '#7f1d1d', '#f43f5e'];
const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface DashboardData {
  paper_count: number;
  dataset_count: number;
  paper_count_detail: Array<{
    count: number;
    period: {
      start: string;
      end: string;
    };
  }>;
  papers_per_task: Array<{
    id: string;
    name: string;
    filtered_paper_count: number;
  }>;
  papers_per_dataset: Array<{
    id: string;
    name: string;
    filtered_paper_count: number;
  }>;
  trending_tasks: Array<{
    id: string;
    name: string;
  }>;
}

interface Task {
  id: string;
  name: string;
  title?: string;
}

interface Paper {
  id: string;
  title: string;
  authors: string[];
  publication: string;
  year: number;
  abstract: string;
  tasks: Task[];
  citations: number;
  isInteresting: boolean;
}

interface FetchDashboardParams {
  startDate: string;
  endDate: string;
  period: string;
}

interface FetchFilteredPapersParams {
  startDate: string;
  endDate: string;
  taskIds?: string[];
}

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getDefaultStartDate = (): string => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return formatDate(thirtyDaysAgo);
};

const getDefaultEndDate = (): string => {
  return formatDate(new Date());
};

// Add debounce utility
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// API Functions
const fetchDashboardData = async (params: FetchDashboardParams): Promise<DashboardData> => {
  const { startDate, endDate, period } = params;

  try {
    const response = await axios.get(
      `${API_URL}/api/dashboard/?startDate=${startDate}&endDate=${endDate}&period=${period}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(`Error fetching dashboard data: ${error.response?.status} ${error.response?.statusText || error.message}`);
  }
};

const fetchTasksList = async (): Promise<Task[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/tasks/`);
    return response.data.results || response.data || [];
  } catch (error: any) {
    throw new Error(`Error fetching tasks: ${error.response?.status} ${error.response?.statusText || error.message}`);
  }
};

const fetchFilteredPapers = async (params: FetchFilteredPapersParams): Promise<Paper[]> => {
  const { startDate, endDate, taskIds = [] } = params;

  try {
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
      ...(taskIds.length > 0 && { tasks: taskIds.join(',') })
    });

    const response = await axios.get(`${API_URL}/api/papers/?${queryParams}`);
    return response.data?.results || [];
  } catch (error: any) {
    throw new Error(`Error fetching filtered papers: ${error.response?.status} ${error.response?.statusText || error.message}`);
  }
};



export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation('dashboard');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [period, setPeriod] = useState('daily');

  const [paperCountDetail, setPaperCountDetail] = useState<any[]>([]);
  const [papersPerDataset, setPapersPerDataset] = useState<any[]>([]);
  const [papersPerTask, setPapersPerTask] = useState<any[]>([]);
  const [trendingTasks, setTrendingTasks] = useState<any[]>([]);

  const [isLoadingPaperChart, setIsLoadingPaperChart] = useState(true);
  const [isLoadingTaskChart, setIsLoadingTaskChart] = useState(true);
  const [isLoadingDatasetChart, setIsLoadingDatasetChart] = useState(true);
  const [isLoadingTrendingTasks, setIsLoadingTrendingTasks] = useState(true);
  const [isLoadingSummaryStats, setIsLoadingSummaryStats] = useState(true);
  const [isLoadingPapersList, setIsLoadingPapersList] = useState(true);
  const [isLoadingTasksList, setIsLoadingTasksList] = useState(true);

  const [summaryStats, setSummaryStats] = useState({
    paperCount: 0,
    datasetCount: 0
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [papersPerPage, setPapersPerPage] = useState(5);



  const loadDashboardData = async () => {
    setIsLoadingSummaryStats(true);
    setIsLoadingPaperChart(true);
    setIsLoadingTaskChart(true);
    setIsLoadingDatasetChart(true);
    setIsLoadingTrendingTasks(true);

    try {
      const data = await fetchDashboardData({ startDate, endDate, period });

      try {
        setSummaryStats({
          paperCount: data.paper_count || 0,
          datasetCount: data.dataset_count || 0
        });
        setIsLoadingSummaryStats(false);
      } catch (error) {
        console.error("Error processing summary stats:", error);
        setIsLoadingSummaryStats(false);
      }

      try {
        const transformedData = (data.paper_count_detail || []).map((item: any, index: number) => {
          let formattedPeriod = '';

          if (item.period && item.period.start) {
            const formatters = {
              daily: (v: { start: string, end: string }) => {
                const date = new Date(v.start);
                return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
              },
              weekly: (v: { start: string, end: string }) => {
                const startDate = new Date(v.start);
                const endDate = new Date(v.end);
                const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
                const endFormatted = endDate.getDate().toString().padStart(2, '0');
                return `${startFormatted}-${endFormatted}`;
              },
              monthly: (v: { start: string, end: string }) => {
                const date = new Date(v.start);
                return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
              },
              yearly: (v: { start: string, end: string }) => {
                return v.start.split('-')[0];
              }
            };

            try {
              const formatter = formatters[period as keyof typeof formatters];
              formattedPeriod = formatter ? formatter(item.period) : item.period.start;
            } catch (error) {
              console.error('Error formatting period:', error, item.period);
              formattedPeriod = item.period.start;
            }
          } else {
            formattedPeriod = `Period ${index + 1}`;
          }

          return {
            ...item,
            periodDisplay: formattedPeriod,
            periodIndex: index,
            originalPeriod: item.period
          };
        });

        setPaperCountDetail(transformedData);
        setIsLoadingPaperChart(false);
      } catch (error) {
        console.error("Error processing paper count data:", error);
        setIsLoadingPaperChart(false);
      }

      try {
        setPapersPerTask(data.papers_per_task || []);
        setIsLoadingTaskChart(false);
      } catch (error) {
        console.error("Error processing tasks chart data:", error);
        setIsLoadingTaskChart(false);
      }

      try {
        setPapersPerDataset(data.papers_per_dataset || []);
        setIsLoadingDatasetChart(false);
      } catch (error) {
        console.error("Error processing datasets chart data:", error);
        setIsLoadingDatasetChart(false);
      }

      try {
        setTrendingTasks(data.trending_tasks || []);
        setIsLoadingTrendingTasks(false);
      } catch (error) {
        console.error("Error processing trending tasks:", error);
        setIsLoadingTrendingTasks(false);
      }
    } catch (error: any) {
      console.error(error.message);
      setIsLoadingSummaryStats(false);
      setIsLoadingPaperChart(false);
      setIsLoadingTaskChart(false);
      setIsLoadingDatasetChart(false);
      setIsLoadingTrendingTasks(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [startDate, endDate, period]);

  const loadTasksList = async () => {
    try {
      setIsLoadingTasksList(true);
      const tasksData = await fetchTasksList();
      setTasks(tasksData);
    } catch (error: any) {
      console.error(error.message);
      setTasks([]);
    } finally {
      setIsLoadingTasksList(false);
    }
  };

  useEffect(() => {
    loadTasksList();
    loadFilteredPapers([]);
  }, []);

  const loadFilteredPapers = async (taskIds: string[] = []) => {
    try {
      setIsLoadingPapersList(true);
      const papersData = await fetchFilteredPapers({
        startDate,
        endDate,
        taskIds
      });
      setPapers(papersData);
      setFilteredPapers(papersData);
    } catch (error: any) {
      console.error(error.message);
      setPapers([]);
      setFilteredPapers([]);
    } finally {
      setIsLoadingPapersList(false);
    }
  };

  const debouncedTaskFilter = useCallback(
    debounce((taskIds: string[]) => {
      loadFilteredPapers(taskIds);
    }, 300),
    [startDate, endDate]
  );

  useEffect(() => {
    debouncedTaskFilter(selectedTasks);
  }, [selectedTasks, debouncedTaskFilter]);

  const createSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
      .trim();                  // Trim whitespace
  };

  const viewPaperDetails = (paperId: string) => {
    const paper = filteredPapers.find(p => p.id === paperId);
    if (paper) {
      router.push(`/papers/${createSlug(paper.title)}`);
    }
  };

  const taskChartData = papersPerTask.slice(0, 5).map((item, index) => ({
    id: item.id,
    name: item.name,
    count: item.filtered_paper_count || 0,
    fill: COLORS[index % COLORS.length]
  }));

  const datasetChartData = papersPerDataset.slice(0, 5).map((item, index) => ({
    id: item.id,
    name: item.name,
    count: item.filtered_paper_count || 0,
    fill: COLORS[index % COLORS.length]
  }));

  const indexOfLastPaper = currentPage * papersPerPage;
  const indexOfFirstPaper = indexOfLastPaper - papersPerPage;
  const currentPapers = filteredPapers.slice(indexOfFirstPaper, indexOfLastPaper);
  const totalPages = Math.ceil(filteredPapers.length / papersPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card title={t('dateFilters.title')} style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Date Range:</Text>
              <DatePicker.RangePicker
                value={[
                  startDate ? dayjs(startDate) : null,
                  endDate ? dayjs(endDate) : null
                ]}
                onChange={(dates) => {
                  if (dates) {
                    setStartDate(dates[0] ? dates[0].format('YYYY-MM-DD') : getDefaultStartDate());
                    setEndDate(dates[1] ? dates[1].format('YYYY-MM-DD') : getDefaultEndDate());
                  } else {
                    setStartDate(getDefaultStartDate());
                    setEndDate(getDefaultEndDate());
                  }
                }}
                style={{ width: '100%' }}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t('dateFilters.viewBy')}</Text>
              <Select
                value={period}
                onChange={(value) => setPeriod(value)}
                style={{ width: '100%' }}
              >
                <Select.Option value="daily">{t('dateFilters.periods.daily')}</Select.Option>
                <Select.Option value="monthly">{t('dateFilters.periods.monthly')}</Select.Option>
                <Select.Option value="yearly">{t('dateFilters.periods.yearly')}</Select.Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ height: '22px' }}></div>
              <Button
                type="primary"
                onClick={() => {
                  setStartDate(getDefaultStartDate());
                  setEndDate(getDefaultEndDate());
                }}
                style={{ width: '100%' }}
              >
                {t('dateFilters.resetDates')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card>
            <Typography.Title level={4} style={{ color: '#6B7280', marginBottom: '8px' }}>
              {t('stats.totalPapers')}
            </Typography.Title>
            <Typography.Text style={{ fontSize: '30px', fontWeight: 'bold', color: '#d9363e' }}>
              {summaryStats.paperCount.toLocaleString()}
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Typography.Title level={4} style={{ color: '#6B7280', marginBottom: '8px' }}>
              {t('stats.totalDatasets')}
            </Typography.Title>
            <Typography.Text style={{ fontSize: '30px', fontWeight: 'bold', color: '#52c41a' }}>
              {summaryStats.datasetCount.toLocaleString()}
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={t('charts.papersByMonth')}>
            {isLoadingPaperChart ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text>{t('charts.loading')}</Text>
              </div>
            ) : (
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paperCountDetail}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="periodDisplay"
                      tick={{ fontSize: 12, textAnchor: 'end', dy: 10 }}
                      height={60}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#d9363e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={t('charts.topTasks')}>
            {isLoadingTaskChart ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text>{t('charts.loading')}</Text>
              </div>
            ) : (
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      domain={[0, 'dataMax']}
                      tickCount={6}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value) => [Math.floor(Number(value)), t('charts.count')]} />
                    <Legend />
                    <Bar dataKey="count" name={t('charts.count')}>
                      {taskChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t('charts.topDatasets')}>
            {isLoadingDatasetChart ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text>{t('charts.loading')}</Text>
              </div>
            ) : (
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datasetChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      domain={[0, 'dataMax']}
                      tickCount={6}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value) => [Math.floor(Number(value)), t('charts.count')]} />
                    <Legend />
                    <Bar dataKey="count" name={t('charts.count')}>
                      {datasetChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {trendingTasks.length > 0 && (
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card title={t('charts.trendingTasks')}>
              <Space wrap size="middle">
                {trendingTasks.map((task, index) => (
                  <Tag key={task.id} color="volcano" style={{ fontSize: '14px', padding: '4px 12px' }}>
                    {task.name}
                  </Tag>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title={t('papers.filterByTasks')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                mode="multiple"
                allowClear
                showSearch
                placeholder={t('papers.selectTasks') || 'Select tasks to filter...'}
                value={selectedTasks}
                onChange={setSelectedTasks}
                style={{ width: '100%' }}
                maxTagCount={3}
                maxTagTextLength={20}
                loading={isLoadingTasksList}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={tasks.map(task => ({
                  value: task.id,
                  label: task.name || task.title
                }))}
                notFoundContent={isLoadingTasksList ? 'Loading...' : 'No tasks found'}
              />

              {selectedTasks.length > 0 && (
                <Space size="small" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
                  </Text>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setSelectedTasks([])}
                    style={{ padding: 0, fontSize: '12px', height: 'auto' }}
                  >
                    Clear all
                  </Button>
                </Space>
              )}

              {isLoadingPapersList && selectedTasks.length > 0 && (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Filtering papers...
                  </Text>
                </div>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title={`${t('papers.researchPapers')} (${filteredPapers.length})`}>
            {filteredPapers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">
                  {papers.length === 0
                    ? t('papers.noPapers')
                    : t('papers.noMatch')}
                </Text>
              </div>
            ) : (
              <div>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {currentPapers.map(paper => (
                    <Card
                      key={paper.id}
                      hoverable
                      style={{ cursor: 'pointer' }}
                      onClick={() => viewPaperDetails(paper.id)}
                    >
                      <Typography.Title
                        level={4}
                        style={{
                          margin: 0,
                          color: '#1890ff',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: 600
                        }}
                      >
                        {paper.title}
                      </Typography.Title>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        {paper.authors.join(", ")} • {paper.publication} • {paper.year}
                      </Text>
                      <Paragraph style={{ marginTop: '8px', color: '#333' }}>
                        {paper.abstract}
                      </Paragraph>

                      <div style={{ marginTop: '12px' }}>
                        <Space wrap size="small">
                          {paper.tasks?.map((task: any, idx: number) => (
                            <Tag key={`${paper.id}-task-${idx}`} color="blue">
                              {task.name || task.title}
                            </Tag>
                          )) || []}
                        </Space>
                      </div>

                      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary" style={{ fontSize: '14px' }}>
                          {t('papers.citations')}: {paper.citations}
                        </Text>
                        <Button
                          type="link"
                          href={paper.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ padding: 0, fontSize: '14px' }}
                        >
                          <svg style={{ width: '16px', height: '16px', marginRight: '4px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                          </svg>
                          {t('papers.download')}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </Space>

                {filteredPapers.length > 0 && (
                  <Card style={{ marginTop: '24px' }}>
                    <Row justify="space-between" align="middle" gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Space align="center">
                          <Text>{t('pagination.show')}:</Text>
                          <Select
                            value={papersPerPage}
                            onChange={(value) => {
                              setPapersPerPage(value);
                              setCurrentPage(1);
                            }}
                            size="small"
                            style={{ width: 80 }}
                          >
                            <Select.Option value={5}>5</Select.Option>
                            <Select.Option value={10}>10</Select.Option>
                            <Select.Option value={20}>20</Select.Option>
                            <Select.Option value={50}>50</Select.Option>
                          </Select>
                          <Text>{t('pagination.perPage')}</Text>
                        </Space>
                      </Col>

                      <Col xs={24} md={12}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <Text style={{ marginRight: '16px' }}>
                            {t('pagination.page')} <Text strong>{currentPage}</Text> {t('pagination.of')}{' '}
                            <Text strong>{totalPages}</Text>{' '}
                            ({filteredPapers.length} {t('pagination.results')})
                          </Text>

                          <Space>
                            <Button
                              onClick={() => paginate(1)}
                              disabled={currentPage === 1}
                              size="small"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                                <path fillRule="evenodd" d="M15.79 14.77a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L11.832 10l3.938 3.71a.75.75 0 01.02 1.06zm-6 0a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L5.832 10l3.938 3.71a.75.75 0 01.02 1.06z" clipRule="evenodd" />
                              </svg>
                            </Button>
                            <Button
                              onClick={() => paginate(currentPage - 1)}
                              disabled={currentPage === 1}
                              size="small"
                            >
                              <svg style={{ width: '20px', height: '20px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </Button>

                            <div style={{ display: 'none' }}>
                              {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                                let pageToShow;
                                if (totalPages <= 5) {
                                  pageToShow = index + 1;
                                } else if (currentPage <= 3) {
                                  pageToShow = index + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageToShow = totalPages - 4 + index;
                                } else {
                                  pageToShow = currentPage - 2 + index;
                                }

                                if (pageToShow > 0 && pageToShow <= totalPages) {
                                  return (
                                    <Button
                                      key={pageToShow}
                                      onClick={() => paginate(pageToShow)}
                                      type={currentPage === pageToShow ? 'primary' : 'default'}
                                      size="small"
                                    >
                                      {pageToShow}
                                    </Button>
                                  );
                                }
                                return null;
                              })}
                            </div>

                            <Button type="primary" size="small">
                              {currentPage}
                            </Button>

                            <Button
                              onClick={() => paginate(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              size="small"
                            >
                              <svg style={{ width: '20px', height: '20px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </Button>
                            <Button
                              onClick={() => paginate(totalPages)}
                              disabled={currentPage === totalPages}
                              size="small"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                                <path fillRule="evenodd" d="M10.21 14.77a.75.75 0 01.02-1.06L14.168 10 10.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M4.21 14.77a.75.75 0 01.02-1.06L8.168 10 4.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                              </svg>
                            </Button>
                          </Space>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
} 