import ArticlePreviewClient from '@/components/articles/article-preview-client'
import articleData from '@/article_a_extracted.json'

export const metadata = {
  title: 'Article A — Full Preview',
  description:
    'Full preview and supervisor review workspace for Article A (Impact of Histopathological Feature Encoding...).',
}

export default function ArticleAPage() {
  return (
    <ArticlePreviewClient
      articleId="article-a"
      articleLabel="Article A"
      articleData={articleData}
      docxPath="/downloads/article_a_pathology_encoding.docx"
      pdfPath="/downloads/article_a_pathology_encoding.pdf"
    />
  )
}
