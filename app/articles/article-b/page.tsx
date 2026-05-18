import ArticlePreviewClient from '@/components/articles/article-preview-client'
import articleData from '@/article_b_extracted.json'

export const metadata = {
  title: 'Article B — Full Preview',
  description:
    'Full preview and supervisor review workspace for Article B (Multi-Method Explainable AI for Micro-TESE with Clinical Decision Support).',
}

export default function ArticleBPage() {
  return (
    <ArticlePreviewClient
      articleId="article-b"
      articleLabel="Article B"
      articleData={articleData}
      docxPath="/downloads/article_b_xai_cdss.docx"
      pdfPath="/downloads/article_b_xai_cdss.pdf"
    />
  )
}
