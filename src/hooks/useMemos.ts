'use client'

import { useState, useEffect, useCallback, useMemo, useTransition } from 'react'
import { Memo, MemoFormData } from '@/types/memo'
import {
  fetchMemos,
  createMemo as createMemoAction,
  updateMemo as updateMemoAction,
  deleteMemo as deleteMemoAction,
} from '@/app/actions/memoActions'

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isPending, startTransition] = useTransition()

  // 메모 로드
  useEffect(() => {
    const loadMemos = async () => {
      setLoading(true)
      try {
        const loadedMemos = await fetchMemos()
        setMemos(loadedMemos)
      } catch (error) {
        console.error('Failed to load memos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMemos()
  }, [])

  // 메모 생성
  const createMemo = useCallback(
    async (formData: MemoFormData): Promise<void> => {
      startTransition(async () => {
        try {
          // Optimistic update
          const tempMemo: Memo = {
            id: 'temp-' + Date.now(),
            ...formData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          setMemos(prev => [tempMemo, ...prev])

          // Server action
          const newMemo = await createMemoAction(formData)
          setMemos(prev =>
            prev.map(memo => (memo.id === tempMemo.id ? newMemo : memo))
          )
        } catch (error) {
          console.error('Failed to create memo:', error)
          // Revert optimistic update
          setMemos(prev => prev.filter(memo => !memo.id.startsWith('temp-')))
        }
      })
    },
    []
  )

  // 메모 업데이트
  const updateMemo = useCallback(
    async (id: string, formData: MemoFormData): Promise<void> => {
      startTransition(async () => {
        try {
          // Optimistic update
          const existingMemo = memos.find(memo => memo.id === id)
          if (!existingMemo) return

          const optimisticMemo: Memo = {
            ...existingMemo,
            ...formData,
            updatedAt: new Date().toISOString(),
          }
          setMemos(prev =>
            prev.map(memo => (memo.id === id ? optimisticMemo : memo))
          )

          // Server action
          const updatedMemo = await updateMemoAction(id, formData)
          setMemos(prev =>
            prev.map(memo => (memo.id === id ? updatedMemo : memo))
          )
        } catch (error) {
          console.error('Failed to update memo:', error)
          // Reload memos on error
          const loadedMemos = await fetchMemos()
          setMemos(loadedMemos)
        }
      })
    },
    [memos]
  )

  // 메모 삭제
  const deleteMemo = useCallback(
    async (id: string): Promise<void> => {
      startTransition(async () => {
        try {
          // Optimistic update
          setMemos(prev => prev.filter(memo => memo.id !== id))

          // Server action
          await deleteMemoAction(id)
        } catch (error) {
          console.error('Failed to delete memo:', error)
          // Reload memos on error
          const loadedMemos = await fetchMemos()
          setMemos(loadedMemos)
        }
      })
    },
    []
  )

  // 메모 검색
  const searchMemos = useCallback((query: string): void => {
    setSearchQuery(query)
  }, [])

  // 카테고리 필터링
  const filterByCategory = useCallback((category: string): void => {
    setSelectedCategory(category)
  }, [])

  // 특정 메모 가져오기
  const getMemoById = useCallback(
    (id: string): Memo | undefined => {
      return memos.find(memo => memo.id === id)
    },
    [memos]
  )

  // 필터링된 메모 목록
  const filteredMemos = useMemo(() => {
    let filtered = memos

    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === selectedCategory)
    }

    // 검색 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        memo =>
          memo.title.toLowerCase().includes(query) ||
          memo.content.toLowerCase().includes(query) ||
          memo.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [memos, selectedCategory, searchQuery])

  // 모든 메모 삭제
  const clearAllMemos = useCallback(async (): Promise<void> => {
    startTransition(async () => {
      try {
        // Delete all memos one by one
        const deletePromises = memos.map(memo => deleteMemoAction(memo.id))
        await Promise.all(deletePromises)
        setMemos([])
        setSearchQuery('')
        setSelectedCategory('all')
      } catch (error) {
        console.error('Failed to clear all memos:', error)
      }
    })
  }, [memos])

  // 통계 정보
  const stats = useMemo(() => {
    const totalMemos = memos.length
    const categoryCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.category] = (acc[memo.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: totalMemos,
      byCategory: categoryCounts,
      filtered: filteredMemos.length,
    }
  }, [memos, filteredMemos])

  return {
    // 상태
    memos: filteredMemos,
    allMemos: memos,
    loading: loading || isPending,
    searchQuery,
    selectedCategory,
    stats,

    // 메모 CRUD
    createMemo,
    updateMemo,
    deleteMemo,
    getMemoById,

    // 필터링 & 검색
    searchMemos,
    filterByCategory,

    // 유틸리티
    clearAllMemos,
  }
}
