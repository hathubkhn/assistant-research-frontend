import React from 'react'

export default function ResearchAssistant() {
    return (
        <div className='bg-gray-900 min-h-screen text-white p-6'>
            <div className='max-w-4xl mx-auto'>
                <h1 className='text-4xl font-bold mb-8'>Research Assistant là gì</h1>

                {/* Search Tabs */}
                <div className='mb-8 border-b border-gray-700'>
                    <div className='flex gap-6 mb-2'>
                        <button className='flex items-center gap-2 py-2 border-b-2 border-white'>
                            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'>
                                <path fillRule='evenodd' d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z' clipRule='evenodd'></path>
                            </svg>
                            Search
                        </button>
                        <button className='flex items-center gap-2 py-2 text-gray-400'>
                            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'>
                                <path d='M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z'></path>
                            </svg>
                            Sources <span className='ml-1 px-1.5 py-0.5 bg-gray-700 rounded-full text-xs'>10</span>
                        </button>
                    </div>
                </div>

                {/* Resources Cards */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
                    <div className='bg-gray-800 p-4 rounded-lg'>
                        <div className='flex items-center gap-2 mb-2'>
                            <span className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>V</span>
                            <span>Viblo</span>
                        </div>
                        <h3 className='font-medium mb-1'>Research Assistant - bước đột phá mới trong công nghệ xử lý thông tin khoa học</h3>
                    </div>

                    <div className='bg-gray-800 p-4 rounded-lg'>
                        <div className='flex items-center gap-2 mb-2'>
                            <span className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center'>G</span>
                            <span>github.com</span>
                        </div>
                        <h3 className='font-medium mb-1'>AI Assistant - Công cụ hỗ trợ nghiên cứu khoa học</h3>
                    </div>

                    <div className='bg-gray-800 p-4 rounded-lg'>
                        <div className='flex items-center gap-2 mb-2'>
                            <span className='w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center'>T</span>
                            <span>tech.vn</span>
                        </div>
                        <h3 className='font-medium mb-1'>Research Assistant - Công nghệ AI trong trợ lý nghiên cứu</h3>
                        <div className='text-sm text-gray-400 mt-1'>+7 sources</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className='mb-8'>
                    <p className='text-xl mb-4'>
                        Research Assistant là viết tắt của <span className='font-semibold'>AI-powered Research Assistant</span>, một công cụ AI tiên tiến trong lĩnh vực hỗ trợ nghiên cứu khoa học do các nhà nghiên cứu phát triển và công bố vào năm 2023 <sup className='bg-gray-700 text-xs px-1 rounded'>1</sup> <sup className='bg-gray-700 text-xs px-1 rounded'>3</sup> <sup className='bg-gray-700 text-xs px-1 rounded'>8</sup>.
                    </p>
                </div>

                {/* Features Section */}
                <div className='mb-8'>
                    <h2 className='text-2xl font-bold mb-4'>Đặc điểm chính của Research Assistant</h2>

                    <ul className='space-y-6'>
                        <li className='flex gap-4'>
                            <span className='text-gray-400'>•</span>
                            <div>
                                <h3 className='font-semibold mb-1'>Xử lý ngôn ngữ tự nhiên:</h3>
                                <p>Research Assistant được huấn luyện trên một lượng lớn dữ liệu học thuật (như các bài báo, luận án và sách chuyên ngành) để hỗ trợ tìm kiếm và tổng hợp thông tin khoa học hiệu quả <sup className='bg-gray-700 text-xs px-1 rounded'>3</sup> <sup className='bg-gray-700 text-xs px-1 rounded'>8</sup>.</p>
                            </div>
                        </li>

                        <li className='flex gap-4'>
                            <span className='text-gray-400'>•</span>
                            <div>
                                <h3 className='font-semibold mb-1'>Tổng hợp thông tin (bidirectional):</h3>
                                <p>Khác với các công cụ trước đó, Research Assistant có khả năng phân tích và tổng hợp thông tin từ nhiều nguồn, giúp người dùng có cái nhìn toàn diện về các chủ đề nghiên cứu <sup className='bg-gray-700 text-xs px-1 rounded'>1</sup> <sup className='bg-gray-700 text-xs px-1 rounded'>5</sup>.</p>
                            </div>
                        </li>

                        <li className='flex gap-4'>
                            <span className='text-gray-400'>•</span>
                            <div>
                                <h3 className='font-semibold mb-1'>Kiến trúc Transformer:</h3>
                                <p>Research Assistant sử dụng kiến trúc Transformer, một mạng neural tiên tiến có khả năng xử lý các mối quan hệ phức tạp trong dữ liệu học thuật hiệu quả hơn so với các kiến trúc trước đây <sup className='bg-gray-700 text-xs px-1 rounded'>3</sup> <sup className='bg-gray-700 text-xs px-1 rounded'>4</sup> <sup className='bg-gray-700 text-xs px-1 rounded'>6</sup>.</p>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Search Bar */}
                <div className='relative bg-gray-800 rounded-lg p-2 flex items-center'>
                    <button className='p-2 text-gray-400'>
                        <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'>
                            <path fillRule='evenodd' d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z' clipRule='evenodd'></path>
                        </svg>
                    </button>
                    <input
                        type='text'
                        placeholder='Ask anything...'
                        className='bg-transparent border-none outline-none flex-1 px-2 text-white'
                    />
                    <div className='flex items-center gap-2'>
                        <button className='p-2 text-gray-400'>
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                            </svg>
                        </button>
                        <button className='p-2 text-gray-400'>
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13' />
                            </svg>
                        </button>
                        <button className='bg-blue-500 rounded-full p-2 ml-1 text-white'>
                            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'>
                                <path d='M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z' />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
