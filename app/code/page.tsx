import Link from 'next/link'
import { prisma } from '@/lib/db'
import BreadcrumbNav from '@/components/breadcrumb-nav'
import { Code2 } from 'lucide-react'
import CodeLibrary from './code-library'

async function getFiles() {
  try {
    const [code, logs] = await Promise.all([
      prisma.codeFile.findMany({ orderBy: [{ agent: 'asc' }, { filename: 'asc' }] }),
      prisma.logFile.findMany({ orderBy: [{ agent: 'asc' }, { filename: 'asc' }] }),
    ])
    return { code, logs }
  } catch {
    return { code: [], logs: [] }
  }
}

export default async function CodeIndexPage() {
  const { code, logs } = await getFiles()

  // Serialize for client component
  const codeData = code.map((c) => ({
    id: c.id,
    agent: c.agent,
    filename: c.filename,
    language: c.language,
    contentText: c.contentText,
    size: c.size,
  }))
  const logData = logs.map((l) => ({
    id: l.id,
    agent: l.agent,
    filename: l.filename,
    contentText: l.contentText,
    size: l.size,
  }))

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto">
      <BreadcrumbNav items={[{ label: 'Code Library' }]} />
      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-md gradient-brand text-white shadow-sm">
          <Code2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight">Code & report library</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            Every Python script and Markdown report produced by the pipeline agents. Use the search and filter
            controls to drill down by phase or filename, and expand any block to see syntax-highlighted source.
          </p>
        </div>
      </div>
      <CodeLibrary code={codeData} logs={logData} />
    </div>
  )
}
