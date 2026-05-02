'use client'

import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp, Terminal, Target, Package, Sparkles, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
// @ts-ignore - type mismatch in react-syntax-highlighter v15 with React 18
import { Prism } from 'react-syntax-highlighter'
// @ts-ignore
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { useTheme } from 'next-themes'
import type { CodeStep } from '@/lib/code-snippets'

const SyntaxHighlighter = Prism as any

function outputColorClass(type?: CodeStep['outputType']) {
  switch (type) {
    case 'metrics':
      return 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
    case 'json':
      return 'border-indigo-500/40 bg-indigo-500/5 dark:bg-indigo-500/10'
    case 'success':
      return 'border-teal-500/40 bg-teal-500/5 dark:bg-teal-500/10'
    case 'table':
      return 'border-fuchsia-500/40 bg-fuchsia-500/5 dark:bg-fuchsia-500/10'
    case 'log':
    default:
      return 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10'
  }
}

export default function CodeStepBlock({
  index,
  total,
  accent,
  step,
}: {
  index: number
  total: number
  accent: string
  step: CodeStep
}) {
  const { resolvedTheme } = useTheme()
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const isDark = resolvedTheme === 'dark'
  const style = isDark ? oneDark : oneLight

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText?.(step.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const outputClasses = outputColorClass(step.outputType)

  return (
    <div
      className="rounded-xl border border-border bg-card shadow-sm overflow-hidden card-hover-lift transition"
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 sm:p-5 border-b border-border bg-gradient-to-r from-card via-card to-muted/30">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-mono font-bold shrink-0 shadow-sm"
          style={{ backgroundColor: accent }}
        >
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-[10.5px] uppercase tracking-wider font-semibold mb-0.5"
            style={{ color: accent }}
          >
            {`Step ${index + 1} of ${total}`}
          </p>
          <h3 className="font-display font-semibold text-base sm:text-lg leading-tight">
            {step.title}
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            {step.objective}
          </p>
        </div>
      </div>

      {/* Initial condition */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-border bg-muted/20">
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 shrink-0">
            <Target className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
              Initial condition
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">{step.initialCondition}</p>
          </div>
        </div>
      </div>

      {/* Code toggle + body */}
      <div className="border-b border-border">
        <div className="flex items-center gap-3 px-4 sm:px-5 py-2.5 bg-muted/40">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
            <Terminal className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
              Code executed
            </p>
            <p className="text-[12px] font-mono text-foreground/80 truncate">
              {step.language} | {step.code.split('\n').length} lines
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2 text-xs gap-1.5"
            title="Copy code"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode((o) => !o)}
            className="h-8 px-3 text-xs gap-1.5"
          >
            {showCode ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>{showCode ? 'Hide code' : 'Show code'}</span>
          </Button>
        </div>
        {showCode && (
          <div className="max-h-[520px] overflow-auto text-[12.5px] leading-relaxed bg-card">
            <SyntaxHighlighter
              language={step.language}
              style={style}
              showLineNumbers
              wrapLongLines={false}
              customStyle={{
                margin: 0,
                padding: '14px 16px',
                background: 'transparent',
                fontSize: '12.5px',
              }}
            >
              {step.code}
            </SyntaxHighlighter>
          </div>
        )}
      </div>

      {/* Output */}
      {step.output && (
        <div className="px-4 sm:px-5 py-4 border-b border-border">
          <div className="flex items-start gap-2.5 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shrink-0">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                {step.outputLabel ?? 'Output'}
              </p>
            </div>
          </div>
          <pre
            className={`mt-1 rounded-lg border p-3 text-[12.5px] font-mono leading-relaxed overflow-x-auto whitespace-pre ${outputClasses}`}
          >
            {step.output}
          </pre>
        </div>
      )}

      {/* Deliverables */}
      {step.deliverables.length > 0 && (
        <div className="px-4 sm:px-5 py-4">
          <div className="flex items-start gap-2.5 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 shrink-0">
              <Package className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                What this step delivers
              </p>
            </div>
          </div>
          <ul className="space-y-1.5 ml-9.5 pl-0 sm:ml-9">
            {step.deliverables.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                <Sparkles
                  className="h-3.5 w-3.5 mt-0.5 shrink-0"
                  style={{ color: accent }}
                />
                <span className="text-foreground/85">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
