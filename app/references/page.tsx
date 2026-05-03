import BreadcrumbNav from '@/components/breadcrumb-nav'
import data from '@/data/content/extended_sections.json'

export default function ReferencesPage() {
  const kbRefs = [
    ...data.references.literature_review_15_papers,
    ...data.references.additional_project_references,
  ]

  const systematic = (data.references as any).systematic_review_studies as
    | { primary_mTESE_studies: string[]; salvage_mTESE_studies: string[] }
    | undefined

  const primary = systematic?.primary_mTESE_studies ?? []
  const salvage = systematic?.salvage_mTESE_studies ?? []
  const totalSystematic = primary.length + salvage.length

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-10">
      <BreadcrumbNav items={[{ label: 'References' }]} />

      <header className="space-y-2">
        <h1 className="font-display font-bold text-3xl tracking-tight">References</h1>
        <p className="text-sm text-muted-foreground">
          Curated bibliography supporting the NOA / micro-TESE knowledge base, systematic review,
          and clinical decision support system. APA-styled entries.
        </p>
      </header>

      {/* ─────────────────────────────  Knowledge Base  ───────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display font-semibold text-xl tracking-tight">
            Knowledge-Base References
          </h2>
          <span className="text-xs text-muted-foreground">{kbRefs.length} entries</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Core literature review papers and internal project documentation referenced throughout
          the dashboard.
        </p>
        <ol className="space-y-2 text-sm">
          {kbRefs.map((ref, i) => (
            <li
              key={`kb-${i}`}
              className="rounded-md border bg-card px-3 py-2 hover:border-primary/40 transition-colors"
            >
              <span className="font-mono text-xs text-muted-foreground mr-2">[{i + 1}]</span>
              {ref}
            </li>
          ))}
        </ol>
      </section>

      {/* ─────────────────────  Studies Included in Systematic Review  ───────────────────── */}
      {totalSystematic > 0 && (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display font-semibold text-xl tracking-tight">
              Studies Included in Systematic Review
            </h2>
            <span className="text-xs text-muted-foreground">{totalSystematic} studies</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Full set of studies aggregated for the Oxford-style scoping / systematic review on
            micro-TESE outcome prediction in non-obstructive azoospermia (NOA). Numbering continues
            sequentially across both groups.
          </p>

          {/* Group A — Primary m-TESE prediction studies */}
          <div className="space-y-2">
            <h3 className="font-display font-medium text-base tracking-tight text-muted-foreground">
              Primary micro-TESE prediction studies (1–{primary.length})
            </h3>
            <ol className="space-y-2 text-sm">
              {primary.map((ref, i) => (
                <li
                  key={`prim-${i}`}
                  className="rounded-md border bg-card px-3 py-2 hover:border-primary/40 transition-colors"
                >
                  <span className="font-mono text-xs text-muted-foreground mr-2">
                    [{i + 1}]
                  </span>
                  {ref}
                </li>
              ))}
            </ol>
          </div>

          {/* Group B — Salvage m-TESE studies */}
          {salvage.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-display font-medium text-base tracking-tight text-muted-foreground">
                Salvage micro-TESE studies ({primary.length + 1}–{primary.length + salvage.length})
              </h3>
              <ol className="space-y-2 text-sm">
                {salvage.map((ref, i) => (
                  <li
                    key={`salv-${i}`}
                    className="rounded-md border bg-card px-3 py-2 hover:border-primary/40 transition-colors"
                  >
                    <span className="font-mono text-xs text-muted-foreground mr-2">
                      [{primary.length + i + 1}]
                    </span>
                    {ref}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
