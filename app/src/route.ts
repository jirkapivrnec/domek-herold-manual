// URL routing přes hash (funguje i na GitHub Pages bez serverových přesměrování):
//   #/naradi   #/dily   #/stavba/priprava   #/stavba/1a … #/stavba/10   #/stavba/hotovo
// Vzhled modelu je v parametru ?vzhled=drevo (výchozí je „návod“).
import { STEPS, type Step } from './data/steps'
import type { ViewMode } from './three/ShedScene'

export type View = 'tools' | 'parts' | 'build'
export type Route = { view: View; step: number; mode: ViewMode }

const VIEW_SLUG: Record<View, string> = { tools: 'naradi', parts: 'dily', build: 'stavba' }

export function stepSlug(s: Step) {
  if (s.manual === 'P') return 'priprava'
  if (s.manual === '✓') return 'hotovo'
  return `${s.manual}${s.sub ?? ''}`
}

const STEP_BY_SLUG = new Map(STEPS.map((s, i) => [stepSlug(s), i]))

export const DEFAULT_ROUTE: Route = { view: 'tools', step: 0, mode: 'navod' }

export function parseHash(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?')
  const [view, slug] = path.split('/').map((p) => decodeURIComponent(p).toLowerCase())
  const mode: ViewMode = new URLSearchParams(query).get('vzhled') === 'drevo' ? 'drevo' : 'navod'
  if (view === VIEW_SLUG.parts) return { view: 'parts', step: 0, mode }
  if (view === VIEW_SLUG.build) return { view: 'build', step: STEP_BY_SLUG.get(slug ?? '') ?? 0, mode }
  return { ...DEFAULT_ROUTE, mode }
}

export function toHash(r: Route) {
  const path = r.view === 'build' ? `${VIEW_SLUG.build}/${stepSlug(STEPS[r.step])}` : VIEW_SLUG[r.view]
  return `#/${path}${r.mode === 'drevo' ? '?vzhled=drevo' : ''}`
}
