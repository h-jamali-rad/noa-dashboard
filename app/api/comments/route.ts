import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const articleId = request.nextUrl.searchParams.get('articleId')

    if (!articleId) {
      return NextResponse.json(
        { error: 'articleId query parameter is required.' },
        { status: 400 }
      )
    }

    const comments = await prisma.comment.findMany({
      where: { articleId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('GET /api/comments failed:', error)
    return NextResponse.json(
      { error: 'Unable to fetch comments.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const articleId = String(body.articleId ?? '').trim()
    const paragraphId = String(body.paragraphId ?? '').trim()
    const selectedText = String(body.selectedText ?? '').trim()
    const commentText = String(body.commentText ?? '').trim()
    const authorName = String(body.authorName ?? '').trim()

    if (!articleId || !paragraphId || !selectedText || !commentText || !authorName) {
      return NextResponse.json(
        {
          error:
            'articleId, paragraphId, selectedText, commentText, and authorName are all required.',
        },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.create({
      data: {
        articleId,
        paragraphId,
        selectedText,
        commentText,
        authorName,
      },
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('POST /api/comments failed:', error)
    return NextResponse.json(
      { error: 'Unable to create comment.' },
      { status: 500 }
    )
  }
}
