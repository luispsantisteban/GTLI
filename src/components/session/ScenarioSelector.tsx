'use client'

import { SCENARIOS, DIFFICULTIES } from '@/src/types/scenarios'
import type { ScenarioKey, DifficultyKey } from '@/src/types/scenarios'
import { cn } from '@/src/lib/utils'

interface ScenarioSelectorProps {
  scenario: ScenarioKey | ''
  difficulty: DifficultyKey | ''
  onScenarioChange: (s: ScenarioKey) => void
  onDifficultyChange: (d: DifficultyKey) => void
}

export function ScenarioSelector({
  scenario,
  difficulty,
  onScenarioChange,
  onDifficultyChange,
}: ScenarioSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Choose a scenario</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.entries(SCENARIOS) as [ScenarioKey, typeof SCENARIOS[ScenarioKey]][]).map(([key, s]) => (
            <button
              key={key}
              onClick={() => onScenarioChange(key)}
              className={cn(
                'text-left p-4 rounded-xl border-2 transition-all',
                scenario === key
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <p className="font-medium text-gray-900 text-sm">{s.label}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.prospectDescription}</p>
              <span className="inline-block mt-2 text-xs font-medium text-indigo-600 uppercase tracking-wide">
                {s.language.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Choose difficulty</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(DIFFICULTIES) as [DifficultyKey, typeof DIFFICULTIES[DifficultyKey]][]).map(([key, d]) => (
            <button
              key={key}
              onClick={() => onDifficultyChange(key)}
              className={cn(
                'p-3 rounded-xl border-2 text-center transition-all',
                difficulty === key
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <p className="font-semibold text-sm text-gray-900">{d.label}</p>
              <div className="flex justify-center gap-0.5 mt-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 w-4 rounded-full',
                      i < (key === 'easy' ? 1 : key === 'price_sensitive' ? 2 : key === 'skeptical' ? 3 : 4)
                        ? 'bg-indigo-500'
                        : 'bg-gray-200'
                    )}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
