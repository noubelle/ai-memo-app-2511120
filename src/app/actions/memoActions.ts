'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { Memo, MemoFormData } from '@/types/memo'

// DB 컬럼명을 타입 필드명으로 변환
function dbToMemo(row: any): Memo {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// 타입 필드명을 DB 컬럼명으로 변환
function memoToDb(data: MemoFormData): any {
  return {
    title: data.title,
    content: data.content,
    category: data.category,
    tags: data.tags || [],
  }
}

export async function fetchMemos(): Promise<Memo[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching memos:', error)
      throw error
    }

    return (data || []).map(dbToMemo)
  } catch (error) {
    console.error('Failed to fetch memos:', error)
    return []
  }
}

export async function createMemo(formData: MemoFormData): Promise<Memo> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('memos')
      .insert(memoToDb(formData))
      .select()
      .single()

    if (error) {
      console.error('Error creating memo:', error)
      throw error
    }

    revalidatePath('/')
    return dbToMemo(data)
  } catch (error) {
    console.error('Failed to create memo:', error)
    throw error
  }
}

export async function updateMemo(
  id: string,
  formData: MemoFormData
): Promise<Memo> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('memos')
      .update(memoToDb(formData))
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating memo:', error)
      throw error
    }

    revalidatePath('/')
    return dbToMemo(data)
  } catch (error) {
    console.error('Failed to update memo:', error)
    throw error
  }
}

export async function deleteMemo(id: string): Promise<void> {
  try {
    const supabase = createServerClient()
    const { error } = await supabase.from('memos').delete().eq('id', id)

    if (error) {
      console.error('Error deleting memo:', error)
      throw error
    }

    revalidatePath('/')
  } catch (error) {
    console.error('Failed to delete memo:', error)
    throw error
  }
}

export async function getMemoById(id: string): Promise<Memo | null> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      console.error('Error fetching memo:', error)
      throw error
    }

    return dbToMemo(data)
  } catch (error) {
    console.error('Failed to get memo:', error)
    return null
  }
}

