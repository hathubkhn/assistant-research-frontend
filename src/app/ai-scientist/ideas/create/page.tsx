import React from 'react';
import Link from 'next/link';

export default function CreateIdea() {
    return (
        <div className='max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto'>
            <div className='mb-8'>
                <Link href='/ai-scientist' className='text-blue-600 hover:text-blue-800 flex items-center mb-6'>
                    <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M10 19l-7-7m0 0l7-7m-7 7h18'></path>
                    </svg>
                    Back to Dashboard
                </Link>

                <h1 className='text-3xl font-semibold text-gray-800 mb-6'>Create New Research Idea</h1>

                <div className='bg-white shadow-sm rounded-xl p-6 border border-gray-200'>
                    <form className='space-y-6'>
                        <div>
                            <label htmlFor='title' className='block text-sm font-medium text-gray-700 mb-1'>
                                Research Title
                            </label>
                            <input
                                type='text'
                                id='title'
                                name='title'
                                className='block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                                placeholder='Enter a descriptive title for your research idea'
                            />
                        </div>

                        <div>
                            <label htmlFor='description' className='block text-sm font-medium text-gray-700 mb-1'>
                                Description
                            </label>
                            <textarea
                                id='description'
                                name='description'
                                rows={6}
                                className='block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                                placeholder='Describe your research idea in detail...'
                            ></textarea>
                        </div>

                        <div>
                            <label htmlFor='keywords' className='block text-sm font-medium text-gray-700 mb-1'>
                                Keywords
                            </label>
                            <input
                                type='text'
                                id='keywords'
                                name='keywords'
                                className='block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                                placeholder='Enter keywords separated by commas'
                            />
                            <p className='mt-1 text-sm text-gray-500'>
                                Add relevant keywords to help categorize your research idea
                            </p>
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Research Domain
                            </label>
                            <select
                                id='domain'
                                name='domain'
                                className='block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                            >
                                <option value=''>Select a domain</option>
                                <option value='computer_science'>Computer Science</option>
                                <option value='physics'>Physics</option>
                                <option value='biology'>Biology</option>
                                <option value='chemistry'>Chemistry</option>
                                <option value='mathematics'>Mathematics</option>
                                <option value='neuroscience'>Neuroscience</option>
                                <option value='environmental_science'>Environmental Science</option>
                                <option value='economics'>Economics</option>
                                <option value='medicine'>Medicine</option>
                                <option value='psychology'>Psychology</option>
                                <option value='other'>Other</option>
                            </select>
                        </div>

                        <div className='flex justify-end space-x-4 pt-4'>
                            <Link href='/ai-scientist' className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50'>
                                Cancel
                            </Link>
                            <button
                                type='submit'
                                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                            >
                                Create Research Idea
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
} 