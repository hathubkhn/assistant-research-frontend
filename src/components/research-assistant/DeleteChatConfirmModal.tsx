'use client'

import React, { useEffect, useRef } from 'react'

interface DeleteChatConfirmModalProps {
  open: boolean
  message: string
  cancelLabel: string
  deleteLabel: string
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteChatConfirmModal({
  open,
  message,
  cancelLabel,
  deleteLabel,
  loading = false,
  onCancel,
  onConfirm,
}: DeleteChatConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-[100] flex items-center justify-center p-4'
      role='presentation'
    >
      <button
        type='button'
        aria-label='Close'
        className='absolute inset-0 bg-black/40'
        onClick={onCancel}
        disabled={loading}
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='delete-chat-title'
        className='relative w-full max-w-md rounded-2xl bg-white px-6 py-5 shadow-xl'
      >
        <p id='delete-chat-title' className='text-base font-semibold text-gray-900'>
          {message}
        </p>
        <div className='mt-6 flex justify-end gap-2'>
          <button
            ref={cancelRef}
            type='button'
            onClick={onCancel}
            disabled={loading}
            className='rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50'
          >
            {cancelLabel}
          </button>
          <button
            type='button'
            onClick={onConfirm}
            disabled={loading}
            className='rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50'
          >
            {deleteLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
