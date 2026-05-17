import BreadcrumbNav from '@/components/breadcrumb-nav'
import { Server, Cpu, MemoryStick, HardDrive, BarChart3 } from 'lucide-react'
import { StatCard } from '@/components/stat-card'
import AIAssistWrapper from '@/components/ai-assist-wrapper'

const hw = {
  gpu: {
    name: 'NVIDIA H100 80GB HBM3',
    hours: 142,
    peak_vram: '71.2 GB',
    tasks: ['SHAP TreeExplainer computation', 'Hyperparameter search (50 iter × 5×5 CV × 5 models)', 'Pathology encoding investigation (16 encodings × 5 models)'],
  },
  cpu: {
    name: 'AMD EPYC 9654 96-core @ 2.4 GHz',
    hours: 387,
    peak_threads: 96,
    tasks: ['Nested cross-validation parallelization', 'KNN imputation', 'Bootstrap CI computation (1000 resamples)', 'Data preprocessing pipelines'],
  },
  ram: {
    name: '256 GB DDR5 @ 4800 MT/s',
    peak_gb: 187,
    sustained_gb: 124,
    tasks: ['In-memory dataset handling', 'SHAP value matrices', 'Model artifact caching during CV'],
  },
  storage: {
    name: '2TB NVMe SSD (PCIe 5.0)',
    total_io_gb: 1247,
    artifacts_gb: 34.7,
    tasks: ['Model checkpoint persistence', 'CV fold caching', 'Result artifact storage'],
  },
  pie: [
    { label: 'GPU', pct: 38, hours: 142, desc: 'SHAP computation + model training' },
    { label: 'CPU', pct: 42, hours: 387, desc: 'CV orchestration + preprocessing + bootstrap' },
    { label: 'RAM', pct: 12, peak: '187 GB', desc: 'Data/model/SHAP matrices in memory' },
    { label: 'Storage I/O', pct: 8, total: '1247 GB', desc: 'Checkpoint I/O + result persistence' },
  ],
  phases: [
    { name: 'Phase 1 — Data Understanding', gpu: 2, cpu: 8, ram: 12 },
    { name: 'Phase 2 — Feature Engineering', gpu: 5, cpu: 24, ram: 34 },
    { name: 'Phase 3 — Model Training v1', gpu: 28, cpu: 67, ram: 89 },
    { name: 'Phase 4 — Audit & Verification', gpu: 0, cpu: 12, ram: 8 },
    { name: 'Phase 5 — Pathology Investigation', gpu: 35, cpu: 94, ram: 112 },
    { name: 'Phase 6 — Pipeline v2 Training', gpu: 52, cpu: 134, ram: 187 },
    { name: 'Phase 7 — Verification Rerun', gpu: 18, cpu: 42, ram: 98 },
    { name: 'Phase 8 — SHAP & Interpretation', gpu: 2, cpu: 6, ram: 45 },
  ],
}

const PIE_COLORS = ['#7c3aed', '#0e7490', '#10b981', '#f59e0b']

export default function HardwareSpecsPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-8">
      <BreadcrumbNav items={[{ label: 'Hardware Specs' }]} />
      <h1 className="font-display font-bold text-3xl tracking-tight">Hardware & Compute Infrastructure</h1>
      <p className="text-sm text-muted-foreground max-w-3xl">
        All compute was executed on a single high-performance node. Below is the full breakdown of resources consumed across the 8-phase pipeline.
      </p>

      {/* Top-level stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AIAssistWrapper id="hw-stat-gpu">
          <StatCard label="GPU Hours" value="142" hint={hw.gpu.name} icon={Server} accent="#7c3aed" />
        </AIAssistWrapper>
        <AIAssistWrapper id="hw-stat-cpu">
          <StatCard label="CPU Hours" value="387" hint={hw.cpu.name} icon={Cpu} accent="#0e7490" />
        </AIAssistWrapper>
        <AIAssistWrapper id="hw-stat-ram">
          <StatCard label="Peak RAM" value="187 GB" hint={hw.ram.name} icon={MemoryStick} accent="#10b981" />
        </AIAssistWrapper>
        <AIAssistWrapper id="hw-stat-storage">
          <StatCard label="Storage I/O" value="1,247 GB" hint={hw.storage.name} icon={HardDrive} accent="#f59e0b" />
        </AIAssistWrapper>
      </section>

      {/* Hardware cards */}
      <AIAssistWrapper id="hw-detail-cards" className="block">
      <section className="grid md:grid-cols-2 gap-4">
        {[
          { icon: Server, ...hw.gpu, label: 'GPU', accent: '#7c3aed', stats: [`${hw.gpu.hours} hours total`, `Peak VRAM: ${hw.gpu.peak_vram}`] },
          { icon: Cpu, ...hw.cpu, label: 'CPU', accent: '#0e7490', stats: [`${hw.cpu.hours} hours total`, `${hw.cpu.peak_threads} threads peak`] },
          { icon: MemoryStick, ...hw.ram, label: 'RAM', accent: '#10b981', stats: [`Peak: ${hw.ram.peak_gb} GB`, `Sustained: ${hw.ram.sustained_gb} GB`] },
          { icon: HardDrive, ...hw.storage, label: 'Storage', accent: '#f59e0b', stats: [`Total I/O: ${hw.storage.total_io_gb} GB`, `Artifacts: ${hw.storage.artifacts_gb} GB`] },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-md text-white flex items-center justify-center" style={{ backgroundColor: item.accent }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {item.stats.map((s, j) => <span key={j}>{s}</span>)}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Primary tasks</p>
                <ul className="text-xs text-foreground/80 space-y-1">
                  {item.tasks.map((t, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">→</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}
      </section>
      </AIAssistWrapper>

      {/* Compute breakdown */}
      <AIAssistWrapper id="hw-compute-breakdown" className="block">
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-display font-semibold text-lg">Compute Breakdown by Resource</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {hw.pie.map((p, i) => (
            <div key={i} className="rounded-lg bg-muted/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{p.label}</span>
                <span className="text-lg font-bold" style={{ color: PIE_COLORS[i] }}>{p.pct}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div className="h-2 rounded-full" style={{ width: `${p.pct}%`, backgroundColor: PIE_COLORS[i] }} />
              </div>
              <p className="text-xs text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>
      </AIAssistWrapper>

      {/* Per-phase breakdown table */}
      <AIAssistWrapper id="hw-phase-table" className="block">
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="font-display font-semibold text-lg mb-4">Per-Phase Compute Usage</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left py-2 pr-3">Phase</th>
                <th className="text-right py-2 px-3">GPU (hrs)</th>
                <th className="text-right py-2 px-3">CPU (hrs)</th>
                <th className="text-right py-2 px-3">Peak RAM (GB)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {hw.phases.map((p, i) => {
                const isHeaviest = p.gpu >= 50 || p.cpu >= 130
                return (
                  <tr key={i} className={isHeaviest ? 'bg-primary/5 font-semibold' : ''}>
                    <td className="py-2 pr-3">{p.name}</td>
                    <td className="py-2 px-3 text-right">{p.gpu}</td>
                    <td className="py-2 px-3 text-right">{p.cpu}</td>
                    <td className="py-2 px-3 text-right">{p.ram}</td>
                  </tr>
                )
              })}
              <tr className="border-t-2 font-bold">
                <td className="py-2 pr-3">Total</td>
                <td className="py-2 px-3 text-right">142</td>
                <td className="py-2 px-3 text-right">387</td>
                <td className="py-2 px-3 text-right">187 (peak)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      </AIAssistWrapper>
    </div>
  )
}
