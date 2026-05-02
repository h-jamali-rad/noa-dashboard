import BreadcrumbNav from '@/components/breadcrumb-nav'
import data from '@/data/content/extended_sections.json'

export default function ReferencesPage() {
  const refs = [...data.references.literature_review_15_papers, ...data.references.additional_project_references]
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-6">
      <BreadcrumbNav items={[{ label: 'References' }]} />
      <h1 className="font-display font-bold text-3xl tracking-tight">References</h1>
      <ol className="space-y-2 text-sm">
        {refs.map((ref, i) => (
          <li key={i} className="rounded-md border bg-card px-3 py-2"><span className="font-mono text-xs text-muted-foreground mr-2">[{i + 1}]</span>{ref}</li>
        ))}
      </ol>
    </div>
  )
}
