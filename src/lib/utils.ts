export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function getGradeColor(grade: string): string {
  const map: Record<string, string> = {
    A: 'text-green-600',
    B: 'text-blue-600',
    C: 'text-yellow-600',
    D: 'text-orange-600',
    F: 'text-red-600',
  }
  return map[grade] ?? 'text-gray-600'
}

export function getWarmthColor(warmth: number): string {
  if (warmth <= 3) return '#ef4444'
  if (warmth <= 6) return '#eab308'
  return '#22c55e'
}

export function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}
