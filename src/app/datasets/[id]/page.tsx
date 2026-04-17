'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import InterestingDatasetButton from '../../../components/InterestingDatasetButton'
import { getAuthHeaders } from '@/utils/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface Dataset {
    id: string;
    name: string;
    abbreviation: string;
    description: string;
    downloadUrl: string;
    paperCount: number;
    language: string;
    category: string;
    tasks: string[];
    thumbnailUrl?: string;
    benchmarks: any[];
    isStarred: boolean;
    subtitle?: string;
    dataloaders?: any[];
    similar_datasets?: any[];
    papers?: any[];
    link?: string;
    paper_link?: string;
}

interface Paper {
    id: string;
    title: string;
    authors: string[];
    abstract?: string;
    conference: string;
    year: number;
    field?: string;
    venue_type?: string;
    keywords?: string[];
    downloadUrl?: string;
    doi?: string;
}

export default function DatasetDetailPage() {
    const params = useParams()
    const id = params.id as string

    const [dataset, setDataset] = useState<Dataset | null>(null)
    const [relatedPapers, setRelatedPapers] = useState<Paper[]>([])
    const [similarDatasets, setSimilarDatasets] = useState<Dataset[]>([])
    const [loading, setLoading] = useState(true)
    const [isStarred, setIsStarred] = useState(false)
    const [tasks, setTasks] = useState<string[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [papersPerPage] = useState(5)

    // Fetch dataset details and check if it's already starred
    useEffect(() => {
        const fetchDatasetDetails = async () => {
            try {
                console.log(`Attempting to fetch dataset with ID: ${id}`)
                const response = await fetch(`${API_URL}/api/datasets/${id}/`, {
                    headers: getAuthHeaders(),
                })

                if (response.status === 404) {
                    console.error(`Dataset not found with ID: ${id}`)
                    console.error('Please check the PostgreSQL database to ensure this dataset exists')
                    setLoading(false)
                    return
                }

                if (response.ok) {
                    const data = await response.json()
                    if (data.dataset) {
                        console.log(`Successfully found dataset: ${data.dataset.name}`)
                        setDataset(data.dataset)
                        setRelatedPapers(data.relatedPapers || [])
                        setSimilarDatasets(data.similarDatasets || [])

                        // Check if this dataset is already starred
                        if (data.dataset.isStarred) {
                            setIsStarred(true)
                        }
                    } else {
                        console.error('Dataset response is missing dataset data')
                        setLoading(false)
                    }
                } else {
                    console.error(`Error fetching dataset details: ${response.status} ${response.statusText}`)
                }
            } catch (error) {
                console.error('Error fetching dataset details:', error)
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchDatasetDetails()
        }
    }, [id])

    useEffect(() => {
        // Parse tasks from JSON if it's a string
        if (dataset && dataset.tasks) {
            if (typeof dataset.tasks === 'string') {
                try {
                    setTasks(JSON.parse(dataset.tasks))
                } catch (e) {
                    console.error('Error parsing tasks string:', e)
                    setTasks([dataset.tasks])
                }
            } else if (Array.isArray(dataset.tasks)) {
                setTasks(dataset.tasks)
            } else if (typeof dataset.tasks === 'object') {
                // Handle case where tasks might be an object
                try {
                    const taskArray = Object.values(dataset.tasks) as string[]
                    setTasks(taskArray)
                } catch (e) {
                    console.error('Error converting tasks object to array:', e)
                    setTasks([])
                }
            } else {
                setTasks([])
            }
        } else {
            setTasks([])
        }
    }, [dataset])

    if (loading) {
        return (
            <div className='container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]'>
                <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600'></div>
            </div>
        )
    }

    if (!dataset) {
        return (
            <div className='container mx-auto px-4 py-8'>
                <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
                    <p>Dataset not found. Please check the URL and try again.</p>
                </div>
            </div>
        )
    }

    // Calculate pagination indices for related papers
    const indexOfLastPaper = currentPage * papersPerPage
    const indexOfFirstPaper = indexOfLastPaper - papersPerPage
    const currentPapers = relatedPapers.slice(indexOfFirstPaper, indexOfLastPaper)
    const totalPages = Math.ceil(relatedPapers.length / papersPerPage)

    // Function to change page
    const paginate = (pageNumber: number) => {
        setCurrentPage(pageNumber)
        // Scroll to top of the papers section
        const papersSection = document.getElementById('related-papers')
        if (papersSection) {
            papersSection.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <div className='container mx-auto px-4 py-8'>
            <div className='mb-4 flex justify-between items-center'>
                <Link href='/datasets' className='text-blue-600 hover:text-blue-800 flex items-center gap-1'>
                    <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
                    </svg>
                    Back to Datasets
                </Link>
                <InterestingDatasetButton
                    datasetId={dataset.id}
                    initialState={isStarred}
                    className='p-2 text-yellow-500 hover:text-yellow-600'
                    onToggle={(newState) => setIsStarred(newState)}
                />
            </div>

            <div className='bg-white rounded-lg shadow-md overflow-hidden mb-8'>
                <div className='flex flex-col md:flex-row'>
                    {/* Dataset image/logo */}
                    <div className='md:w-1/4 bg-gray-100 p-6 flex items-center justify-center'>
                        <div className='w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center'>
                            {dataset.abbreviation && (
                                <img
                                    src={`/images/datasets/${dataset.abbreviation.toLowerCase().replace(/-/g, '')}.png`}
                                    alt={dataset.abbreviation}
                                    className='max-w-full max-h-full object-contain'
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.onerror = null
                                        target.style.display = 'none'
                                        const parent = target.parentElement
                                        if (parent) {
                                            parent.innerHTML = `<div class="text-3xl font-bold text-gray-400">${dataset.abbreviation}</div>`
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Dataset info */}
                    <div className='md:w-3/4 p-6'>
                        <div className='flex justify-between items-start'>
                            <div>
                                <p className='text-gray-500 text-lg'>{dataset.abbreviation}</p>
                            </div>
                            {dataset.downloadUrl && typeof dataset.downloadUrl === 'string' && (
                                <a
                                    href={dataset.downloadUrl}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2'
                                >
                                    <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                                        <path fillRule='evenodd' d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z' clipRule='evenodd' />
                                    </svg>
                                    Download
                                </a>
                            )}
                        </div>

                        <p className='mt-4 text-gray-700'>{dataset.description}</p>

                        {dataset.subtitle && (
                            <p className='mt-2 text-gray-600 italic'>{dataset.subtitle}</p>
                        )}

                        <div className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div className='bg-gray-50 p-4 rounded-md'>
                                <h3 className='text-sm font-medium text-gray-500 uppercase'>Category</h3>
                                <p className='mt-1 font-medium'>{dataset.category}</p>
                            </div>
                            <div className='bg-gray-50 p-4 rounded-md'>
                                <h3 className='text-sm font-medium text-gray-500 uppercase'>Language</h3>
                                <p className='mt-1 font-medium'>{dataset.language}</p>
                            </div>
                            <div className='bg-gray-50 p-4 rounded-md'>
                                <h3 className='text-sm font-medium text-gray-500 uppercase'>Papers</h3>
                                <p className='mt-1 font-medium'>{dataset.paperCount}</p>
                            </div>
                        </div>

                        <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div className='bg-gray-50 p-4 rounded-md'>
                                <h3 className='text-sm font-medium text-gray-500 uppercase'>Tasks</h3>
                                <div className='mt-1'>
                                    {tasks && tasks.length > 0 ? (
                                        <div className='flex flex-wrap gap-1'>
                                            {tasks.map((task, index) => (
                                                <span key={index} className='inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800'>
                                                    {task}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className='font-medium text-gray-500'>No tasks available</p>
                                    )}
                                </div>
                            </div>
                            <div className='bg-gray-50 p-4 rounded-md'>
                                <h3 className='text-sm font-medium text-gray-500 uppercase'>Benchmarks</h3>
                                <p className='mt-1 font-medium'>
                                    {(() => {
                                        // Handle different benchmark formats
                                        if (!dataset.benchmarks) {
                                            return '0 benchmarks'
                                        }

                                        if (typeof dataset.benchmarks === 'number') {
                                            return dataset.benchmarks + ' benchmark' + (dataset.benchmarks !== 1 ? 's' : '')
                                        }

                                        if (Array.isArray(dataset.benchmarks)) {
                                            return dataset.benchmarks.length + ' benchmark' + (dataset.benchmarks.length !== 1 ? 's' : '')
                                        }

                                        if (typeof dataset.benchmarks === 'string') {
                                            try {
                                                const parsed = JSON.parse(dataset.benchmarks)
                                                if (typeof parsed === 'number') {
                                                    return parsed + ' benchmark' + (parsed !== 1 ? 's' : '')
                                                }
                                                if (Array.isArray(parsed)) {
                                                    return parsed.length + ' benchmark' + (parsed.length !== 1 ? 's' : '')
                                                }
                                            } catch (e) {
                                                // Try as a direct number
                                                const num = Number(dataset.benchmarks)
                                                if (!isNaN(num)) {
                                                    return num + ' benchmark' + (num !== 1 ? 's' : '')
                                                }
                                            }
                                        }

                                        return '0 benchmarks'
                                    })()}
                                </p>
                            </div>
                        </div>

                        {/* Extra Links Section */}
                        <div className='mt-6 flex flex-wrap gap-4'>
                            {dataset.link && typeof dataset.link === 'string' && (
                                <a
                                    href={dataset.link}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='bg-gray-50 p-4 rounded-md flex items-center gap-2 hover:bg-gray-100'
                                >
                                    <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 text-blue-600' viewBox='0 0 20 20' fill='currentColor'>
                                        <path fillRule='evenodd' d='M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z' clipRule='evenodd' />
                                    </svg>
                                    Dataset Link
                                </a>
                            )}
                            {dataset.paper_link && typeof dataset.paper_link === 'string' && (
                                <a
                                    href={dataset.paper_link}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='bg-gray-50 p-4 rounded-md flex items-center gap-2 hover:bg-gray-100'
                                >
                                    <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 text-blue-600' viewBox='0 0 20 20' fill='currentColor'>
                                        <path fillRule='evenodd' d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z' clipRule='evenodd' />
                                    </svg>
                                    Paper Link
                                </a>
                            )}
                        </div>

                        {/* Benchmarks Section */}
                        {(() => {
                            // Helper function to parse benchmarks
                            const getBenchmarks = () => {
                                if (!dataset.benchmarks) return null

                                if (Array.isArray(dataset.benchmarks) && dataset.benchmarks.length > 0) {
                                    return dataset.benchmarks
                                }

                                if (typeof dataset.benchmarks === 'string') {
                                    try {
                                        const parsed = JSON.parse(dataset.benchmarks)
                                        if (Array.isArray(parsed) && parsed.length > 0) {
                                            return parsed
                                        }
                                    } catch (e) {
                                        console.error('Error parsing benchmarks string:', e)
                                    }
                                }

                                // For numeric value, create placeholder benchmarks
                                if (typeof dataset.benchmarks === 'number' && dataset.benchmarks > 0) {
                                    return Array(dataset.benchmarks).fill({
                                        task: 'Classification',
                                        'dataset variant': 'Standard',
                                        'best model': 'Unknown',
                                    })
                                }

                                return null
                            }

                            const benchmarks = getBenchmarks()

                            if (benchmarks) {
                                return (
                                    <div className='mt-6'>
                                        <h3 className='text-lg font-semibold mb-2'>Benchmark Details</h3>
                                        <div className='overflow-x-auto'>
                                            <table className='min-w-full bg-white border border-gray-200'>
                                                <thead className='bg-gray-50'>
                                                    <tr>
                                                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Task</th>
                                                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Dataset Variant</th>
                                                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Best Model</th>
                                                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Links</th>
                                                    </tr>
                                                </thead>
                                                <tbody className='divide-y divide-gray-200'>
                                                    {benchmarks.map((benchmark: any, index: number) => (
                                                        <tr key={index}>
                                                            <td className='px-4 py-2 text-sm'>{benchmark.task || 'N/A'}</td>
                                                            <td className='px-4 py-2 text-sm'>{benchmark['dataset variant'] || benchmark.dataset_variant || 'N/A'}</td>
                                                            <td className='px-4 py-2 text-sm'>{benchmark['best model'] || benchmark.best_model || 'N/A'}</td>
                                                            <td className='px-4 py-2 text-sm'>
                                                                {benchmark.paper && typeof benchmark.paper === 'string' && (
                                                                    <a href={benchmark.paper} target='_blank' rel='noopener noreferrer' className='text-blue-600 hover:text-blue-800 mr-2'>
                                                                        Paper
                                                                    </a>
                                                                )}
                                                                {benchmark.code && typeof benchmark.code === 'string' && (
                                                                    <a href={benchmark.code} target='_blank' rel='noopener noreferrer' className='text-blue-600 hover:text-blue-800'>
                                                                        Code
                                                                    </a>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )
                            }

                            return null
                        })()}
                    </div>
                </div>
            </div>

            {/* Related Papers Section */}
            <div id='related-papers' className='bg-white rounded-lg shadow-md p-6 mb-8'>
                <h2 className='text-2xl font-bold text-blue-900 mb-4'>Related Papers</h2>
                {relatedPapers.length > 0 ? (
                    <>
                        <div className='space-y-4'>
                            {currentPapers.map(paper => (
                                <div key={paper.id} className='border border-gray-200 rounded-md p-4 hover:bg-gray-50'>
                                    <h3 className='font-medium text-lg'>
                                        <Link href={`/papers/${paper.id}`} className='text-blue-600 hover:text-blue-800'>
                                            {paper.title}
                                        </Link>
                                    </h3>
                                    <p className='text-gray-600 mt-1'>
                                        {Array.isArray(paper.authors)
                                            ? paper.authors.join(', ')
                                            : paper.authors}
                                    </p>
                                    {paper.abstract && (
                                        <p className='text-gray-700 mt-2 line-clamp-2'>
                                            {paper.abstract}
                                        </p>
                                    )}
                                    <div className='mt-3 flex flex-wrap gap-2'>
                                        {Array.isArray(paper.keywords) && paper.keywords.length > 0 &&
                                            paper.keywords.slice(0, 5).map((keyword, idx) => (
                                                <span key={idx} className='bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs'>
                                                    {keyword}
                                                </span>
                                            ))
                                        }
                                    </div>
                                    <div className='flex items-center justify-between mt-3'>
                                        <div className='flex items-center text-sm text-gray-500'>
                                            <span className={paper.venue_type === 'journal' ? 'text-purple-600' : 'text-blue-600'}>
                                                {paper.venue_type === 'journal' ? 'Journal' : 'Conference'}:
                                            </span>
                                            <span className='ml-1'>{paper.conference}</span>
                                            <span className='mx-2'>•</span>
                                            <span>{paper.year}</span>
                                            {paper.field && (
                                                <>
                                                    <span className='mx-2'>•</span>
                                                    <span>{paper.field}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className='flex gap-2'>
                                            {paper.downloadUrl && typeof paper.downloadUrl === 'string' && (
                                                <a
                                                    href={paper.downloadUrl}
                                                    target='_blank'
                                                    rel='noopener noreferrer'
                                                    className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200'
                                                >
                                                    PDF
                                                </a>
                                            )}
                                            {paper.doi && typeof paper.doi === 'string' && (
                                                <a
                                                    href={`https://doi.org/${paper.doi}`}
                                                    target='_blank'
                                                    rel='noopener noreferrer'
                                                    className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200'
                                                >
                                                    DOI
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls - Updated more beautiful version */}
                        {totalPages > 1 && (
                            <div className='flex justify-center items-center mt-6'>
                                <div className='flex items-center space-x-1'>
                                    <button
                                        onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                                        disabled={currentPage === 1}
                                        className={`px-4 py-2 rounded-md flex items-center ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                                        aria-label='Previous page'
                                    >
                                        <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 mr-1' viewBox='0 0 20 20' fill='currentColor'>
                                            <path fillRule='evenodd' d='M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z' clipRule='evenodd' />
                                        </svg>
                                        Previous
                                    </button>

                                    {Array.from({ length: Math.max(1, Math.min(5, totalPages)) }, (_, i) => {
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
                                        if (pageNum <= totalPages) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => paginate(pageNum)}
                                                    className={`px-4 py-2 rounded-md ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-100'}`}
                                                    aria-label={`Page ${pageNum}`}
                                                    aria-current={currentPage === pageNum ? 'page' : undefined}
                                                >
                                                    {pageNum}
                                                </button>
                                            )
                                        }
                                        return null
                                    })}

                                    <button
                                        onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                                        disabled={currentPage === totalPages}
                                        className={`px-4 py-2 rounded-md flex items-center ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                                        aria-label='Next page'
                                    >
                                        Next
                                        <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 ml-1' viewBox='0 0 20 20' fill='currentColor'>
                                            <path fillRule='evenodd' d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z' clipRule='evenodd' />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <p className='text-gray-600'>No papers found using this dataset.</p>
                )}
            </div>

            {/* Similar Datasets Section */}
            <div className='bg-white rounded-lg shadow-md p-6'>
                <h2 className='text-2xl font-bold text-blue-900 mb-4'>Similar Datasets</h2>
                {similarDatasets.length > 0 ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {similarDatasets.map(ds => (
                            <Link
                                key={ds.id}
                                href={`/datasets/${ds.id}`}
                                className='border border-gray-200 rounded-md p-4 hover:bg-gray-50 flex items-start gap-3'
                            >
                                <div className='w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0'>
                                    {ds.abbreviation && (
                                        <div className='text-lg font-bold text-gray-400'>{ds.abbreviation}</div>
                                    )}
                                </div>
                                <div>
                                    <h3 className='font-medium text-blue-600'>{ds.name}</h3>
                                    <p className='text-gray-600 text-sm mt-1 line-clamp-2'>{ds.description}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className='text-gray-600'>No similar datasets found.</p>
                )}
            </div>
        </div>
    )
}
