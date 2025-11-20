import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    // 입력 검증
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '메모 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: '메모 내용이 너무 깁니다. (최대 10,000자)' },
        { status: 400 }
      )
    }

    // API 키 확인
    const apiKey = process.env.GOOGLE_GENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // Gemini 클라이언트 초기화
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' })

    // 요약 프롬프트 구성
    const prompt = `다음 메모를 간결하고 명확하게 요약해 주세요. 핵심 내용만 3-5문장으로 정리해 주세요:\n\n${content}`

    // 요약 생성
    const result = await model.generateContent(prompt)
    const response = await result.response
    const summary = response.text()

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('메모 요약 중 오류 발생:', error)
    return NextResponse.json(
      {
        error: '메모 요약 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}

