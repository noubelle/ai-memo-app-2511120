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

    // 태그 생성 프롬프트 구성
    const prompt = `다음 메모 내용을 분석하여 적절한 태그를 3-5개 생성해 주세요. 태그는 한글이나 영어로 작성할 수 있으며, 메모의 핵심 키워드를 반영해야 합니다. 태그는 쉼표로 구분하여 JSON 배열 형식으로 반환해 주세요. 예: ["태그1", "태그2", "태그3"]

메모 내용:
${content}

태그만 JSON 배열 형식으로 반환해 주세요:`

    // 태그 생성
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    // JSON 배열 파싱 시도
    let tags: string[] = []
    try {
      // JSON 배열 부분만 추출 (마크다운 코드 블록 제거)
      const jsonMatch = text.match(/\[[\s\S]*?\]/)
      if (jsonMatch) {
        tags = JSON.parse(jsonMatch[0])
      } else {
        // 쉼표로 구분된 태그 목록 파싱
        tags = text
          .split(',')
          .map(tag => tag.trim().replace(/^["']|["']$/g, ''))
          .filter(tag => tag.length > 0)
      }
    } catch {
      // JSON 파싱 실패 시 텍스트에서 태그 추출
      tags = text
        .split(/[,\n]/)
        .map(tag => tag.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, ''))
        .filter(tag => tag.length > 0)
        .slice(0, 5) // 최대 5개
    }

    // 태그 정규화 (소문자, 공백 제거, 중복 제거)
    tags = tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length <= 20)
      .filter((tag, index, self) => self.indexOf(tag) === index) // 중복 제거
      .slice(0, 5) // 최대 5개

    if (tags.length === 0) {
      return NextResponse.json(
        { error: '태그를 생성할 수 없습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('태그 생성 중 오류 발생:', error)
    return NextResponse.json(
      {
        error: '태그 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}

