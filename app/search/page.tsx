'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import InterestingButton from '@/components/InterestingButton'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Định nghĩa kiểu dữ liệu cho kết quả tìm kiếm
interface UserResult {
  id: number;
  type: 'user';
  username: string;
  full_name: string;
  faculty_institute: string;
  position: string;
  avatar_url: string | null;
  keywords: string;
}

interface PaperResult {
  id: number;
  type: 'paper';
  title: string;
  authors: string;
  journal: string;
  year: number;
  url: string;
  isInteresting?: boolean;
}

type SearchResult = UserResult | PaperResult;

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Lấy query từ URL
  const queryParam = searchParams.get('query') || ''
  const typeParam = searchParams.get('type') || 'all'
  const pageParam = searchParams.get('page') || '1'
  const sizeParam = searchParams.get('pageSize') || '10'

  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [searchType, setSearchType] = useState(typeParam)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(parseInt(pageParam, 10))
  const [pageSize, setPageSize] = useState(parseInt(sizeParam, 10))
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Thực hiện tìm kiếm khi có query
  useEffect(() => {
    if (queryParam) {
      performSearch(
        queryParam,
        typeParam,
        parseInt(pageParam, 10),
        parseInt(sizeParam, 10),
      )
    }
  }, [queryParam, typeParam, pageParam, sizeParam])

  const performSearch = async (
    query: string,
    type: string,
    page: number = 1,
    size: number = pageSize,
  ) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/api/search/?q=${encodeURIComponent(query)}&type=${type}&page=${page}&pageSize=${size}`,
      )

      if (!response.ok) {
        throw new Error('Lỗi khi thực hiện tìm kiếm')
      }

      const data = await response.json()
      setResults(data.results.papers || [])

      // Update pagination data
      if (data.pagination) {
        setTotalItems(data.pagination.totalItems)
        setTotalPages(data.pagination.totalPages)
        setCurrentPage(data.pagination.page)
      }
    } catch (err) {
      console.error('Lỗi tìm kiếm:', err)
      setError('Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) return

    // Cập nhật URL với tham số tìm kiếm và reset về trang 1
    router.push(
      `/search?query=${encodeURIComponent(searchQuery)}&type=${searchType}&page=1&pageSize=${pageSize}`,
    )
    performSearch(searchQuery, searchType, 1, pageSize)
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value
    setSearchType(newType)

    if (searchQuery.trim()) {
      router.push(
        `/search?query=${encodeURIComponent(searchQuery)}&type=${newType}&page=1&pageSize=${pageSize}`,
      )
      performSearch(searchQuery, newType, 1, pageSize)
    }
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return

    router.push(
      `/search?query=${encodeURIComponent(searchQuery)}&type=${searchType}&page=${newPage}&pageSize=${pageSize}`,
    )
    performSearch(searchQuery, searchType, newPage, pageSize)

    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle items per page change
  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newSize = parseInt(e.target.value, 10)
    setPageSize(newSize)
    setCurrentPage(1) // Reset to first page when changing items per page

    router.push(
      `/search?query=${encodeURIComponent(searchQuery)}&type=${searchType}&page=1&pageSize=${newSize}`,
    )
    performSearch(searchQuery, searchType, 1, newSize)
  }

  return (
    <div className='min-h-screen bg-gray-100 py-8'>
      <div className='container mx-auto px-4'>
        <div className='bg-white rounded-lg shadow-md overflow-hidden p-6 mb-8'>
          <h1 className='text-2xl font-bold mb-6'>Tìm kiếm</h1>

          <form
            onSubmit={handleSearch}
            className='mb-8 flex flex-col md:flex-row gap-4'
          >
            <div className='flex-grow'>
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Nhập từ khóa tìm kiếm...'
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                required
              />
            </div>

            <div className='w-full md:w-48'>
              <select
                value={searchType}
                onChange={handleTypeChange}
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
              >
                <option value='all'>Tất cả</option>
                <option value='users'>Người dùng</option>
                <option value='papers'>Bài báo</option>
              </select>
            </div>

            <button
              type='submit'
              className='bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200'
            >
              Tìm kiếm
            </button>
          </form>

          {loading && (
            <div className='flex justify-center py-12'>
              <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
            </div>
          )}

          {error && <div className='text-red-500 mb-4'>{error}</div>}

          {!loading && !error && (
            <div>
              {results.length > 0 ? (
                <div>
                  <h2 className='text-lg font-semibold mb-4'>
                    Kết quả tìm kiếm ({totalItems})
                  </h2>

                  <div className='space-y-6'>
                    {results.map((result) => {
                      if (result.type === 'user') {
                        // Hiển thị kết quả người dùng
                        return (
                          <div
                            key={`user-${result.id}`}
                            className='flex border-l-4 border-blue-500 bg-white shadow-sm p-4 rounded-r-md'
                          >
                            <div className='mr-4 flex-shrink-0'>
                              <div className='w-16 h-16 relative rounded-full overflow-hidden'>
                                {result.avatar_url ? (
                                  <Image
                                    src={result.avatar_url}
                                    alt={result.full_name}
                                    width={64}
                                    height={64}
                                    className='object-cover'
                                  />
                                ) : (
                                  <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
                                    <span className='text-xl text-gray-500'>
                                      {result.full_name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <Link
                                href={`/profile/${result.username}`}
                                className='text-blue-600 hover:underline'
                              >
                                <h3 className='text-lg font-medium'>
                                  {result.full_name}
                                </h3>
                              </Link>
                              <p className='text-gray-600'>
                                {result.position} - {result.faculty_institute}
                              </p>
                              <p className='text-gray-500 mt-1 text-sm'>
                                {result.keywords}
                              </p>
                            </div>
                          </div>
                        )
                      } else {
                        // Hiển thị kết quả bài báo
                        return (
                          <div
                            key={`paper-${result.id}`}
                            className='border-l-4 border-green-500 bg-white shadow-sm p-4 rounded-r-md'
                          >
                            <div className='flex justify-between'>
                              <a
                                href={result.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-blue-600 hover:underline'
                              >
                                <h3 className='text-lg font-medium'>
                                  {result.title}
                                </h3>
                              </a>
                              <InterestingButton
                                paperId={result.id.toString()}
                                initialState={result.isInteresting}
                                className='text-yellow-500 hover:text-yellow-600'
                              />
                            </div>
                            <p className='text-gray-600'>{result.authors}</p>
                            <p className='text-gray-500 mt-1'>
                              <span className='text-gray-700'>
                                {result.journal}
                              </span>{' '}
                              ({result.year})
                            </p>
                          </div>
                        )
                      }
                    })}
                  </div>

                  {/* Pagination */}
                  {results.length > 0 && (
                    <div className='flex justify-center items-center mt-8 space-x-4'>
                      <div className='flex items-center space-x-1'>
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-4 py-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                        >
                          Previous
                        </button>

                        {Array.from(
                          { length: Math.max(1, Math.min(5, totalPages)) },
                          (_, i) => {
                            // Show pages around current page
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }

                            // Ensure we don't show page numbers beyond totalPages
                            if (pageNum <= totalPages || totalPages === 0) {
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`px-4 py-2 rounded-md ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-100'}`}
                                >
                                  {pageNum}
                                </button>
                              )
                            }
                            return null
                          },
                        )}

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={
                            currentPage === totalPages || totalPages === 0
                          }
                          className={`px-4 py-2 rounded-md ${currentPage === totalPages || totalPages === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                        >
                          Next
                        </button>
                      </div>

                      {/* Items per page selector - inline with pagination */}
                      <div className='flex items-center text-sm text-gray-600'>
                        <span className='mr-2'>Items per page:</span>
                        <select
                          value={pageSize}
                          onChange={handleItemsPerPageChange}
                          className='border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                          <option value='5'>5</option>
                          <option value='10'>10</option>
                          <option value='20'>20</option>
                          <option value='50'>50</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className='text-center py-12'>
                  <svg
                    className='mx-auto h-12 w-12 text-gray-400'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    aria-hidden='true'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                  <h3 className='mt-2 text-sm font-medium text-gray-900'>
                    Không tìm thấy kết quả
                  </h3>
                  <p className='mt-1 text-sm text-gray-500'>
                    Thử tìm kiếm với từ khóa khác.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gray-100 py-8 flex justify-center items-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  )
}
