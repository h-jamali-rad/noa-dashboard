'use client'

import { useState } from 'react'
import { Copy, Check, Code2, ChevronDown, ChevronUp, FileCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
// @ts-ignore - type mismatch in react-syntax-highlighter v15 with React 18
import { Prism } from 'react-syntax-highlighter'
// @ts-ignore
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism'

const SyntaxHighlighter = Prism as any
import { useTheme } from 'next-themes'
import { humanFileSize } from '@/lib/format'

export default function CodeBlock({
  filename,
  code,
  language = 'python',
  size,
  defaultOpen = false,
  description,
}: {
  filename: string
  code: string
  language?: string
  size?: number
  defaultOpen?: boolean
  description?: string
}) {
  const { resolvedTheme } = useTheme()
  const [open, setOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText?.(code ?? '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const lineCount = (code ?? '').split('\n').length
  const isDark = resolvedTheme === 'dark'
  const style = isDark ? oneDark : oneLight

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5 bg-muted/40 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
          <FileCode className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-mono font-semibold truncate">{filename}</p>
          <p className="text-[11px] text-muted-foreground">
            {language} • {lineCount.toLocaleString()} lines
            {size ? ` • ${humanFileSize(size)}` : ''}
            {description ? ` • ${description}` : ''}
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
          variant="ghost"
          size="sm"
          onClick={() => setOpen((o) => !o)}
          className="h-8 px-2 text-xs gap-1.5"
          title={open ? 'Hide code' : 'Show code'}
        >
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{open ? 'Hide' : 'Show'}</span>
        </Button>
      </div>
      {open && (
        <div className="max-h-[700px] overflow-auto text-[12.5px] leading-relaxed">
          <SyntaxHighlighter
            language={language}
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
            {code ?? ''}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  )
}
