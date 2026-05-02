import BreadcrumbNav from '@/components/breadcrumb-nav'
import data from '@/data/content/extended_sections.json'

export default function PostDefenseActionsPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-6">
      <BreadcrumbNav items={[{ label: 'Post-Defense Corrective Actions' }]} />
      <div>
        <h1 className="font-display font-bold text-3xl tracking-tight">Post-Defense Corrective Actions</h1>
      </div>
      <ol className="space-y-3">
        {data.post_defense_actions.map((item, i) => (
          <li key={i} className="rounded-lg border bg-card p-4 text-sm">
            <span className="font-mono text-xs text-muted-foreground mr-2">{i + 1}.</span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  )
}
