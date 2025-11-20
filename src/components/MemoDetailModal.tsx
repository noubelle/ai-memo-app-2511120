'use client'

import { useEffect, MouseEvent, useState } from 'react'
import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'
import { Memo, MEMO_CATEGORIES } from '@/types/memo'

const MarkdownPreview = dynamic(
  () =>
    import('@uiw/react-md-editor').then(mod => {
      const MDEditor = mod.default
      return MDEditor.Markdown || (() => <div>Markdown preview not available</div>)
    }),
  { ssr: false }
)

interface MemoDetailModalProps {
  memo: Memo | null
  isOpen: boolean
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
}

export default function MemoDetailModal({
  memo,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: MemoDetailModalProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 모달이 닫힐 때 요약 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setSummary(null)
      setSummaryError(null)
      setIsSummarizing(false)
    }
  }, [isOpen])

  const handleSummarize = async () => {
    if (!memo) return

    setIsSummarizing(true)
    setSummaryError(null)

    try {
      const response = await fetch('/api/memo-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: memo.content }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '요약 생성에 실패했습니다.')
      }

      setSummary(data.summary)
    } catch (error) {
      console.error('요약 생성 중 오류:', error)
      setSummaryError(
        error instanceof Error ? error.message : '요약 생성 중 오류가 발생했습니다.'
      )
    } finally {
      setIsSummarizing(false)
    }
  }

  if (!isOpen || !memo) {
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex gap-3 text-sm text-gray-500">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                {MEMO_CATEGORIES[memo.category as keyof typeof MEMO_CATEGORIES] || memo.category}
              </span>
              <span>업데이트: {formatDate(memo.updatedAt)}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{memo.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="메모 상세 닫기"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500">내용</h3>
            <div data-color-mode="light" className="mt-2">
              <MarkdownPreview source={memo.content} />
            </div>
          </div>

          {memo.tags.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-500">태그</h3>
              <div className="flex flex-wrap gap-2">
                {memo.tags.map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {summary && (
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-blue-900">요약</h3>
              <p className="text-sm text-blue-800 leading-relaxed">{summary}</p>
            </div>
          )}

          {summaryError && (
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-800">{summaryError}</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="inline-flex items-center rounded-lg border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed"
          >
            {isSummarizing ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                요약 중...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                요약하기
              </>
            )}
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => onEdit(memo)}
              className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              편집
            </button>
            <button
              onClick={() => {
                if (window.confirm('이 메모를 삭제하시겠습니까?')) {
                  onDelete(memo.id)
                }
              }}
              className="inline-flex items-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


