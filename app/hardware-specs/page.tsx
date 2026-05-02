import BreadcrumbNav from '@/components/breadcrumb-nav'
import data from '@/data/content/extended_sections.json'

export default function HardwareSpecsPage() {
  const hw = data.hardware_specs
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-6">
      <BreadcrumbNav items={[{ label: 'Hardware Specs' }]} />
      <h1 className="font-display font-bold text-3xl tracking-tight">Hardware Specifications</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {[hw.gpu, hw.cpu, hw.ram].map((item, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <p className="font-semibold">{item.name}</p>
            <p className="text-sm text-muted-foreground mt-1">{item.rationale}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
