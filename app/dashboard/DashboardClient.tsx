'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Cell,
} from 'recharts'

// These will be replaced with data from the API
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#FF5733', '#C70039', '#900C3F']

// Sample papers
const generatePapers = (count: number) => {
    const papers = []
    // Use a deterministic seed for random numbers to avoid hydration mismatches
    const seedValues = [42, 17, 33, 76, 89, 51, 28, 64, 95, 12, 37, 59, 81, 26, 74, 48, 93, 61, 15, 39]

    for (let i = 1; i <= count; i++) {
        const title = `Research Paper ${i}: Understanding Advanced AI Techniques`
        papers.push({
            id: `paper-${i}`, // String ID format for API compatibility
            title: title,
            authors: ['John Doe', 'Jane Smith'], // Array format to match Paper interface
            publication: 'International Journal of Computer Science',
            year: 2020 + Math.floor((seedValues[i % seedValues.length] % 4)),
            citations: seedValues[i % seedValues.length] % 100, // Use deterministic value instead of random
            abstract: 'This paper explores advanced techniques in artificial intelligence and their applications in solving complex real-world problems...',
            keywords: ['AI', 'Machine Learning', 'Deep Learning'],
            field: 'Computer Science',
            downloadUrl: '#',
            isInteresting: Math.random() > 0.7, // Random star status
        })
    }
    return papers
}

// Date helper functions
const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
}

const getDefaultStartDate = (): string => {
    return formatDate(new Date())
}

const getDefaultEndDate = (): string => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return formatDate(tomorrow)
}

// Hàm phụ trợ để chuẩn hóa keywords từ nhiều định dạng khác nhau
const normalizeKeywords = (keywords: any): string[] => {
    if (!keywords) return []

    if (Array.isArray(keywords)) {
        return keywords.filter((k): k is string => typeof k === 'string' && !!k.trim()).map(k => k.trim())
    }

    if (typeof keywords === 'string') {
        try {
            // Thử parse chuỗi JSON
            const parsed = JSON.parse(keywords)
            if (Array.isArray(parsed)) {
                return parsed.filter((k): k is string => typeof k === 'string' && !!k.trim()).map(k => k.trim())
            }
        } catch (e) {
            // Nếu không phải JSON, xử lý như chuỗi thường
            return keywords.split(',').map(k => k.trim()).filter(k => k)
        }
        // Nếu là string đơn lẻ
        return [keywords.trim()]
    }

    return []
}

export default function Dashboard() {
    const router = useRouter()
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
    const [papers, setPapers] = useState<any[]>([])
    const [filteredPapers, setFilteredPapers] = useState<any[]>([])
    const [starredPapers, setStarredPapers] = useState<Set<string>>(new Set())
    const [uniqueKeywords, setUniqueKeywords] = useState<string[]>([])

    // Date filter state
    const [startDate, setStartDate] = useState(getDefaultStartDate())
    const [endDate, setEndDate] = useState(getDefaultEndDate())
    const [period, setPeriod] = useState('monthly')

    // Stats state
    const [monthlyPapers, setMonthlyPapers] = useState<any[]>([])
    const [categoryData, setCategoryData] = useState<any[]>([])
    const [keywordSets, setKeywordSets] = useState<any[]>([])
    const [keywordStats, setKeywordStats] = useState<any>({ topKeywords: [], periodData: [] })
    const [datasetStats, setDatasetStats] = useState<any>({ topDatasets: [], periodData: [] })
    const [isLoading, setIsLoading] = useState(true)

    // Add a state for summary statistics
    const [summaryStats, setSummaryStats] = useState({
        totalPapers: 0,
        papersThisMonth: 0,
        totalCitations: 0,
        averageCitations: 0,
    })

    // State cho phân trang
    const [currentPage, setCurrentPage] = useState(1)
    const [papersPerPage, setPapersPerPage] = useState(5)

    const toggleKeyword = (keyword: string) => {
        setSelectedKeywords(prev =>
            prev.includes(keyword)
                ? prev.filter(k => k !== keyword)
                : [...prev, keyword]
        )
    }

    // Toggle star/favorite status for a paper
    const toggleStarPaper = async (e: React.MouseEvent, paperId: string) => {
        e.stopPropagation() // Prevent navigation to paper details

        // Optimistic update
        setStarredPapers(prev => {
            const newSet = new Set(prev)
            if (newSet.has(paperId)) {
                newSet.delete(paperId)
            } else {
                newSet.add(paperId)
            }
            return newSet
        })

        try {
            // Find the paper in our list
            const paper = filteredPapers.find(p => p.id === paperId)
            if (!paper) return

            // Get auth token from localStorage or sessionStorage
            const authToken = localStorage.getItem('authToken') ||
                sessionStorage.getItem('authToken') ||
                localStorage.getItem('token') ||
                sessionStorage.getItem('token')

            if (!authToken) {
                console.error('No authentication token found. User must be logged in to star papers.')
                return
            }

            // Prepare the authorization header
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Token ${authToken}`,
            }

            // Make API call to update the paper's interesting status
            const response = await fetch(`http://localhost:8000/api/papers/${paperId}/`, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({
                    is_interesting: !starredPapers.has(paperId),
                }),
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error('Failed to update star status')
            }
        } catch (error) {
            console.error('Error updating star status:', error)
            // Revert on error
            setStarredPapers(prev => {
                const newSet = new Set(prev)
                if (newSet.has(paperId)) {
                    newSet.delete(paperId)
                } else {
                    newSet.add(paperId)
                }
                return newSet
            })
        }
    }

    // Initialize starredPapers based on initial paper data
    useEffect(() => {
        const starred = new Set<string>()
        if (Array.isArray(papers)) {
            papers.forEach(paper => {
                if (paper.isInteresting) {
                    starred.add(paper.id)
                }
            })
        }
        setStarredPapers(starred)
    }, [papers])

    // Fetch dashboard data when date filters change
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true)
            try {
                const response = await fetch(
                    `http://localhost:8000/api/stats/dashboard/?startDate=${startDate}&endDate=${endDate}`
                )

                if (response.ok) {
                    const data = await response.json()
                    console.log('Dashboard stats response:', data)
                    setMonthlyPapers(data.monthlyPapers || [])
                    setCategoryData(data.categoryData || [])
                    setKeywordSets(data.keywordSets || [])
                } else {
                    console.error('Failed to fetch dashboard stats:', await response.text())
                }

                // Also fetch summary statistics
                const statsResponse = await fetch(
                    `http://localhost:8000/api/stats/papers/?startDate=${startDate}&endDate=${endDate}`
                )
                if (statsResponse.ok) {
                    const statsData = await statsResponse.json()
                    console.log('Papers summary stats response:', statsData)
                    setSummaryStats({
                        totalPapers: statsData.totalPapers || 0,
                        papersThisMonth: statsData.papersThisMonth || 0,
                        totalCitations: statsData.totalCitations || 0,
                        averageCitations: Number(statsData.averageCitations) || 0,
                    })
                } else {
                    console.error('Failed to fetch papers stats:', await statsResponse.text())
                }

                // Fetch papers based on date filter
                const papersResponse = await fetch(
                    `http://localhost:8000/api/papers/?startDate=${startDate}&endDate=${endDate}`
                )
                if (papersResponse.ok) {
                    const papersData = await papersResponse.json()
                    console.log('Papers response:', papersData)
                    console.log('Number of papers:', papersData?.results?.length || 0)

                    // Kiểm tra dữ liệu keywords của vài papers đầu tiên
                    if (papersData?.results?.length > 0) {
                        console.log('Sample paper keywords:', papersData.results.slice(0, 3).map((p: any) => p.keywords))
                    }

                    setPapers(papersData?.results || [])
                } else {
                    console.error('Failed to fetch papers:', await papersResponse.text())
                    setPapers([])
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
                setPapers([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchDashboardData()
    }, [startDate, endDate])

    // Fetch statistics when date filters change
    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true)
            try {
                // Fetch keyword stats
                const keywordResponse = await fetch(
                    `http://localhost:8000/api/stats/keywords/?startDate=${startDate}&endDate=${endDate}&period=${period}`
                )
                if (keywordResponse.ok) {
                    const keywordData = await keywordResponse.json()
                    console.log('Keyword stats response:', keywordData)
                    setKeywordStats(keywordData)
                } else {
                    console.error('Failed to fetch keyword stats:', await keywordResponse.text())
                }

                // Fetch dataset stats
                const datasetResponse = await fetch(
                    `http://localhost:8000/api/stats/datasets/?startDate=${startDate}&endDate=${endDate}&period=${period}`
                )
                if (datasetResponse.ok) {
                    const datasetData = await datasetResponse.json()
                    console.log('Dataset stats response:', datasetData)
                    setDatasetStats(datasetData)
                } else {
                    console.error('Failed to fetch dataset stats:', await datasetResponse.text())
                }
            } catch (error) {
                console.error('Error fetching stats:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
    }, [startDate, endDate, period])

    // Extract unique keywords from papers
    useEffect(() => {
        const keywordsSet = new Set<string>()
        let hasFoundKeywords = false

        if (Array.isArray(papers) && papers.length > 0) {
            papers.forEach(paper => {
                const keywordsArray = normalizeKeywords(paper.keywords)

                // Thêm keywords vào Set
                keywordsArray.forEach(keyword => {
                    if (keyword && keyword.trim()) {
                        keywordsSet.add(keyword.trim())
                        hasFoundKeywords = true
                    }
                })
            })
        }

        const sortedKeywords = Array.from(keywordsSet).sort()
        setUniqueKeywords(sortedKeywords)

        // Log để debug
        console.log(`Extracted ${sortedKeywords.length} unique keywords from ${papers.length} papers`)
    }, [papers])

    // Filter papers based on selected keywords
    useEffect(() => {
        if (!Array.isArray(papers)) {
            setFilteredPapers([])
            return
        }

        if (selectedKeywords.length === 0) {
            // Show all papers when no keywords are selected
            setFilteredPapers(papers)
        } else {
            // Filter papers based on selected keywords
            const filtered = papers.filter(paper => {
                const paperKeywords = normalizeKeywords(paper.keywords)
                // Check if any of the paper's keywords match the selected keywords
                return paperKeywords.some(keyword => selectedKeywords.includes(keyword))
            })
            setFilteredPapers(filtered)
        }
    }, [selectedKeywords, papers])

    // Add this helper function to create slugs
    const createSlug = (title: string): string => {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-')     // Replace spaces with hyphens
            .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
            .trim()                  // Trim whitespace
    }

    const viewPaperDetails = (paperId: string) => {
        // Find the paper by ID in the filteredPapers array
        const paper = filteredPapers.find(p => p.id === paperId)
        if (paper) {
            // Create a slug from the paper title and navigate to the detail page
            router.push(`/papers/${createSlug(paper.title)}`)
        }
    }

    // Create keyword chart data from our keywordSets - limit to top 5
    const keywordChartData = keywordSets.slice(0, 5).map((item, index) => ({
        name: item.name,
        count: item.count || 10, // Fallback value
        fill: COLORS[index % COLORS.length],
    }))

    // Prepare dataset data for bar chart - limit to top 5
    const datasetChartData = datasetStats.datasets?.slice(0, 5).map((item: any, index: number) => ({
        name: item.name,
        count: item.count,
        fill: COLORS[index % COLORS.length],
    })) || []

    // Prepare time-series data for keywords
    const prepareTimeSeriesData = () => {
        const result: any[] = []

        if (!keywordStats.periodData || keywordStats.periodData.length === 0) {
            console.log('No period data available for keyword trends')
            return result
        }

        console.log('Preparing time series data from:', keywordStats.periodData)

        // Đảm bảo có dữ liệu keywords
        keywordStats.periodData.forEach((periodItem: any) => {
            // Mỗi periodItem phải có keywords array và ít nhất 1 keyword
            if (periodItem.keywords && periodItem.keywords.length > 0) {
                // Ở đây chỉ lấy top-1 keyword từ mỗi period
                const entry: any = {
                    period: periodItem.period,
                    // Store the single top keyword and its count
                    keyword: periodItem.keywords[0].name,
                    count: periodItem.keywords[0].count,
                }
                result.push(entry)
            }
        })

        return result
    }

    const timeSeriesData = prepareTimeSeriesData()

    // Logic hiển thị papers theo trang
    const indexOfLastPaper = currentPage * papersPerPage
    const indexOfFirstPaper = indexOfLastPaper - papersPerPage
    const currentPapers = filteredPapers.slice(indexOfFirstPaper, indexOfLastPaper)
    const totalPages = Math.ceil(filteredPapers.length / papersPerPage)

    // Hàm chuyển trang
    const paginate = (pageNumber: number) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber)
        }
    }

    return (
        <div className='container mx-auto p-4'>
            {/* Date Filter Section */}
            <div className='bg-white shadow rounded-lg p-4 mb-6'>
                <h2 className='text-xl font-semibold mb-4'>Date Filters</h2>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Start Date</label>
                        <input
                            type='date'
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>End Date</label>
                        <input
                            type='date'
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>View By</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                        >
                            <option value='daily'>Daily</option>
                            <option value='monthly'>Monthly</option>
                            <option value='yearly'>Yearly</option>
                        </select>
                    </div>
                    <div className='flex items-end'>
                        <button
                            onClick={() => {
                                setStartDate(getDefaultStartDate())
                                setEndDate(getDefaultEndDate())
                            }}
                            className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        >
                            Reset Dates
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                <div className='bg-white shadow rounded-lg p-4'>
                    <h2 className='text-lg font-semibold text-gray-700'>Total Papers</h2>
                    <p className='text-3xl font-bold'>{summaryStats.totalPapers.toLocaleString()}</p>
                </div>
                <div className='bg-white shadow rounded-lg p-4'>
                    <h2 className='text-lg font-semibold text-gray-700'>Papers This Month</h2>
                    <p className='text-3xl font-bold'>{summaryStats.papersThisMonth.toLocaleString()}</p>
                </div>
                <div className='bg-white shadow rounded-lg p-4'>
                    <h2 className='text-lg font-semibold text-gray-700'>Total Citations</h2>
                    <p className='text-3xl font-bold'>{summaryStats.totalCitations.toLocaleString()}</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
                <div className='bg-white p-4 rounded-lg shadow'>
                    <h2 className='text-xl font-semibold mb-4'>Papers Published by Month</h2>
                    {isLoading ? (
                        <p className='text-center py-10'>Loading...</p>
                    ) : (
                        <div className='h-80'>
                            <ResponsiveContainer width='100%' height='100%'>
                                <LineChart data={monthlyPapers}>
                                    <CartesianGrid strokeDasharray='3 3' />
                                    <XAxis dataKey='name' />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type='monotone' dataKey='papers' stroke='#8884d8' activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className='bg-white p-4 rounded-lg shadow'>
                    <h2 className='text-xl font-semibold mb-4'>Papers by Category</h2>
                    {isLoading ? (
                        <p className='text-center py-10'>Loading...</p>
                    ) : (
                        <div className='h-80'>
                            <ResponsiveContainer width='100%' height='100%'>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx='50%'
                                        cy='50%'
                                        labelLine={false}
                                        outerRadius={80}
                                        fill='#8884d8'
                                        dataKey='value'
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Keywords Section */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
                <div className='bg-white p-4 rounded-lg shadow'>
                    <h2 className='text-xl font-semibold mb-4'>Top Keywords</h2>
                    {isLoading ? (
                        <p className='text-center py-10'>Loading...</p>
                    ) : (
                        <div className='h-80'>
                            <ResponsiveContainer width='100%' height='100%'>
                                <BarChart data={keywordChartData} layout='vertical'>
                                    <CartesianGrid strokeDasharray='3 3' />
                                    <XAxis
                                        type='number'
                                        allowDecimals={false}
                                        domain={[0, 'dataMax']}
                                        tickCount={6}
                                    />
                                    <YAxis dataKey='name' type='category' width={150} />
                                    <Tooltip formatter={(value) => [Math.floor(Number(value)), 'Count']} />
                                    <Legend />
                                    <Bar dataKey='count' name='Count'>
                                        {keywordChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % 5]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className='bg-white p-4 rounded-lg shadow'>
                    <h2 className='text-xl font-semibold mb-4'>Top Datasets</h2>
                    {isLoading ? (
                        <p className='text-center py-10'>Loading...</p>
                    ) : (
                        <div className='h-80'>
                            <ResponsiveContainer width='100%' height='100%'>
                                <BarChart data={datasetChartData} layout='vertical'>
                                    <CartesianGrid strokeDasharray='3 3' />
                                    <XAxis
                                        type='number'
                                        allowDecimals={false}
                                        domain={[0, 'dataMax']}
                                        tickCount={6}
                                    />
                                    <YAxis dataKey='name' type='category' width={150} />
                                    <Tooltip formatter={(value) => [Math.floor(Number(value)), 'Count']} />
                                    <Legend />
                                    <Bar dataKey='count' name='Count'>
                                        {datasetChartData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % 5]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Keywords Trend Chart */}
            <div className='bg-white p-4 rounded-lg shadow mb-6'>
                <h2 className='text-xl font-semibold mb-4'>Keyword Trends Over Time (Top Keyword per Period)</h2>
                {isLoading ? (
                    <p className='text-center py-10'>Loading...</p>
                ) : timeSeriesData.length === 0 ? (
                    <p className='text-center py-10 text-gray-500'>No keyword trend data available for the selected period.</p>
                ) : (
                    <div className='h-80'>
                        <ResponsiveContainer width='100%' height='100%'>
                            <LineChart data={timeSeriesData}>
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis dataKey='period' />
                                <YAxis />
                                <Tooltip
                                    formatter={(value, name) => {
                                        if (name === 'count') {
                                            const matchingEntry = timeSeriesData.find(entry => entry.count === value)
                                            if (matchingEntry) {
                                                return [`${value} (${matchingEntry.keyword})`, 'Occurrences']
                                            }
                                        }
                                        return [value, name]
                                    }}
                                    labelFormatter={(label) => `Period: ${label}`}
                                />
                                <Legend />
                                <Line type='monotone' dataKey='count' name='Top Keyword' stroke='#8884d8' activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Keywords & Papers Section */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <div className='lg:col-span-1'>
                    <div className='bg-white p-4 rounded-lg shadow'>
                        <h2 className='text-xl font-semibold mb-4'>Filter by Keywords</h2>
                        <div className='space-y-2 max-h-96 overflow-y-auto'>
                            {uniqueKeywords.length > 0 ? (
                                uniqueKeywords.map(keyword => (
                                    <div key={keyword} className='flex items-center'>
                                        <input
                                            type='checkbox'
                                            id={`keyword-${keyword}`}
                                            checked={selectedKeywords.includes(keyword)}
                                            onChange={() => toggleKeyword(keyword)}
                                            className='mr-2'
                                        />
                                        <label htmlFor={`keyword-${keyword}`}>{keyword}</label>
                                    </div>
                                ))
                            ) : (
                                <p className='text-gray-500'>No keywords found in the current papers.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className='lg:col-span-2'>
                    <div className='bg-white p-4 rounded-lg shadow'>
                        <h2 className='text-xl font-semibold mb-4'>Research Papers ({filteredPapers.length})</h2>
                        {filteredPapers.length === 0 ? (
                            <p className='text-gray-500 text-center py-10'>
                                {papers.length === 0
                                    ? 'No papers available for the selected date range.'
                                    : 'No papers match the selected keywords. Try selecting different keywords or clear filters.'}
                            </p>
                        ) : (
                            <div>
                                <div className='space-y-4'>
                                    {currentPapers.map(paper => (
                                        <div
                                            key={paper.id}
                                            className='border border-gray-200 p-4 rounded hover:bg-gray-50 cursor-pointer relative'
                                        >
                                            <div className='flex justify-between'>
                                                <h3
                                                    className='text-lg font-semibold text-blue-600 hover:underline'
                                                    onClick={() => viewPaperDetails(paper.id)}
                                                >
                                                    {paper.title}
                                                </h3>
                                                <button
                                                    onClick={(e) => toggleStarPaper(e, paper.id)}
                                                    className='text-gray-400 hover:text-yellow-500 focus:outline-none transition-colors'
                                                    aria-label={starredPapers.has(paper.id) ? 'Remove from favorites' : 'Add to favorites'}
                                                >
                                                    <svg
                                                        xmlns='http://www.w3.org/2000/svg'
                                                        viewBox='0 0 24 24'
                                                        fill={starredPapers.has(paper.id) ? 'currentColor' : 'none'}
                                                        stroke='currentColor'
                                                        className='w-6 h-6'
                                                        style={{ color: starredPapers.has(paper.id) ? '#FFC107' : 'currentColor' }}
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={starredPapers.has(paper.id) ? '0' : '2'}
                                                            d='M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z'
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                            <p className='text-sm text-gray-600'>{paper.authors.join(', ')} • {paper.publication} • {paper.year}</p>
                                            <p className='mt-2 text-gray-700'>{paper.abstract}</p>

                                            <div className='mt-3 flex flex-wrap gap-2'>
                                                {normalizeKeywords(paper.keywords).map((keyword: string, idx: number) => (
                                                    <span
                                                        key={`${paper.id}-keyword-${idx}`}
                                                        className='inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10'
                                                    >
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className='mt-3 flex justify-between items-center'>
                                                <p className='text-sm text-gray-500'>Citations: {paper.citations}</p>
                                                <a
                                                    href={paper.downloadUrl}
                                                    className='inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800'
                                                    onClick={(e) => e.stopPropagation()}
                                                    target='_blank'
                                                    rel='noopener noreferrer'
                                                >
                                                    <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'></path>
                                                    </svg>
                                                    Download
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {filteredPapers.length > 0 && (
                                    <div className='flex flex-col md:flex-row justify-between items-center mt-6 px-4 py-3 bg-white border-t border-gray-200 sm:px-6'>
                                        <div className='flex items-center mb-4 md:mb-0'>
                                            <label htmlFor='per-page' className='mr-2 text-sm text-gray-600'>Show:</label>
                                            <select
                                                id='per-page'
                                                value={papersPerPage}
                                                onChange={(e) => {
                                                    setPapersPerPage(Number(e.target.value))
                                                    setCurrentPage(1) // Reset to first page when changing items per page
                                                }}
                                                className='border border-gray-300 rounded py-1 px-2 text-sm'
                                            >
                                                <option value='5'>5</option>
                                                <option value='10'>10</option>
                                                <option value='20'>20</option>
                                                <option value='50'>50</option>
                                            </select>
                                            <span className='ml-2 text-sm text-gray-600'>per page</span>
                                        </div>

                                        <div className='flex items-center'>
                                            <p className='text-sm text-gray-700 mr-4'>
                                                Page <span className='font-medium'>{currentPage}</span> of{' '}
                                                <span className='font-medium'>{totalPages}</span>{' '}
                                                ({filteredPapers.length} results)
                                            </p>

                                            <div className='flex'>
                                                <button
                                                    onClick={() => paginate(1)}
                                                    disabled={currentPage === 1}
                                                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <span className='sr-only'>First</span>
                                                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-5 h-5'>
                                                        <path fillRule='evenodd' d='M15.79 14.77a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L11.832 10l3.938 3.71a.75.75 0 01.02 1.06zm-6 0a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L5.832 10l3.938 3.71a.75.75 0 01.02 1.06z' clipRule='evenodd' />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => paginate(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <span className='sr-only'>Previous</span>
                                                    <svg className='h-5 w-5' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
                                                        <path fillRule='evenodd' d='M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z' clipRule='evenodd' />
                                                    </svg>
                                                </button>

                                                {/* Page buttons for desktop */}
                                                <div className='hidden md:flex'>
                                                    {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                                                        // Calculate page numbers to show (up to 5)
                                                        let pageToShow
                                                        if (totalPages <= 5) {
                                                            pageToShow = index + 1
                                                        } else if (currentPage <= 3) {
                                                            pageToShow = index + 1
                                                        } else if (currentPage >= totalPages - 2) {
                                                            pageToShow = totalPages - 4 + index
                                                        } else {
                                                            pageToShow = currentPage - 2 + index
                                                        }

                                                        // Only show if page is valid
                                                        if (pageToShow > 0 && pageToShow <= totalPages) {
                                                            return (
                                                                <button
                                                                    key={pageToShow}
                                                                    onClick={() => paginate(pageToShow)}
                                                                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${currentPage === pageToShow
                                                                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                                        : 'bg-white text-gray-500 hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    {pageToShow}
                                                                </button>
                                                            )
                                                        }
                                                        return null
                                                    })}
                                                </div>

                                                {/* Current page indicator for mobile */}
                                                <div className='md:hidden flex items-center'>
                                                    <span className='px-4 py-2 border border-gray-300 bg-indigo-50 text-indigo-600 font-medium text-sm'>
                                                        {currentPage}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={() => paginate(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <span className='sr-only'>Next</span>
                                                    <svg className='h-5 w-5' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
                                                        <path fillRule='evenodd' d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z' clipRule='evenodd' />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => paginate(totalPages)}
                                                    disabled={currentPage === totalPages}
                                                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <span className='sr-only'>Last</span>
                                                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-5 h-5'>
                                                        <path fillRule='evenodd' d='M10.21 14.77a.75.75 0 01.02-1.06L14.168 10 10.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z' clipRule='evenodd' />
                                                        <path fillRule='evenodd' d='M4.21 14.77a.75.75 0 01.02-1.06L8.168 10 4.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z' clipRule='evenodd' />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
