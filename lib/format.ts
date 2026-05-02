export function fmtNumber(n: number, digits = 0): string {
  if (typeof n !== 'number' || !isFinite(n)) return '0'
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function humanFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let val = bytes
  let i = 0
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024
    i++
  }
  return `${val.toFixed(val >= 100 ? 0 : 1)} ${units[i]}`
}

export function prettyFilename(name?: string): string {
  if (!name) return ''
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\.(png|tiff|tif|jpg|jpeg|svg|py|md|json|ipynb|txt|log)$/i, '')
    .trim()
}
